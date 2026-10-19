/* ES5 so older WebViews can explain the required update before modern scripts. */
(function(){
 var supported=false;
 try{supported=!!(Array.prototype.at && window.structuredClone && window.AbortSignal && window.AbortSignal.timeout && Object.hasOwn);}catch(e){}
 if(!supported)document.addEventListener('DOMContentLoaded',function(){document.body.innerHTML='<main style="padding:24px;color:#e7f5d4;background:#102c22;font:18px sans-serif;min-height:100vh"><h1>Update Android System WebView</h1><p>ILEX.GG needs a current Android System WebView to run its card engine.</p><p>Update Android System WebView and Google Chrome in the Play Store, then reopen ILEX.GG.</p></main>';});
})();
