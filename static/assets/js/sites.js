// Fill the parts of a page that come from Jamie's other sites, in the
// reader's browser, because micro.blog only rebuilds the blog when Jamie
// posts. Each part is an element with data-rail (its kind) and
// data-rail-feed (where to read):
//   atom     the rail's Weekly Thing list (Atom: title, link, published)
//   latest   the latest Weekly Thing card in the home stream (same feed)
//   another  the rail's Another Thing list (index.json)
//   episode  the Another Thing card (same index.json)
//   otd      On This Day (the blog's own day files, cached for the day)
// A feed is fetched once however many parts read it. A list that can't be
// filled stays empty and hidden, a card keeps its fallback text. Remote text
// goes in with textContent and remote HTML is only parsed inertly
// (DOMParser), never inserted, so nothing from a feed runs or loads.
// A part with data-ref (partials/site-ref.html) tags the links it fills
// that go to another of Jamie's sites with ?ref=, as the theme's own do.
(function () {
  var TZ = 'America/Chicago';
  var fetched = {};

  function get(url, as) {
    var key = as + ' ' + url;
    if (!fetched[key]) {
      fetched[key] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return as === 'json' ? r.json() : r.text();
      });
    }
    return fetched[key];
  }

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

  // One list item: a link holding an optional thumbnail, a kicker and a title.
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

  function setText(root, sel, text) {
    var n = root.querySelector(sel);
    if (n && text) n.textContent = text;
  }

  // Add the part's ref to a link on another site; leave this site's links
  // and a link that already names a ref alone.
  function withRef(href, root) {
    var ref = root.getAttribute('data-ref');
    if (!ref) return href;
    try {
      var url = new URL(href);
      if (url.origin === window.location.origin || url.searchParams.has('ref')) return href;
      url.searchParams.set('ref', ref);
      return url.href;
    } catch (e) {
      return href;
    }
  }

  function setLinks(root, sel, href) {
    var url = safeURL(href);
    if (!url) return;
    url = withRef(url, root);
    Array.prototype.forEach.call(root.querySelectorAll(sel), function (a) { a.href = url; });
  }

  // Weekly Thing issues from the Atom feed, newest first. Only title, link,
  // published and summary are read.
  function issues(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var entries = doc.getElementsByTagName('entry');
    var out = [];
    function field(e, name) { return ((e.getElementsByTagName(name)[0] || {}).textContent || '').trim(); }
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var title = field(e, 'title');
      var link = e.getElementsByTagName('link')[0];
      var m = /^(WT\d+)\s*[—–-]\s*(.+)$/.exec(title);
      out.push({
        number: m ? m[1] : '',
        title: m ? m[2] : title,
        url: link && link.getAttribute('href'),
        published: new Date(field(e, 'published')),
        summary: field(e, 'summary')
      });
    }
    return out;
  }

  // Another Thing episodes from index.json, newest first.
  function episodes(data) {
    return ((data && data.episodes) || []).slice().sort(function (a, b) {
      return (b.number || 0) - (a.number || 0);
    });
  }

  // On This Day: the day file (partials/otd-days.html) lists this day's
  // posts from every year, oldest first. Keep one post a year (the first
  // with a photo, else the first with a title, else the first), newest
  // year first.
  function otdPicks(posts, limit) {
    var thisYear = new Date().getFullYear();
    var byYear = {};
    (posts || []).forEach(function (p) {
      if (!p || !p.u || !p.y || p.y >= thisYear) return;
      var thumb = p.p && safeURL(p.p) && p.p.indexOf('https:') === 0 ? p.p : null;
      var pick = { url: p.u, year: p.y, title: p.t || words(p.x, 70) || 'A photo', thumb: thumb };
      pick.rank = thumb ? 0 : p.t ? 1 : 2;
      var have = byYear[p.y];
      if (!have || pick.rank < have.rank) byYear[p.y] = pick;
    });
    return Object.keys(byYear)
      .map(function (y) { return byYear[y]; })
      .sort(function (a, b) { return b.year - a.year; })
      .slice(0, limit);
  }

  function today() {
    return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  }

  // Keep today's picks for the day, so a page view after the first reads
  // no file at all. The key names the file the picks came from: before
  // 2.0.8 they came from Micro Memories.
  function otd(feed, limit) {
    var day = today().slice(5, 10);
    var key = 'thing-rail-otd:' + today() + ':' + feed;
    try {
      var saved = JSON.parse(window.localStorage.getItem(key) || 'null');
      if (saved) return Promise.resolve(saved);
    } catch (e) { /* storage blocked: fetch every time */ }
    return get(feed + day + '.json', 'json').then(function (posts) {
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

  // A thumbnail through the photo resizer when it is one of Jamie's uploads
  // (the section's data-photo-proxy and space-separated data-uploads, as in
  // partials/photo-src.html), in its square form, for square slots only.
  function thumbnail(section, src, size) {
    var proxy = section.getAttribute('data-photo-proxy');
    var uploads = (section.getAttribute('data-uploads') || '').split(' ');
    for (var i = 0; src && proxy && i < uploads.length; i++) {
      if (uploads[i] && src.indexOf(uploads[i]) === 0) return proxy + size + '/' + src;
    }
    return src;
  }

  function fill(section, nodes) {
    var list = section.querySelector('[data-rail-list]');
    if (!list) return;
    nodes.filter(Boolean).forEach(function (n) {
      var a = n.querySelector('a');
      if (a) a.href = withRef(a.href, section);
      list.appendChild(n);
    });
  }

  var kinds = {
    atom: function (section, feed, limit, skip) {
      return get(feed, 'text').then(function (t) {
        fill(section, issues(t).slice(skip, skip + limit).map(function (is) {
          var kicker = (is.number || 'Issue') + (isNaN(is.published) ? '' : ' · ' + monthDay(is.published));
          return item(is.url, kicker, is.title);
        }));
      });
    },
    latest: function (card, feed) {
      return get(feed, 'text').then(function (t) {
        var is = issues(t)[0];
        if (!is || !safeURL(is.url)) return;
        var fresh = !isNaN(is.published) && Date.now() - is.published.getTime() < 6 * 864e5;
        var name = card.getAttribute('data-site-name') || 'Weekly Thing';
        setText(card, '[data-latest-kicker]', (fresh ? 'This weekend’s ' : 'The latest ') + name);
        setText(card, '[data-latest-title]', (is.number ? is.number + ' · ' : '') + is.title);
        setText(card, '[data-latest-summary]', is.summary);
        setLinks(card, '[data-latest-link]', is.url);
      });
    },
    another: function (section, feed, limit) {
      return get(feed, 'json').then(function (d) {
        fill(section, episodes(d).slice(0, limit).map(function (ep) {
          var day = calendarDate(ep.date);
          return item(ep.urls && ep.urls.html, 'Episode ' + ep.number + (day ? ' · ' + monthDay(day, true) : ''), ep.title);
        }));
      });
    },
    episode: function (card, feed) {
      return get(feed, 'json').then(function (d) {
        var ep = episodes(d)[0];
        if (!ep || !ep.title || !safeURL(ep.urls && ep.urls.html)) return;
        var day = calendarDate(ep.date);
        var name = card.getAttribute('aria-label') || 'Another Thing';
        setText(card, '[data-episode-kicker]', name + ', episode ' + ep.number + (day ? ' · ' + monthDay(day, true) : ''));
        setText(card, '[data-episode-title]', ep.title);
        setLinks(card, '[data-episode-link]', ep.urls.html);
      });
    },
    otd: function (section, feed, limit) {
      var date = section.querySelector('[data-rail-date]');
      if (date) date.textContent = monthDay(new Date()) + ', in other years';
      return otd(feed, limit).then(function (picks) {
        fill(section, picks.map(function (p) { return item(p.url, String(p.year), p.title, thumbnail(section, p.thumb, 200)); }));
      });
    }
  };

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-rail][data-rail-feed]'), function (node) {
      var run = kinds[node.getAttribute('data-rail')];
      if (!run) return;
      var limit = parseInt(node.getAttribute('data-rail-limit') || '4', 10);
      var skip = parseInt(node.getAttribute('data-rail-skip') || '0', 10);
      run(node, node.getAttribute('data-rail-feed'), limit, skip).catch(function () { /* keep the fallback */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
