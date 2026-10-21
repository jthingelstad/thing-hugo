// The Weekly Thing signup on the subscribe card (partials/wt-subscribe.html,
// 2.0.11). The card takes the address and asks the Librarian's /auth, as the
// Weekly Thing website's forms do: check first, then subscribe, resend the
// confirmation or resubscribe, by what the check says. Nothing posts to
// Buttondown. The Librarian adds the reader, tags them source:blog and
// sends Buttondown's confirmation mail.
//
// Every Weekly Thing signup passes Cloudflare Turnstile (enforced since
// 2026-10-20). Cloudflare's script loads only once a reader starts on the
// form, and most never see it: a doubtful browser gets a checkbox under the
// form. The first post waits at most QUICK_WAIT for a token. If the
// Librarian refuses it for want of one, the card waits up to PATIENT_WAIT
// (the checkbox showing, if Cloudflare wants it) and posts once more. The
// Librarian keeps a token's verdict for five minutes and three uses, bound
// to the first address it came with, so check and subscribe share a token.
//
// Without JavaScript the card's Subscribe button goes to the Weekly Thing's
// own form. Tinylytics hears each outcome as subscribe.<what happened>, with
// the placement as its value.
(function () {
  var SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=thingSignupTurnstile';
  var QUICK_WAIT = 3000;
  var PATIENT_WAIT = 45000;
  var TOKEN_USES = 3;
  var TOKEN_AGE = 270000;
  var TIMEOUT = 12000;
  var EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  var UNREACHABLE = 'Could not reach the Weekly Thing just now. Please try again in a minute.';
  var loading = null;

  function turnstile() {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        if (window.turnstile) { resolve(window.turnstile); return; }
        window.thingSignupTurnstile = function () { resolve(window.turnstile); };
        var script = document.createElement('script');
        script.src = SCRIPT;
        script.async = true;
        script.onerror = function () { reject(new Error('turnstile')); };
        document.head.appendChild(script);
      });
    }
    return loading;
  }

  // One Turnstile widget in the card's slot. tokenFor resolves to a token for
  // the address, or '' when none came in time; once a quick wait has run out,
  // later quick waits don't wait until a token arrives.
  function person(slot, siteKey) {
    var widget = null;
    var token = '';
    var issued = 0;
    var uses = 0;
    var bound = '';
    var gaveUp = false;
    var broken = !siteKey;
    var waiting = [];

    function wake() {
      var now = waiting;
      waiting = [];
      now.forEach(function (go) { go(); });
    }

    function warm() {
      if (widget !== null || broken) return;
      widget = 'loading';
      turnstile().then(function (api) {
        widget = api.render(slot, {
          sitekey: siteKey,
          action: 'subscribe',
          appearance: 'interaction-only',
          size: slot.clientWidth < 300 ? 'compact' : 'normal',
          'refresh-expired': 'auto',
          callback: function (value) {
            token = value;
            issued = Date.now();
            uses = 0;
            bound = '';
            gaveUp = false;
            wake();
          },
          'expired-callback': function () { token = ''; },
          'error-callback': function () { token = ''; wake(); }
        });
      }, function () {
        broken = true;
        widget = null;
        wake();
      });
    }

    function reset() {
      token = '';
      uses = 0;
      bound = '';
      if (window.turnstile && widget !== null && widget !== 'loading') {
        try { window.turnstile.reset(widget); } catch (e) { /* a widget already gone */ }
      }
    }

    function tokenFor(email, patient) {
      warm();
      if (token && (uses >= TOKEN_USES || Date.now() - issued > TOKEN_AGE || (bound && bound !== email))) reset();
      var until = Date.now() + (patient ? PATIENT_WAIT : (gaveUp ? 0 : QUICK_WAIT));
      return new Promise(function (resolve) {
        function look() {
          if (token) {
            uses += 1;
            bound = email;
            resolve(token);
            return;
          }
          var left = until - Date.now();
          if (broken || left <= 0) {
            if (!patient && !broken) gaveUp = true;
            resolve('');
            return;
          }
          var timer = window.setTimeout(go, Math.min(250, left));
          function go() {
            window.clearTimeout(timer);
            waiting = waiting.filter(function (w) { return w !== go; });
            look();
          }
          waiting.push(go);
        }
        look();
      });
    }

    return { warm: warm, tokenFor: tokenFor, reset: reset };
  }

  // Tinylytics counts clicks on data-tinylytics-event elements, so an
  // outcome is a click on a hidden one.
  function track(name, value) {
    var sink = document.createElement('button');
    sink.type = 'button';
    sink.hidden = true;
    sink.setAttribute('data-tinylytics-event', name);
    sink.setAttribute('data-tinylytics-event-value', value);
    document.body.appendChild(sink);
    sink.click();
    sink.remove();
  }

  function start(card) {
    var form = card.querySelector('[data-signup-form]');
    var input = form && form.querySelector('input[type="email"]');
    var button = form && form.querySelector('button[type="submit"]');
    var status = card.querySelector('[data-signup-status]');
    var api = (card.getAttribute('data-api') || '').replace(/\/$/, '');
    if (!input || !button || !status || !api || !window.fetch) return;
    var source = card.getAttribute('data-source') || 'blog-post';
    var ref = card.getAttribute('data-ref') || 'blog';
    var human = person(card.querySelector('[data-signup-turnstile]'), card.getAttribute('data-site-key'));
    var label = button.textContent;

    function say(text, action, onAction) {
      status.textContent = text || '';
      if (action) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = action;
        b.addEventListener('click', function () {
          b.disabled = true;
          onAction();
        });
        status.appendChild(b);
      }
    }

    function busy(text) {
      button.disabled = !!text;
      button.textContent = text || label;
    }

    function email() { return input.value.trim(); }

    function post(body) {
      var controller = window.AbortController ? new AbortController() : null;
      var timer = window.setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT);
      return fetch(api + '/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      }).then(function (response) {
        window.clearTimeout(timer);
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { ok: response.ok, status: response.status, data: data || {} };
        });
      }, function (err) {
        window.clearTimeout(timer);
        throw err;
      });
    }

    function refused(result) {
      return result.status === 403 && result.data.status === 'turnstile_failed';
    }

    // One /auth call with a Turnstile token, and on a refusal one patient
    // retry with a fresh one.
    function ask(action) {
      var body = { action: action, email: email(), source: source };
      if (action === 'subscribe' || action === 'resend_confirmation') {
        body.attribution = {
          ref: ref,
          landing_url: window.location.href,
          referrer_url: document.referrer || undefined,
          captured_at: new Date().toISOString()
        };
      }
      var who = body.email.toLowerCase();
      return human.tokenFor(who).then(function (token) {
        if (token) body.turnstile_token = token;
        return post(body);
      }).then(function (result) {
        if (!refused(result)) return result;
        track('subscribe.turnstile_retry', source + '.' + action);
        human.reset();
        busy('Confirming…');
        say('Confirming you’re a person…');
        return human.tokenFor(who, true).then(function (token) {
          say('');
          if (!token) return result;
          body.turnstile_token = token;
          return post(body);
        }).then(function (again) {
          if (refused(again)) {
            human.reset();
            track('subscribe.turnstile_failed', source + '.' + action);
          }
          return again;
        });
      });
    }

    function failed(where) {
      busy('');
      say(UNREACHABLE);
      track('subscribe.unreachable', source + '.' + where);
    }

    function subscribe() {
      busy('Subscribing…');
      ask('subscribe').then(function (result) {
        busy('');
        var data = result.data;
        if (result.ok && data.status === 'subscribed') {
          say(data.message || 'Check your inbox to confirm your subscription.');
          track('subscribe.submitted', source);
        } else if (result.ok && data.status === 'needs_jamie') {
          // Buttondown refused the address or its firewall held it. The
          // Librarian has it and Jamie hears about it; data.error says so.
          say(data.error);
          track('subscribe.needs_jamie', source);
        } else if (result.status === 429) {
          say(data.error || 'Too many tries. Please try again in a bit.');
        } else {
          say(data.error || data.message || 'Could not add that address just now. Please try again in a minute.');
          track('subscribe.failed', source + '.' + result.status);
        }
      }, function () { failed('subscribe'); });
    }

    function resend() {
      ask('resend_confirmation').then(function (result) {
        var data = result.data;
        if (result.ok && data.status === 'reminder_sent') {
          say(data.message || 'Confirmation sent. Check your inbox.');
          track('subscribe.confirmation_resent', source);
        } else {
          say(data.error || data.message || 'Could not resend the confirmation just now.');
        }
      }, function () { say('Could not resend the confirmation just now.'); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (button.disabled) return;
      if (!EMAIL.test(email())) {
        say('Please enter a valid email address.');
        input.focus();
        return;
      }
      say('');
      busy('Checking…');
      ask('check').then(function (result) {
        busy('');
        var data = result.data;
        if (result.ok && (data.status === 'active' || data.status === 'premium')) {
          say('You’re already subscribed. Thank you for reading!');
          track('subscribe.already_subscribed', source + '.' + data.status);
        } else if (result.ok && data.status === 'not_found') {
          subscribe();
        } else if (result.ok && data.status === 'unconfirmed') {
          say('You signed up but haven’t confirmed yet.', 'Resend the confirmation', resend);
          track('subscribe.unconfirmed', source);
        } else if (result.status === 403 && data.status === 'inactive' && data.under_review) {
          // Held by Buttondown's firewall for Jamie to review; resubscribing
          // would only say so again.
          say(data.error);
          track('subscribe.under_review', source);
        } else if (result.status === 403 && data.status === 'inactive') {
          say('That address is no longer subscribed.', 'Resubscribe', subscribe);
          track('subscribe.inactive', source);
        } else if (result.status === 429) {
          say(data.error || 'Too many tries. Please try again in a bit.');
        } else if (result.status === 400) {
          say(data.error || 'Please enter a valid email address.');
        } else {
          say(data.error || UNREACHABLE);
          track('subscribe.failed', source + '.check-' + result.status);
        }
      }, function () { failed('check'); });
    });
    input.addEventListener('focus', human.warm);
    input.addEventListener('input', function () {
      human.warm();
      if (!button.disabled) say('');
    });

    // The form replaces the button to the Weekly Thing's form, and a row
    // left with nothing in it goes too.
    Array.prototype.forEach.call(card.querySelectorAll('[data-signup-fallback]'), function (link) {
      link.hidden = true;
      var row = link.parentNode;
      if (!row.querySelector('a:not([hidden])')) row.hidden = true;
    });
    form.hidden = false;

    // The header's Subscribe jumps to #subscribe: put the reader in the box.
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href="#subscribe"]');
      if (link) window.setTimeout(function () { input.focus({ preventScroll: true }); }, 0);
    });
  }

  function startAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-signup]'), function (card) {
      if (card.getAttribute('data-signup') === 'on') return;
      card.setAttribute('data-signup', 'on');
      start(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAll);
  } else {
    startAll();
  }
})();
