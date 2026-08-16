/* فيديو «كيف تضيف مهارة» — مصدر التشغيل
   بعد رفع الفيديو إلى قناتك على يوتيوب:
   1) انسخ معرّف الفيديو من رابط المشاهدة (مثال: https://youtu.be/AbCdEfGhIjK → AbCdEfGhIjK)
   2) ضعه بين علامتي التنصيص في السطر HOWTO_VIDEO_YOUTUBE_ID أدناه
   3) بعدها يمكن حذف مجلد assets/videos بالكامل من الموقع لتخفيف الحجم */
const HOWTO_VIDEO_YOUTUBE_ID = '';

function howtoVideoEmbedHtml(autoplay) {
    const id = HOWTO_VIDEO_YOUTUBE_ID.trim();
    if (id) {
        return '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?rel=0&playsinline=1' + (autoplay ? '&autoplay=1' : '') + '"'
            + ' title="كيف تضيف مهارة إلى النموذج" loading="lazy" frameborder="0"'
            + ' style="aspect-ratio:16/9" class="w-full h-full"'
            + ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"'
            + ' allowfullscreen></iframe>';
    }
    return '<video src="assets/videos/how-to-add-a-skill.mp4" poster="assets/videos/how-to-add-a-skill-poster.jpg"'
        + ' controls playsinline preload="none"' + (autoplay ? ' autoplay' : '')
        + ' class="w-full h-full object-contain"></video>';
}
