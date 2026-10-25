// YouTube videos, click to play (2.0.31). partials/youtube.html draws each
// video as its thumbnail, linked to the video on YouTube; a click here swaps
// in the player from youtube-nocookie.com, playing, and nothing loads from
// YouTube's player before that. A click with a modifier key (a new tab) and
// the page without this script both follow the link. embed-scripts.html
// writes this only on a page with a video.
(function () {
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest && e.target.closest('.video-card__link');
    if (!link) return;
    var card = link.closest('.video-card');
    var id = card && card.getAttribute('data-youtube');
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    e.preventDefault();
    var params = ['autoplay=1'];
    ['start', 'end'].forEach(function (key) {
      var value = card.getAttribute('data-' + key);
      if (value && /^\d+$/.test(value)) params.push(key + '=' + value);
    });
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?' + params.join('&');
    frame.title = card.getAttribute('data-title') || 'YouTube video';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    card.textContent = '';
    card.appendChild(frame);
    card.classList.add('is-playing');
    frame.focus();
  });
})();
