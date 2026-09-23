/**
 * templates.js — all learner-facing Arabic (فصحى) messages.
 * Warm, academic tone consistent with MahabatLhikma's editorial identity.
 */

export const T = {
  greeting:
    'وعليكم السلام 🌿\n\nأهلًا بك في رفيق المراجعة من منصة محبة الحكمة.\n\nأتذكّر عنك ما درستَه، وأعيده إليك في الوقت المناسب حتى يثبت في ذاكرتك.',

  askWhatStudied: 'ماذا درستَ اليوم على محبة الحكمة؟',

  help:
    '🧭 إليك ما يمكنك فعله هنا:\n\n' +
    '• «درست اليوم…» — لتسجيل درس من دروس محبة الحكمة في ذاكرتك.\n' +
    '• «مراجعة» — لبدء جلسة المراجعة المستحَقّة اليوم.\n' +
    '• «حالتي» — للاطلاع على قوة ذاكرتك في المفاهيم.\n' +
    '• «وقت المراجعة 19:30» — لضبط موعد التذكير اليومي.\n' +
    '• «إيقاف المراجعة» — لتعليق التذكيرات.\n' +
    '• «حذف الذاكرة» — لمسح بياناتك كليًا من النظام.\n' +
    '• «مساعدة» — لعرض هذه القائمة.\n\n' +
    'ملاحظة: هذه النسب تقدير داخلي لقوة تثبيت المفاهيم بناءً على مراجعاتك، وليست مقياسًا نفسيًا أو دراسيًا مطلقًا.\n\n' +
    '📖 مستودع المعرفة: https://mahabatlhikma.pages.dev/lessons',

  welcomeNewUser:
    'أهلًا بك 🌿\n\nهذا رفيق المراجعة الخاص بمنصة محبة الحكمة.\n\nادرس الدرس مرة واحدة على المنصة، وسنتكفّل نحن بإعادته إليك على شكل أسئلة قصيرة في الوقت المناسب وفق نظام التكرار المتباعد.\n\nاكتب «مساعدة» لاستكشاف ما يمكنك فعله.',

  lessonAdded: (title, firstReview) =>
    `✅ تمت إضافة درس «${title}» إلى ذاكرتك.\n\nسنذكّرك به وفق نظام التكرار المتباعد حتى يثبت في ذاكرتك.\n\n🧠 موعد المراجعة الأولى: ${firstReview}.`,

  lessonAlreadyAdded: (title, when) =>
    `هذا الدرس مضاف إلى ذاكرتك من قبل.\n\n🧠 مراجعتك القادمة لدرس «${title}»: ${when}.\n\nاكتب «مراجعة» إن أردت البدء الآن.`,

  lessonNotFound: (query, suggestions) => {
    if (suggestions && suggestions.length) {
      const list = suggestions.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
      return `لم أجد درسًا بهذا العنوان في محبة الحكمة.\n\nهل تقصد أحد هذه الدروس؟\n${list}\n\nاكتب اسم الدرس أو رقمه.`;
    }
    return 'لم أجد درسًا بهذا العنوان في محبة الحكمة.\n\nالنظام يعمل فقط مع الدروس الموجودة على المنصة. اكتب «الدروس» لاستعراض الدروس المتاحة.';
  },

  lessonList: (lessons) =>
    '📚 الدروس المتاحة حاليًا على محبة الحكمة:\n\n' +
    lessons.map((l, i) => `${i + 1}. ${l.title} — ${l.module}`).join('\n') +
    '\n\nاكتب اسم الدرس لتضيفه إلى ذاكرتك.',

  chooseLesson: (matches) =>
    'وجدت أكثر من درس مطابق. أيّها تقصد؟\n\n' +
    matches.map((l, i) => `${i + 1}. ${l.title}`).join('\n') +
    '\n\nاكتب الرقم أو اسم الدرس.',

  reviewIntro: (lessonTitle, count) =>
    `🧠 حان وقت المراجعة.\n\nاليوم سنراجع:\n«${lessonTitle}»\n\nأمامك ${count} أسئلة فقط.\n\nهل نبدأ؟ (اكتب: نعم)`,

  noReviewsDue:
    'لا توجد لديك مراجعات مستحَقّة الآن. 🌿\n\nذاكرتك تعمل بهدوء، وسنذكّرك حين يحين موعد المراجعة القادمة.\n\nإن درستَ درسًا جديدًا اليوم، أخبرني باسمه لأضيفه إلى ذاكرتك.',

  questionPrompt: (index, total, question) => `السؤال ${index}/${total}:\n${question}`,

  feedbackCorrect: (feedback) => `✅ صحيح.\n\n${feedback}`,
  feedbackMostly: (feedback) => `✅ إجابة صحيحة في معظمها.\n\n${feedback}`,
  feedbackPartial: (feedback) => `🟡 إجابة جزئية.\n\n${feedback}`,
  feedbackIncorrect: (feedback) => `❌ تحتاج إلى مراجعة.\n\n${feedback}`,
  feedbackUnclear:
    'لم أتمكن من فهم إجابتك بوضوح.\n\nحاول صياغتها في جملة كاملة تربط فيها بين المفاهيم الأساسية للسؤال.',

  sessionSummaryHeader: 'انتهت المراجعة. أحسنت العمل 🌿\n\n🧠 قوة ذاكرتك:',
  memoryBar: (label, pct) => `${label} ${bar(pct)} ${pct}%`,
  focusNote: (conceptName) => `📌 سنركّز في المراجعة القادمة على «${conceptName}».`,
  nextReviewNote: (when) => `📅 المراجعة القادمة: ${when}.`,
  memoryDisclaimer:
    '\nهذه النسب تقدير داخلي لقوة تثبيت المفاهيم وفق نموذج التكرار المتباعد، وليست مقياسًا مطلقًا لمستواك.',

  backToLesson: (url) =>
    `📖 تريد الرجوع إلى الدرس الكامل؟\nفتح الدرس على محبة الحكمة:\n${url}`,

  statusHeader: '🧠 حالة ذاكرتك:',
  statusEmpty:
    'ذاكرتك فارغة حتى الآن.\n\nادرس درسًا على محبة الحكمة ثم اضغط زر «🧠 أضف إلى ذاكرة الحكمة» داخل صفحة الدرس، أو اكتب «درست اليوم…» متبوعًا باسم الدرس.',

  timeSet: (time) => `⏰ تم ضبط موعد مراجعتك اليومية على الساعة ${time} (بتوقيت المغرب).`,
  timeInvalid: 'لم أفهم الوقت المطلوب. اكتبه بصيغة مثل: «وقت المراجعة 19:30».',

  notificationsPaused:
    'تم إيقاف التذكيرات مؤقتًا.\n\nلن نراسلك حتى تكتب «تفعيل المراجعة». بياناتك ومراجعاتك محفوظة.',
  notificationsResumed: '✅ تم تفعيل التذكيرات من جديد. بالتوفيق في مراجعتك 🌿',

  deleteConfirm:
    '⚠️ طلبتَ حذف ذاكرتك بالكامل.\n\nسيؤدي ذلك إلى مسح برنامج المراجعة وسجلّ إجاباتك نهائيًا.\n\nإن كنت متأكدًا اكتب: «نعم احذف ذاكرتي»',
  deleteDone:
    'تم حذف بياناتك نهائيًا من نظام المراجعة.\n\nشكرًا لك، وتبقى دروس محبة الحكمة في خدمتك دائمًا 🌿\nhttps://mahabatlhikma.pages.dev/lessons',
  deleteCancelled: 'تم إلغاء طلب الحذف. بياناتك محفوظة كما هي.',

  fallback:
    'لم أفهم قصدك تمامًا.\n\nيمكنك أن تقول مثلًا: «درست اليوم هوية الشخص» أو «مراجعة» أو «حالتي».\nاكتب «مساعدة» لعرض كل الإمكانات.',

  sessionExpired:
    'انتهت جلسة المراجعة السابقة.\n\nاكتب «مراجعة» لبدء جلسة جديدة.',
};

/** 10-cell memory bar: ██████░░░░ */
export function bar(pct) {
  const filled = Math.round(Math.max(0, Math.min(100, pct)) / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

/** Human-friendly Arabic relative time. */
export function relativeArabic(fromMs, toMs) {
  const days = Math.round((toMs - fromMs) / 86400000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'غدًا';
  if (days === 2) return 'بعد يومين';
  if (days <= 10) return `بعد ${days} أيام`;
  if (days <= 30) return `بعد ${Math.round(days / 7)} أسابيع`;
  return `بعد ${Math.round(days / 30)} شهر`;
}

/** Map evaluation result -> feedback template. */
export function feedbackFor(evaluation) {
  const fb = evaluation.feedback || '';
  switch (evaluation.result) {
    case 'correct': return T.feedbackCorrect(fb);
    case 'mostly_correct': return T.feedbackMostly(fb);
    case 'partially_correct': return T.feedbackPartial(fb);
    case 'incorrect': return T.feedbackIncorrect(fb);
    default: return T.feedbackUnclear;
  }
}
