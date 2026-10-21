// On This Day ({{< on-this-day >}}): the posts from today's date in other
// years, newest year first, from the theme's day files (partials/
// otd-days.html: /otd/<MM-DD>.json, built with the blog). The date is the
// blog's own, US Central, as in its URLs. ?d=MM-DD shows another day, and
// the day links step through the calendar. Posts are search's cards
// (search-result) under a heading a year. Post text goes in with
// textContent, never as HTML. There are no counts, by design.
(function () {
  var TZ = 'America/Chicago';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function safeURL(u) {
    try {
      var url = new URL(u, window.location.href);
      return url.origin === window.location.origin || url.protocol === 'https:' ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  // Today in Central time: its year and "MM-DD".
  function today() {
    var ymd = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
    return { year: parseInt(ymd.slice(0, 4), 10), day: ymd.slice(5, 10) };
  }

  // "MM-DD" as a date in 2000, a leap year, so 02-29 is a day too; null
  // for anything else.
  function asDate(day) {
    var m = /^(\d{2})-(\d{2})$/.exec(day || '');
    if (!m) return null;
    var d = new Date(Date.UTC(2000, +m[1] - 1, +m[2], 12));
    return d.getUTCMonth() === +m[1] - 1 && d.getUTCDate() === +m[2] ? d : null;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function step(day, n) {
    var d = asDate(day);
    d.setUTCDate(d.getUTCDate() + n);
    return pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  function label(day) {
    return asDate(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  }

  function start() {
    var root = document.getElementById('otd');
    if (!root) return;
    var nav = root.querySelector('[data-otd-nav]');
    var status = root.querySelector('[data-otd-status]');
    var list = root.querySelector('[data-otd-list]');
    var now = today();
    var asked = new URLSearchParams(window.location.search).get('d');
    var day = asDate(asked) ? asked : now.day;
    var isToday = day === now.day;

    function say(text, archive) {
      status.textContent = text;
      if (archive) {
        status.appendChild(document.createTextNode(' The '));
        var a = el('a', '', 'archive');
        a.href = '/archive/';
        status.appendChild(a);
        status.appendChild(document.createTextNode(' lists every post.'));
      }
    }

    // Today's date is the page itself, with no ?d=.
    function dayLink(a, d, arrow, before) {
      a.href = d === now.day ? window.location.pathname : '?d=' + d;
      a.textContent = before ? arrow + ' ' + label(d) : label(d) + ' ' + arrow;
    }

    root.querySelector('[data-otd-day]').textContent = isToday ? 'Today, ' + label(day) : label(day);
    dayLink(root.querySelector('[data-otd-prev]'), step(day, -1), '←', true);
    dayLink(root.querySelector('[data-otd-next]'), step(day, 1), '→', false);
    nav.hidden = false;

    // A photo through the resizer's width form, which keeps its shape for
    // search's 4:3 slot (partials/photo-src.html).
    function photo(src) {
      var proxy = root.getAttribute('data-photo-proxy');
      var uploads = (root.getAttribute('data-uploads') || '').split(' ');
      for (var i = 0; proxy && i < uploads.length; i++) {
        if (uploads[i] && src.indexOf(uploads[i]) === 0) return proxy + '400x/' + src;
      }
      return src;
    }

    function card(post) {
      var url = safeURL(post.u);
      if (!url) return null;
      var li = el('li', 'search-result');
      var text = el('div', 'search-result__text');
      if (post.t) {
        var t = el('a', 'search-result__title', post.t);
        t.href = url;
        text.appendChild(t);
        if (post.x) text.appendChild(el('p', 'search-result__excerpt', post.x));
      } else {
        var p = el('p', 'search-result__note');
        var a = el('a', '', post.x || (post.p ? 'A photo' : 'A post'));
        a.href = url;
        p.appendChild(a);
        text.appendChild(p);
      }
      li.appendChild(text);
      var src = post.p && safeURL(photo(post.p));
      if (src) {
        var img = el('img', 'search-result__photo');
        img.src = src;
        img.alt = '';
        img.width = 132;
        img.height = 99;
        img.loading = 'lazy';
        img.decoding = 'async';
        li.appendChild(img);
      }
      return li;
    }

    say('Looking back at ' + label(day) + '…');
    fetch(root.getAttribute('data-otd') + day + '.json')
      .then(function (r) {
        if (r.status === 404) return [];
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (posts) {
        // Other years, and this year's only once the day has passed.
        var cut = now.year * 10000 + parseInt(now.day.replace('-', ''), 10);
        var md = parseInt(day.replace('-', ''), 10);
        var byYear = {};
        (posts || []).forEach(function (p) {
          if (!p || !p.y || p.y * 10000 + md >= cut) return;
          (byYear[p.y] = byYear[p.y] || []).push(p);
        });
        var years = Object.keys(byYear).map(Number).sort(function (a, b) { return b - a; });
        if (!years.length) return say('Nothing from ' + label(day) + ' in other years.', true);
        say('');
        years.forEach(function (y) {
          var section = el('section', 'otd__year');
          section.setAttribute('aria-labelledby', 'otd-' + y);
          var h = el('h3', 'otd__year-heading', String(y));
          h.id = 'otd-' + y;
          if (isToday) {
            var ago = now.year - y;
            h.appendChild(el('span', 'otd__ago', ago === 1 ? 'A year ago' : ago + ' years ago'));
          }
          section.appendChild(h);
          var ol = el('ol', 'search-results__list');
          byYear[y].forEach(function (p) {
            var li = card(p);
            if (li) ol.appendChild(li);
          });
          section.appendChild(ol);
          list.appendChild(section);
        });
      })
      .catch(function () {
        say('On This Day didn’t load.', true);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
