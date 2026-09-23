/**
 * scheduler.js — ReminderScheduler.
 *
 * Pure functions so they are fully unit-testable without Cloudflare.
 * The cron job calls `findDueReminders(now)` and sends at most one WhatsApp
 * message per user per local day, respecting each learner's preferred review
 * time and timezone (default Africa/Casablanca).
 */

const MINUTE = 60000;

/** Local date 'YYYY-MM-DD' for `ms` in IANA `tz` (no date library needed). */
export function localDate(ms, tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, dateStyle: 'short' }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

/**
 * Minutes-from-midnight in `tz` for `ms`, computed via Intl formatToParts.
 * Returns { hh, mm, minutes }.
 */
export function localTimeParts(ms, tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(ms));
    const hh = parseInt(parts.find((p) => p.type === 'hour').value, 10);
    const mm = parseInt(parts.find((p) => p.type === 'minute').value, 10);
    return { hh, mm, minutes: hh * 60 + mm };
  } catch {
    const d = new Date(ms);
    return { hh: d.getUTCHours(), mm: d.getUTCMinutes(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }
}

/**
 * Decide whether a learner should get their daily reminder now.
 * Rules:
 *   - notifications enabled
 *   - at least one due review item
 *   - local time >= preferred review time (send window: [pref, pref + 4h))
 *   - at most one reminder per local day
 */
export function shouldRemind({ settings, hasDue, now }) {
  if (!settings || settings.notifications_enabled !== 1) return false;
  if (!hasDue) return false;
  const tz = settings.timezone || 'Africa/Casablanca';
  const [ph, pm] = String(settings.preferred_review_time || '19:30').split(':').map(Number);
  const prefMinutes = (ph || 0) * 60 + (pm || 0);
  const nowMinutes = localTimeParts(now, tz).minutes;
  const today = localDate(now, tz);
  if (settings.last_reminder_date === today) return false;
  return nowMinutes >= prefMinutes && nowMinutes < prefMinutes + 4 * 60;
}

/**
 * Given due items, pick today's session items with priority:
 *   1. overdue reviews (next_review_at < start of today, earliest first)
 *   2. today's reviews
 *   3. newly introduced lessons (state 'new')
 * and cap at the user's daily limit.
 */
export function pickSessionItems(dueItemsRows, dailyLimit) {
  const overdue = [];
  const today = [];
  const fresh = [];
  for (const it of dueItemsRows) {
    if (it.review_count === 0 && it.fsrs_state === 'new') fresh.push(it);
    else if (it.review_count > 0) overdue.push(it); // already reviewed => a real review
    else today.push(it);
  }
  overdue.sort((a, b) => a.next_review_at - b.next_review_at);
  today.sort((a, b) => a.next_review_at - b.next_review_at);
  fresh.sort((a, b) => a.next_review_at - b.next_review_at);
  return [...overdue, ...today, ...fresh].slice(0, dailyLimit || 4);
}
