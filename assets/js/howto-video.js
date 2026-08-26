/* فيديو «كيف تضيف مهارة» — يُبثّ من قناة اليوتيوب
   لتحديث الفيديو مستقبلاً: انسخ معرّف الرابط الجديد
   (مثال: https://youtu.be/AbCdEfGhIjK → AbCdEfGhIjK) وضعه في السطر أدناه */
const HOWTO_VIDEO_YOUTUBE_ID = '_EcnPFQcLiA';

function howtoVideoEmbedHtml(autoplay) {
    return '<iframe src="https://www.youtube-nocookie.com/embed/' + HOWTO_VIDEO_YOUTUBE_ID + '?rel=0&playsinline=1' + (autoplay ? '&autoplay=1' : '') + '"'
        + ' title="كيف تضيف مهارة إلى النموذج" loading="lazy" frameborder="0"'
        + ' style="aspect-ratio:16/9" class="w-full h-full"'
        + ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"'
        + ' allowfullscreen></iframe>';
}
