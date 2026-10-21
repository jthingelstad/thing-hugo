// The Search page (Round 4b), drawn from Pagefind's JavaScript API.
// micro.blog's Pagefind Action builds the index on every publish and serves
// it at /pagefind/; the theme's markup (partials/pagefind-meta.html) gives
// each post a title, date, image, titled flag, and year and category filters.
//
// State lives in the address (?q=kubb&sort=newest&year=2025&category=Kubb)
// so a search can be reloaded or shared. Results come ten at a time. There
// are no counts anywhere, by design. Excerpt HTML from Pagefind is rebuilt
// as text plus <mark>, never inserted as HTML.
(function () {
  var PAGE = 10;
  var CATEGORIES = 8;

  function start() {
    var root = document.getElementById('search-results');
    if (!root) return;
    var input = document.getElementById('search-q');
    var form = input && input.form;
    var status = root.querySelector('[data-search-status]');
    var list = root.querySelector('[data-search-list]');
    var more = root.querySelector('[data-search-more]');
    var sortGroup = document.querySelector('[data-search-sort]');
    var filterBoxes = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-search-filter]'), function (box) {
      filterBoxes[box.getAttribute('data-search-filter')] = box;
    });

    var params = new URLSearchParams(window.location.search);
    var state = {
      q: (params.get('q') || '').trim(),
      sort: params.get('sort') === 'newest' ? 'newest' : 'best',
      year: params.getAll('year'),
      category: params.getAll('category')
    };
    var results = [];
    var shown = 0;
    var run = 0;
    var pagefind = null;

    if (input && state.q) input.value = state.q;
    if (sortGroup) sortGroup.hidden = false;

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    }

    function say(text) { status.textContent = text; }

    function save() {
      var p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (state.sort === 'newest') p.set('sort', 'newest');
      state.year.forEach(function (y) { p.append('year', y); });
      state.category.forEach(function (c) { p.append('category', c); });
      var qs = p.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
    }

    // Pagefind's excerpt: escaped text with <mark> around matches.
    function marked(html) {
      var frag = document.createDocumentFragment();
      var doc = new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html');
      Array.prototype.forEach.call(doc.body.childNodes, function (n) {
        if (n.nodeType === 1 && n.nodeName === 'MARK') frag.appendChild(el('mark', '', n.textContent));
        else frag.appendChild(document.createTextNode(n.textContent));
      });
      return frag;
    }

    function photo(src) {
      if (!src) return '';
      var proxy = root.getAttribute('data-photo-proxy');
      var uploads = root.getAttribute('data-uploads');
      if (proxy && uploads && src.indexOf(uploads) === 0) return proxy + '400/' + src;
      return src;
    }

    function safeURL(u) {
      try {
        var url = new URL(u, window.location.href);
        return url.origin === window.location.origin || url.protocol === 'https:' ? url.href : null;
      } catch (e) {
        return null;
      }
    }

    function card(d) {
      var meta = d.meta || {};
      var url = safeURL(d.url);
      if (!url) return null;
      var li = el('li', 'search-result');
      var text = el('div', 'search-result__text');
      if (meta.date) text.appendChild(el('p', 'search-result__date', meta.date));
      if (meta.titled) {
        var t = el('a', 'search-result__title', meta.title || url);
        t.href = url;
        text.appendChild(t);
        var ex = el('p', 'search-result__excerpt');
        ex.appendChild(marked(d.excerpt));
        text.appendChild(ex);
      } else {
        var p = el('p', 'search-result__note');
        var a = el('a');
        a.href = url;
        a.appendChild(marked(d.excerpt));
        p.appendChild(a);
        text.appendChild(p);
      }
      li.appendChild(text);
      var src = meta.image && safeURL(photo(meta.image));
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

    function showMore(token) {
      var next = results.slice(shown, shown + PAGE);
      shown += next.length;
      more.hidden = true;
      return Promise.all(next.map(function (r) { return r.data(); })).then(function (data) {
        if (token !== run) return;
        data.forEach(function (d) {
          var li = card(d);
          if (li) list.appendChild(li);
        });
        more.hidden = shown >= results.length;
      });
    }

    function chip(kind, value) {
      var li = el('li');
      var b = el('button', '', value);
      b.type = 'button';
      var on = state[kind].indexOf(value) !== -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.addEventListener('click', function () {
        var i = state[kind].indexOf(value);
        if (i === -1) state[kind].push(value);
        else state[kind].splice(i, 1);
        search();
      });
      li.appendChild(b);
      return li;
    }

    // Filters offered: the years and the most common categories among this
    // search's matches before filtering, plus whatever is already chosen.
    function drawFilters(total) {
      ['year', 'category'].forEach(function (kind) {
        var box = filterBoxes[kind];
        if (!box) return;
        var counts = (total && total[kind]) || {};
        var values = Object.keys(counts).filter(function (v) { return counts[v] > 0; });
        if (kind === 'year') values.sort().reverse();
        else values = values.sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, CATEGORIES);
        state[kind].forEach(function (v) { if (values.indexOf(v) === -1) values.push(v); });
        var ul = box.querySelector('[data-search-chips]');
        ul.textContent = '';
        values.forEach(function (v) { ul.appendChild(chip(kind, v)); });
        box.hidden = values.length < 2 && !state[kind].length;
      });
    }

    function drawSort() {
      if (!sortGroup) return;
      Array.prototype.forEach.call(sortGroup.querySelectorAll('[data-sort]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-sort') === state.sort ? 'true' : 'false');
      });
    }

    function search() {
      var token = ++run;
      save();
      drawSort();
      list.textContent = '';
      more.hidden = true;
      results = [];
      shown = 0;
      if (!state.q) {
        say('');
        drawFilters(null);
        return;
      }
      say('Searching…');
      var filters = {};
      if (state.year.length) filters.year = { any: state.year };
      if (state.category.length) filters.category = { any: state.category };
      var opts = { filters: filters };
      if (state.sort === 'newest') opts.sort = { date: 'desc' };
      pagefind.search(state.q, opts).then(function (found) {
        if (token !== run || !found) return;
        results = found.results || [];
        drawFilters(found.totalFilters);
        if (!results.length) {
          say('Nothing in the blog matches “' + state.q + '”' + (state.year.length || state.category.length ? ' with those filters.' : '. Try fewer words, or ask Thingy.'));
          return;
        }
        say('Results for “' + state.q + '”');
        return showMore(token);
      }).catch(function () {
        if (token === run) say('Search is not working right now. The archive lists every post by year.');
      });
    }

    more.addEventListener('click', function () { showMore(run); });
    if (sortGroup) {
      sortGroup.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sort]');
        if (!b || b.getAttribute('data-sort') === state.sort) return;
        state.sort = b.getAttribute('data-sort');
        if (pagefind) search();
      });
    }
    if (form) {
      form.addEventListener('submit', function (e) {
        if (!pagefind) return;
        e.preventDefault();
        state.q = input.value.trim();
        search();
      });
    }

    import(root.getAttribute('data-pagefind') || '/pagefind/pagefind.js').then(function (pf) {
      pagefind = pf;
      return pf.options({ excerptLength: 36 });
    }).then(function () {
      // Search results only count the filters Pagefind has loaded, and it
      // loads them all here.
      return pagefind.filters();
    }).then(search).catch(function () {
      say('Search is not working right now. The archive lists every post by year.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
