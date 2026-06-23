<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>YurMar</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="YurMarDev — Fullstack Web Developer. Разработка корпоративных сайтов, React SPA, Laravel API, Bitrix и WordPress. Более 12 лет опыта.">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" href="/images/logo.png" sizes="any">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"></noscript>
    <link rel="preload" as="image" href="/images/logo.png">
    @viteReactRefresh
    @production
        @php
            $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
            $cssFile = $manifest['resources/css/app.css']['file'] ?? null;
        @endphp
        @if($cssFile)
        <link rel="preload" as="style" href="/build/{{ $cssFile }}" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="/build/{{ $cssFile }}"></noscript>
        @endif
        @vite(['resources/js/app.tsx'])
    @else
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @endproduction
</head>
<body>
<div id="app"></div>
<!-- Yandex Metrika: deferred until after page load to avoid blocking main thread -->
<noscript><div><img src="https://mc.yandex.ru/watch/28095735" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<script>
window.addEventListener('load', function() {
    setTimeout(function() {
        (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');

        ym(28095735, 'init', {webvisor:true, clickmap:true, referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
    }, 1500);
});
</script>
</body>
</html>
