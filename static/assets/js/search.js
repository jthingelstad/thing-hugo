// Start the Pagefind UI on #search. pagefind-ui.js is served by micro.blog's
// Pagefind Action at /pagefind/; without it (or without JS) the <noscript>
// fallback and the archive link remain.
(function () {
  function start() {
    var mount = document.getElementById('search');
    if (!mount || typeof PagefindUI === 'undefined') return;
    var q = new URLSearchParams(window.location.search).get('q');
    var ui = new PagefindUI({
      element: '#search',
      showSubResults: true,
      showImages: true,
      resetStyles: false,
    });
    if (q) ui.triggerSearch(q);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
