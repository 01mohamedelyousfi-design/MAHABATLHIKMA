/**
 * bot.js — the conversation orchestrator.
 *
 * Pure orchestration over repositories + evaluator + templates.
 * No Cloudflare or WhatsApp specifics here: the caller passes
 * (waId, text, now) and receives an array of reply strings.
 */

import { parseIntent, matchLesson } from './intents.js';
import { T, bar, relativeArabic, feedbackFor } from './templates.js';
import { retrievability, reviewCard, ratingFromScore } from './fsrs.js';
import { pickSessionItems } from './scheduler.js';

const SESSION_TTL = 30 * 60000; // open sessions expire after 30 min

export class Bot {
  /**
   * @param {object} deps { lessons, users, reviews, sessions, evaluator, siteUrl }
   */
  constructor(deps) {
    this.lessons = deps.lessons;
    this.users = deps.users;
    this.reviews = deps.reviews;
    this.sessions = deps.sessions;
    this.evaluator = deps.evaluator;
    this.siteUrl = deps.siteUrl || 'https://mahabatlhikma.pages.dev';
  }

  /**
   * Handle one incoming learner message.
   * @returns {Promise<string[]>} ordered reply messages
   */
  async handleMessage(waId, text, now = Date.now()) {
    const user = await this.users.getOrCreate(waId, now);
    const intent = parseIntent(text);

    let session = await this.sessions.openSession(user.id);
    if (session && now - session.updated_at > SESSION_TTL) {
      await this.sessions.close(session.id, 'expired', now);
      session = null;
    }

    // --- Active session contexts take precedence ---
    if (session && session.kind === 'confirm_delete') {
      if (intent.name === 'confirm_delete') {
        await this.sessions.close(session.id, 'done', now);
        await this.users.deleteAll(user.id);
        return [T.deleteDone];
      }
      await this.sessions.close(session.id, 'done', now);
      return [T.deleteCancelled];
    }

    if (session && session.kind === 'choose_lesson') {
      const handled = await this._handleLessonChoice(user, session, intent, text, now);
      if (handled) return handled;
      // fall through to global intents if the user wrote something else
    }

    if (session && session.kind === 'review' && session.lesson_id) {
      // Active review: almost everything is an answer.
      if (!['pause', 'resume', 'request_delete', 'help'].includes(intent.name)) {
        return await this._handleAnswer(user, session, text, now);
      }
    }

    if (session && session.kind === 'review' && !session.lesson_id && intent.name === 'start_review') {
      return await this._beginSession(user, session, now);
    }

    // --- Global intents ---
    switch (intent.name) {
      case 'empty':
        return [T.fallback];
      case 'greeting':
        return user._isNew
          ? [T.welcomeNewUser]
          : [T.greeting, T.askWhatStudied];
      case 'help':
        return [T.help];
      case 'list_lessons':
        return [T.lessonList(this.lessons.listCatalog())];
      case 'add_lesson_token':
        return await this._registerLesson(user, intent.payload.lessonId, now);
      case 'claim_lesson':
        return await this._claimLesson(user, intent.payload.query, now);
      case 'start_review':
        return await this._startReview(user, now);
      case 'status':
        return await this._status(user, now);
      case 'set_time': {
        const hh = parseInt(intent.payload.hh, 10);
        const mm = parseInt(intent.payload.mm, 10);
        if (hh > 23 || mm > 59) return [T.timeInvalid];
        await this.users.setReviewTime(user.id,
          `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
        return [T.timeSet(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)];
      }
      case 'pause':
        await this.users.setNotifications(user.id, false);
        return [T.notificationsPaused];
      case 'resume':
        await this.users.setNotifications(user.id, true);
        return [T.notificationsResumed];
      case 'request_delete':
      case 'confirm_delete':
        await this.sessions.create(user.id, 'confirm_delete', {}, now);
        return [T.deleteConfirm];
      case 'unknown':
      default: {
        // Natural-language lesson mention without a command prefix.
        const { exact, matches } = matchLesson(intent.payload?.text || '', this.lessons.listCatalog());
        if (exact) return await this._registerLesson(user, exact.id, now);
        if (matches.length >= 1) {
          await this.sessions.create(user.id, 'choose_lesson',
            { payload: { candidates: matches.map((m) => m.id) } }, now);
          return matches.length === 1
            ? [T.lessonNotFound(intent.payload.text, matches)]
            : [T.chooseLesson(matches)];
        }
        return user._isNew ? [T.welcomeNewUser] : [T.fallback];
      }
    }
  }

  // === PART 2 ===

  /** Register a catalog lesson for the user (Flow A / confirmed choice). */
  async _registerLesson(user, lessonId, now) {
    const lesson = this.lessons.getCatalogLesson(lessonId);
    if (!lesson) return [T.lessonNotFound(lessonId, [])]; // never invent lessons

    await this.lessons.syncCatalog();

    if (await this.reviews.hasProgram(user.id, lessonId)) {
      const nxt = await this.reviews.nextReviewForLesson(user.id, lessonId);
      return [T.lessonAlreadyAdded(lesson.title, relativeArabic(now, nxt || now))];
    }

    const items = this.lessons.getSeedItems(lessonId);
    const { created, firstDue } = await this.reviews.createProgram(user.id, lessonId, items, now);
    if (created === 0) return [T.lessonNotFound(lessonId, [])];

    return [
      T.lessonAdded(lesson.title, relativeArabic(now, firstDue ?? now)),
      T.backToLesson(this.siteUrl + lesson.url),
    ];
  }

  /** Free-text lesson claim (Flow B): match, disambiguate, or reject. */
  async _claimLesson(user, query, now) {
    const { exact, matches } = matchLesson(query, this.lessons.listCatalog());
    if (exact) return await this._registerLesson(user, exact.id, now);
    if (matches.length) {
      await this.sessions.create(user.id, 'choose_lesson',
        { payload: { candidates: matches.map((m) => m.id) } }, now);
      return matches.length === 1
        ? [T.lessonNotFound(query, matches)]
        : [T.chooseLesson(matches)];
    }
    return [T.lessonNotFound(query, [])];
  }

  /** Resolve a choice inside an open choose_lesson session. */
  async _handleLessonChoice(user, session, intent, text, now) {
    const payload = session.payload ? JSON.parse(session.payload) : {};
    const candidates = (payload.candidates || [])
      .map((id) => this.lessons.getCatalogLesson(id))
      .filter(Boolean);
    if (!candidates.length) {
      await this.sessions.close(session.id, 'expired', now);
      return null;
    }

    // numeric choice?
    const m = String(text).trim().match(/^(\d{1,2})$/);
    let chosen = null;
    if (m) {
      const idx = parseInt(m[1], 10);
      if (idx >= 1 && idx <= candidates.length) chosen = candidates[idx - 1];
    } else {
      const { exact } = matchLesson(text, candidates);
      if (exact) chosen = exact;
    }
    if (!chosen) return null;

    await this.sessions.close(session.id, 'done', now);
    return await this._registerLesson(user, chosen.id, now);
  }

  /** Build the due-review intro and open a pending session. */
  async _startReview(user, now) {
    const settings = await this.users.getSettings(user.id);
    const due = await this.reviews.dueItems(user.id, now, 20);
    const items = pickSessionItems(due, settings?.daily_review_limit || 4);
    if (!items.length) return [T.noReviewsDue];

    await this.sessions.create(user.id, 'review', {
      itemIds: items.map((i) => i.id),
    }, now);

    const lessonIds = [...new Set(items.map((i) => i.lesson_id))];
    const titles = lessonIds
      .map((id) => this.lessons.getCatalogLesson(id)?.title || id)
      .join('، ');
    return [T.reviewIntro(titles, items.length)];
  }

  /** Begin asking questions from a pending review session. */
  async _beginSession(user, session, now) {
    const ids = JSON.parse(session.item_ids || '[]');
    if (!ids.length) {
      await this.sessions.close(session.id, 'done', now);
      return [T.noReviewsDue];
    }
    const first = await this.reviews.getItem(user.id, ids[0]);
    if (!first) {
      await this.sessions.close(session.id, 'done', now);
      return [T.noReviewsDue];
    }
    await this.sessions.update(session.id, {
      lesson_id: first.lesson_id, current_index: 0,
    }, now);
    return [T.questionPrompt(1, ids.length, first.question)];
  }

  /** Evaluate an answer inside an active review session. */
  async _handleAnswer(user, session, text, now) {
    const ids = JSON.parse(session.item_ids || '[]');
    const idx = session.current_index;
    if (idx >= ids.length) {
      await this.sessions.close(session.id, 'done', now);
      return [T.sessionExpired];
    }

    const item = await this.reviews.getItem(user.id, ids[idx]);
    if (!item) {
      await this.sessions.close(session.id, 'done', now);
      return [T.sessionExpired];
    }

    // 1) Evaluate against the item's expected points.
    const evaluation = await this.evaluator.evaluate(
      {
        question: item.question,
        expectedPoints: JSON.parse(item.expected_points || '[]'),
        type: item.question_type,
      },
      text
    );

    // 2) Update FSRS state.
    const rating = ratingFromScore(evaluation.score);
    const card = reviewCard({
      state: item.fsrs_state, stability: item.stability, difficulty: item.difficulty,
      lastReviewAt: item.last_review_at, nextReviewAt: item.next_review_at,
      reviewCount: item.review_count, lapses: item.lapses,
    }, rating, now);
    await this.reviews.applyReview(item.id, card);
    await this.reviews.addEvent(user.id, item.id, text, evaluation, now);

    const replies = [feedbackFor(evaluation)];

    // 3) Next question or session summary.
    if (idx + 1 < ids.length) {
      const nextItem = await this.reviews.getItem(user.id, ids[idx + 1]);
      await this.sessions.update(session.id, { current_index: idx + 1 }, now);
      if (nextItem) replies.push(T.questionPrompt(idx + 2, ids.length, nextItem.question));
    } else {
      await this.sessions.close(session.id, 'done', now);
      replies.push(await this._sessionSummary(user, item.lesson_id, now));
    }
    return replies;
  }

  /** End-of-session memory summary (قوة الذاكرة), concept-level. */
  async _sessionSummary(user, lessonId, now) {
    const rows = await this.reviews.memoryByConcept(user.id);
    const inLesson = rows.filter((r) => r.lesson_id === lessonId);
    const lines = [];
    let weakest = null;
    const seen = new Set();
    for (const r of inLesson) {
      const key = r.lesson_id + ':' + r.concept_id;
      const days = r.last_review_at ? Math.max(0, (now - r.last_review_at) / 86400000) : 0;
      // Unreviewed items stay at 0%; reviewed items show current retrievability.
      const strength = r.review_count > 0 && r.stability > 0
        ? Math.round(retrievability(days, r.stability) * 100)
        : 0;
      if (r.review_count > 0 && (!weakest || strength < weakest.strength)) {
        weakest = { name: r.concept_name, strength };
      }
      if (r.review_count === 0 || seen.has(key)) continue; // one line per reviewed concept
      seen.add(key);
      lines.push(T.memoryBar(r.concept_name, strength));
    }
    const nxt = await this.reviews.nextReviewForLesson(user.id, lessonId);
    const parts = [T.sessionSummaryHeader, ...lines];
    if (weakest && weakest.strength < 70) parts.push('', T.focusNote(weakest.name));
    if (nxt && nxt > now) parts.push(T.nextReviewNote(relativeArabic(now, nxt)));
    parts.push(T.memoryDisclaimer);
    const lesson = this.lessons.getCatalogLesson(lessonId);
    if (lesson) parts.push('', T.backToLesson(this.siteUrl + lesson.url));
    return parts.join('\n');
  }

  /** «حالتي» — global memory state, one line per concept. */
  async _status(user, now) {
    const rows = await this.reviews.memoryByConcept(user.id);
    if (!rows.length) return [T.statusEmpty];
    // Aggregate per concept: best current strength among its items.
    const byConcept = new Map();
    for (const r of rows) {
      const key = r.lesson_id + ':' + r.concept_id;
      const days = r.last_review_at ? Math.max(0, (now - r.last_review_at) / 86400000) : 0;
      const strength = r.review_count > 0 && r.stability > 0
        ? Math.round(retrievability(days, r.stability) * 100)
        : 0;
      const prev = byConcept.get(key);
      if (!prev || strength > prev.strength) {
        byConcept.set(key, { name: r.concept_name, strength });
      }
    }
    const lines = [...byConcept.values()].map((c) => T.memoryBar(c.name, c.strength));
    const nxt = await this.reviews.nextReviewAt(user.id);
    const parts = [T.statusHeader, ...lines, T.memoryDisclaimer];
    if (nxt && nxt > now) parts.push('', T.nextReviewNote(relativeArabic(now, nxt)));
    return [parts.join('\n')];
  }
}
