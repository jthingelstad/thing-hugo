// Listen, on a post Jamie read aloud (2.0.31). listen.html writes a link to
// the recording; this makes it a button that plays and pauses the post's own
// <audio> (micro.blog's, hidden at the end of the body), showing the time
// left and, in its fill, how far along it is. A phone's lock screen shows
// the post's title. Without this script the link opens the recording.
(function () {
  function clock(s) {
    s = Math.max(0, Math.round(s || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('a.listen__play'), function (link) {
      var src = link.getAttribute('href');
      var audio = Array.prototype.find.call(document.querySelectorAll('audio'), function (a) {
        return a.getAttribute('src') === src;
      });
      if (!audio) {
        audio = new Audio();
        audio.preload = 'none';
        audio.src = src;
      }
      var button = document.createElement('button');
      button.type = 'button';
      button.className = link.className;
      button.innerHTML = link.innerHTML;
      link.parentNode.replaceChild(button, link);
      var label = button.querySelector('.listen__label');
      var time = button.querySelector('.listen__time');

      function show() {
        var playing = !audio.paused && !audio.ended;
        button.classList.toggle('is-playing', playing);
        label.textContent = playing ? 'Pause' : 'Listen';
        if (!audio.duration || !isFinite(audio.duration)) return;
        if (!time) {
          time = document.createElement('span');
          time.className = 'listen__time';
          button.appendChild(time);
        }
        var done = audio.ended || (audio.paused && audio.currentTime === 0);
        time.textContent = clock(done ? audio.duration : audio.duration - audio.currentTime);
        button.style.setProperty('--listen-progress', (done ? 0 : (audio.currentTime / audio.duration) * 100) + '%');
      }

      ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(function (e) {
        audio.addEventListener(e, show);
      });
      audio.addEventListener('ended', function () { audio.currentTime = 0; });
      button.addEventListener('click', function () {
        if (audio.paused) {
          if ('mediaSession' in navigator && window.MediaMetadata) {
            navigator.mediaSession.metadata = new MediaMetadata({ title: link.getAttribute('data-title') || document.title, artist: 'Jamie Thingelstad' });
          }
          audio.play();
        } else {
          audio.pause();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
