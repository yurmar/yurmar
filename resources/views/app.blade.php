<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>YurMar</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" href="/images/logo.png" sizes="any">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"></noscript>
    <link rel="preload" as="image" href="/images/logo.png">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body>
<!-- Static LCP shell: visible immediately before React mounts, removed after -->
<div id="hero-shell" style="position:fixed;inset:0;z-index:999;background:linear-gradient(135deg,#050d1f 0%,#0a1628 40%,#0d2040 70%,#081424 100%);display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55)"></div>
    <h1 style="position:relative;font-family:Inter,system-ui,sans-serif;font-size:clamp(3rem,8vw,4.5rem);font-weight:700;color:#fff;text-align:center;letter-spacing:-0.025em;margin:0;line-height:1.1">YurMarDev</h1>
</div>
<script>
(function(){
    var app=document.getElementById('app');
    var shell=document.getElementById('hero-shell');
    function removeShell(){
        if(!shell)return;
        shell.style.transition='opacity 0.25s';
        shell.style.opacity='0';
        setTimeout(function(){shell&&shell.remove();},250);
    }
    if(app&&app.firstChild){removeShell();return;}
    var obs=new MutationObserver(function(){
        if(app&&app.firstChild){removeShell();obs.disconnect();}
    });
    if(app)obs.observe(app,{childList:true});
})();
</script>
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
