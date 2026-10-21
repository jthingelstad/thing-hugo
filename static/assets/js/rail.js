// Fill the rail's live lists (partials/rail.html): recent Weekly Thing
// issues, Another Thing episodes and On This Day. Each section names its
// feed in data-rail-feed; a list that can't be filled stays empty and hidden,
// leaving the section's heading and link. Remote text is set with
// textContent and remote HTML is only parsed inertly (DOMParser), never
// inserted, so nothing from a feed runs or loads.
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
      return url.protocol === 'https:' || url.origin === window.location.origin ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  // One rail item: a link holding an optional thumbnail, a kicker and a title.
  function item(href, kicker, title, thumb) {
    var url = safeURL(href);
    if (!url || !title) return null;
    var li = el('li', 'rail-item');
    var a = el('a', 'rail-item__link');
    a.href = url;
    if (thumb) {
      var img = el('img', 'rail-item__thumb');
      img.src = thumb;
      img.alt = '';
      img.width = 72;
      img.height = 72;
      img.loading = 'lazy';
      img.decoding = 'async';
      a.appendChild(img);
    }
    var text = el('span', 'rail-item__text');
    text.appendChild(el('span', 'rail-item__kicker', kicker));
    text.appendChild(el('span', 'rail-item__title', title));
    a.appendChild(text);
    li.appendChild(a);
    return li;
  }

  function monthDay(d, withYear) {
    var opts = { month: 'long', day: 'numeric', timeZone: TZ };
    if (withYear) opts.year = 'numeric';
    return d.toLocaleDateString('en-US', opts);
  }

  // "2025-10-05" as a calendar date, not midnight UTC.
  function calendarDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : null;
  }

  function words(text, max) {
    text = (text || '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    var cut = text.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max) + '…';
  }

  // Weekly Thing: Atom entries. Only title, link and published are read.
  function fromAtom(text, limit) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var out = [];
    var entries = doc.getElementsByTagName('entry');
    for (var i = 0; i < entries.length && out.length < limit; i++) {
      var e = entries[i];
      var title = (e.getElementsByTagName('title')[0] || {}).textContent || '';
      var link = e.getElementsByTagName('link')[0];
      var published = new Date((e.getElementsByTagName('published')[0] || {}).textContent || '');
      var m = /^(WT\d+)\s*[—–-]\s*(.+)$/.exec(title.trim());
      var kicker = (m ? m[1] : 'Issue') + (isNaN(published) ? '' : ' · ' + monthDay(published));
      var li = item(link && link.getAttribute('href'), kicker, m ? m[2] : title.trim());
      if (li) out.push(li);
    }
    return out;
  }

  // Another Thing: index.json episodes, newest first.
  function fromAnother(data, limit) {
    var eps = (data && data.episodes) || [];
    eps = eps.slice().sort(function (a, b) { return (b.number || 0) - (a.number || 0); });
    var out = [];
    for (var i = 0; i < eps.length && out.length < limit; i++) {
      var ep = eps[i];
      var d = calendarDate(ep.date);
      var kicker = 'Episode ' + ep.number + (d ? ' · ' + monthDay(d, true) : '');
      var li = item(ep.urls && ep.urls.html, kicker, ep.title);
      if (li) out.push(li);
    }
    return out;
  }

  // On This Day: Micro Memories returns this day's posts from every year as
  // h-entry JSON. Keep one post a year (the first with a photo, else the
  // first with a title, else the first), newest year first.
  function otdPicks(posts, limit) {
    var thisYear = new Date().getFullYear();
    var byYear = {};
    (posts || []).forEach(function (p) {
      var pr = p.properties || {};
      var url = (pr.url || [])[0];
      var year = parseInt(((pr.published || [])[0] || '').slice(0, 4), 10);
      if (!url || !year || year >= thisYear) return;
      var html = (((pr.content || [])[0] || {}).html) || '';
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var thumb = null;
      var imgs = doc.querySelectorAll('img[src]');
      for (var i = 0; i < imgs.length && !thumb; i++) {
        var w = parseInt(imgs[i].getAttribute('width') || '0', 10);
        var src = safeURL(imgs[i].getAttribute('src'));
        if (src && src.indexOf('https:') === 0 && (w === 0 || w > 2)) thumb = src;
      }
      var name = ((pr.name || [])[0] || '').trim();
      var pick = { url: url, year: year, title: name || words(doc.body.textContent, 70) || 'A photo', thumb: thumb };
      pick.rank = thumb ? 0 : name ? 1 : 2;
      var have = byYear[year];
      if (!have || pick.rank < have.rank) byYear[year] = pick;
    });
    return Object.keys(byYear)
      .map(function (y) { return byYear[y]; })
      .sort(function (a, b) { return b.year - a.year; })
      .slice(0, limit);
  }

  function todayKey() {
    var parts = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
    return 'thing-rail-otd:' + parts;
  }

  // Micro Memories is slow (seconds), so keep today's picks for the day.
  function otd(feed, limit) {
    var key = todayKey();
    try {
      var saved = JSON.parse(window.localStorage.getItem(key) || 'null');
      if (saved) return Promise.resolve(saved);
    } catch (e) { /* storage blocked: fetch every time */ }
    return fetch(feed).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (posts) {
      var picks = otdPicks(posts, limit);
      try {
        for (var i = window.localStorage.length - 1; i >= 0; i--) {
          var k = window.localStorage.key(i);
          if (k && k.indexOf('thing-rail-otd:') === 0 && k !== key) window.localStorage.removeItem(k);
        }
        window.localStorage.setItem(key, JSON.stringify(picks));
      } catch (e) { /* fine */ }
      return picks;
    });
  }

  function fill(section, nodes) {
    var list = section.querySelector('[data-rail-list]');
    if (!list || !nodes.length) return;
    nodes.forEach(function (n) { list.appendChild(n); });
  }

  function start() {
    var sections = document.querySelectorAll('.rail [data-rail]');
    Array.prototype.forEach.call(sections, function (section) {
      var kind = section.getAttribute('data-rail');
      var feed = section.getAttribute('data-rail-feed');
      var limit = parseInt(section.getAttribute('data-rail-limit') || '4', 10);
      if (!feed) return;
      var job;
      if (kind === 'atom') {
        job = fetch(feed).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) { return t ? fromAtom(t, limit) : []; });
      } else if (kind === 'another') {
        job = fetch(feed).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { return fromAnother(d, limit); });
      } else if (kind === 'otd') {
        var date = section.querySelector('[data-rail-date]');
        if (date) date.textContent = monthDay(new Date()) + ', in other years';
        job = otd(feed, limit).then(function (picks) {
          return picks.map(function (p) { return item(p.url, String(p.year), p.title, p.thumb); }).filter(Boolean);
        });
      }
      if (job) job.then(function (nodes) { fill(section, nodes); }).catch(function () { /* list stays hidden */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
