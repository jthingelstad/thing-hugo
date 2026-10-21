// The phone menu (Round 4): below 40rem the main nav folds behind a Menu
// button in the header. Without this script the nav stays open and wraps,
// which is the no-JS fallback. head.html marks <html class="js"> early so
// the folded nav doesn't flash open on load.
(function () {
  function start() {
    var button = document.querySelector('.site-nav__toggle');
    var nav = document.getElementById('site-nav');
    if (!button || !nav) return;
    function set(open) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    }
    button.addEventListener('click', function () {
      set(button.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        set(false);
        button.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
