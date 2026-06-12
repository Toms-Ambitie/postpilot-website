/* ==========================================================================
   PostPilot Redesign — interactions
   ========================================================================== */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Enable motion layer (entrance choreography) only when motion is allowed
  if (!prefersReduced) document.body.classList.add('js-anim');

  // ---------------- A11y: skip-link + main landmark ----------------
  (function ensureSkipLink() {
    var main = document.getElementById('main') || document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main';
      main.setAttribute('tabindex', '-1');
    }
    if (!document.querySelector('.skip-link')) {
      var sl = document.createElement('a');
      sl.className = 'skip-link';
      sl.href = '#main';
      sl.textContent = 'Naar inhoud';
      sl.addEventListener('click', function (e) {
        var t = document.getElementById('main');
        if (!t) return;
        e.preventDefault();
        t.focus();
        t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      });
      document.body.insertBefore(sl, document.body.firstChild);
    }
  })();

  // ---------------- Scroll progress bar ----------------
  var progressBar = document.getElementById('scrollProgress');
  function onProgress() {
    if (!progressBar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressBar.style.width = p + '%';
  }
  window.addEventListener('scroll', onProgress, { passive: true });
  window.addEventListener('resize', onProgress, { passive: true });
  onProgress();

  // ---------------- Sticky nav ----------------
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------- Reveal on scroll ----------------
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // ---------------- FAQ ----------------
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    var a = btn.nextElementSibling;
    if (btn.getAttribute('aria-expanded') === 'true' && a) {
      requestAnimationFrame(function () {
        a.style.maxHeight = a.scrollHeight + 'px';
      });
    }
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      a.style.maxHeight = open ? '0px' : a.scrollHeight + 'px';
    });
  });

  // ---------------- Mobile nav ----------------
  var mobileToggle = document.getElementById('mobileToggle');
  var navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      if (isOpen) {
        Object.assign(navLinks.style, {
          display: 'flex',
          position: 'absolute',
          top: '68px',
          left: '0',
          right: '0',
          flexDirection: 'column',
          background: 'var(--paper)',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          padding: '18px 24px 24px',
          gap: '18px',
          zIndex: '90',
        });
      } else {
        navLinks.removeAttribute('style');
      }
    });
  }

  // ---------------- Founder seats (live data via Supabase RPC) ----------------
  // Haalt het live aantal vergeven Founder-plekken op via een PII-vrije RPC
  // (get_founder_seats geeft alléén {claimed, total}, geen klantdata).
  // - Counter-card: telt naar `remaining` (resterende plekken), bar = vergeven %
  // - Topstrip "X plekken over" verschijnt pas vanaf STRIP_FROM founders
  // - Social proof "X professionals gingen je voor" verschijnt vanaf PROOF_FROM
  // - Faalt stil: counter-card valt terug op statische defaults (100/100/0%)
  var SUPA_URL = 'https://qhwwbkculkqmiyraiblz.supabase.co';
  var SUPA_KEY = 'sb_publishable_6w7e_0sDxK1-7489jdROrg_KilH-KH0';
  var STRIP_FROM = 20;  // topstrip-schaarste pas vanaf 20 vergeven
  var PROOF_FROM = 5;   // social-proof "X gingen je voor" pas vanaf 5 vergeven

  var counterCard = document.getElementById('counterCard');
  var counterBig = document.getElementById('counterBig');
  var counterBar = document.getElementById('counterBar');
  var counterMeta = document.getElementById('counterMeta');
  var stripScarcity = document.getElementById('stripScarcity');
  var stripSep = document.getElementById('stripSep');
  var founderProof = document.getElementById('founderProof');

  function setupCounter(claimed, total) {
    var remaining = Math.max(0, total - claimed);
    var pct = total > 0 ? (claimed / total) * 100 : 0;

    // Update meta-tekst en topstrip + social proof direct (geen wachten op view)
    if (counterMeta) counterMeta.textContent = claimed + ' vergeven · ' + remaining + ' over';
    if (stripScarcity) {
      if (claimed < STRIP_FROM) {
        stripScarcity.style.display = 'none';
        if (stripSep) stripSep.style.display = 'none';
      } else {
        stripScarcity.textContent = remaining + ' plekken over · op = op.';
      }
    }
    if (founderProof) {
      if (claimed < PROOF_FROM) {
        founderProof.style.display = 'none';
      } else {
        founderProof.textContent = claimed + ' professionals gingen je voor, consultants, founders en coaches.';
      }
    }

    // Counter-bar + getal animeren bij in-view
    if (!counterCard || !counterBig || !counterBar || !('IntersectionObserver' in window)) return;
    var counted = false;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !counted) {
          counted = true;
          cio.unobserve(counterCard);
          counterBar.style.width = pct + '%';
          if (prefersReduced) {
            counterBig.textContent = String(remaining);
            return;
          }
          var start = performance.now();
          var dur = 1300;
          (function tick(now) {
            var p = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            counterBig.textContent = String(Math.round(remaining * eased));
            if (p < 1) requestAnimationFrame(tick);
          })(start);
        }
      });
    }, { threshold: 0.4 });
    cio.observe(counterCard);
  }

  // Fetch live data eerst, dan setup counter — voorkomt race waarbij IO
  // firet voordat seats binnen zijn.
  fetch(SUPA_URL + '/rest/v1/rpc/get_founder_seats', {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' },
    body: '{}',
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      var row = Array.isArray(rows) ? rows[0] : rows;
      var claimed = row ? parseInt(row.claimed, 10) || 0 : 0;
      var total = row ? parseInt(row.total, 10) || 100 : 100;
      setupCounter(claimed, total);
    })
    .catch(function () { setupCounter(0, 100); });

  // ---------------- Steps scrollspy ----------------
  var stepRows = document.querySelectorAll('.step-row');
  if (stepRows.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          stepRows.forEach(function (r) { r.classList.remove('active'); });
          e.target.classList.add('active');
        }
      });
    }, { rootMargin: '-35% 0px -45% 0px' });
    stepRows.forEach(function (r) { sio.observe(r); });
  }

  // ---------------- Count-up numbers (social proof) ----------------
  var countEls = document.querySelectorAll('[data-countup]');
  if (countEls.length && 'IntersectionObserver' in window && !prefersReduced) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        nio.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
        var start = performance.now();
        var dur = 1100;
        (function tick(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.5 });
    countEls.forEach(function (el) { nio.observe(el); });
  }

  // ---------------- Demo card 3D tilt (fine pointers only) ----------------
  var demoShell = document.querySelector('.demo-shell');
  var demoCardEl = document.getElementById('demoCard');
  if (demoShell && demoCardEl && !prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    demoShell.addEventListener('pointermove', function (ev) {
      var r = demoShell.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5;
      var y = (ev.clientY - r.top) / r.height - 0.5;
      demoCardEl.style.transform =
        'rotateY(' + (x * 4).toFixed(2) + 'deg) rotateX(' + (-y * 3).toFixed(2) + 'deg) translateZ(0)';
    });
    demoShell.addEventListener('pointerleave', function () {
      demoCardEl.style.transform = '';
    });
  }

  /* ========================================================================
     HERO DEMO — voice → post loop
     ======================================================================== */

  var demoCard = document.getElementById('demoCard');
  var recDot = document.getElementById('recDot');
  var demoState = document.getElementById('demoState');
  var demoTimer = document.getElementById('demoTimer');
  var micBtn = document.getElementById('micBtn');
  var wave = document.getElementById('wave');
  var transcript = document.getElementById('transcript');
  var dividerLabel = document.getElementById('dividerLabel');
  var demoPost = document.getElementById('demoPost');
  var postBody = document.getElementById('postBody');
  var postFoot = document.getElementById('postFoot');

  if (!demoCard) return;

  // Build waveform bars
  var BAR_COUNT = 36;
  var bars = [];
  for (var i = 0; i < BAR_COUNT; i++) {
    var b = document.createElement('i');
    wave.appendChild(b);
    bars.push(b);
  }

  var SPOKEN = ['...dus', 'eh,', 'die', 'klant', 'van', 'vier', 'maanden', 'terug', 'belde', 'vanochtend,', 'ineens', 'gewoon', 'ja.', 'Geduld', 'werkt', 'dus', 'echt...'];

  var POST_TEXT = 'Vier maanden geleden gaf ik een pitch waarvan ik dacht: die landt niet.\n\nVanochtend belde de klant. Het landde wel. Het had alleen tijd nodig.\n\nSales is niet altijd opvolgen. Soms is het ruimte geven, bij hen, niet bij jou.\n\nWat is jouw langste \u2018ja\u2019 geweest?';

  var generation = 0;       // cancel token
  var timerStart = 0;
  var timerRAF = null;
  var running = false;

  function setTimerRunning(on) {
    if (on) {
      timerStart = performance.now();
      (function tick() {
        var s = (performance.now() - timerStart) / 1000;
        demoTimer.textContent = s.toFixed(1).replace('.', ',').padStart(4, '0');
        timerRAF = requestAnimationFrame(tick);
      })();
    } else if (timerRAF) {
      cancelAnimationFrame(timerRAF);
      timerRAF = null;
    }
  }

  function wait(ms, gen) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (gen !== generation) reject(new Error('cancelled'));
        else resolve();
      }, ms);
    });
  }

  function animateWave(on) {
    bars.forEach(function (b) {
      b.style.height = '6px';
    });
    wave.classList.toggle('live', on);
    if (on && !prefersReduced) {
      wave._interval = setInterval(function () {
        bars.forEach(function (b) {
          b.style.height = (5 + Math.random() * 30) + 'px';
        });
      }, 120);
    } else if (wave._interval) {
      clearInterval(wave._interval);
      wave._interval = null;
    }
  }

  function resetDemo() {
    recDot.classList.remove('live');
    micBtn.classList.remove('live');
    animateWave(false);
    setTimerRunning(false);
    demoTimer.textContent = '00,0';
    demoState.textContent = 'Demo';
    transcript.innerHTML = 'Druk op de microfoon — of kijk gewoon even mee.';
    dividerLabel.textContent = 'POSTPILOT';
    dividerLabel.classList.remove('writing');
    demoPost.classList.remove('live');
    postBody.textContent = '';
    postFoot.classList.remove('live');
  }

  async function runDemo() {
    if (running) return;
    running = true;
    var gen = ++generation;

    try {
      resetDemo();

      // --- Phase 1: recording ---
      recDot.classList.add('live');
      micBtn.classList.add('live');
      demoState.textContent = 'Opname';
      animateWave(true);
      setTimerRunning(true);
      transcript.innerHTML = '';

      for (var i = 0; i < SPOKEN.length; i++) {
        await wait(prefersReduced ? 30 : 170, gen);
        var span = document.createElement('span');
        span.className = 'heard';
        span.textContent = (i === 0 ? '' : ' ') + SPOKEN[i];
        transcript.appendChild(span);
      }

      await wait(400, gen);

      // --- Phase 2: PostPilot writes ---
      recDot.classList.remove('live');
      micBtn.classList.remove('live');
      animateWave(false);
      demoState.textContent = 'Schrijven';
      dividerLabel.textContent = 'POSTPILOT SCHRIJFT…';
      dividerLabel.classList.add('writing');
      demoPost.classList.add('live');

      await wait(prefersReduced ? 100 : 700, gen);

      // --- Phase 3: type out post ---
      var caret = document.createElement('span');
      caret.className = 'caret';
      var typed = '';
      var chunk = prefersReduced ? 40 : 3;
      for (var j = 0; j < POST_TEXT.length; j += chunk) {
        typed = POST_TEXT.slice(0, j + chunk);
        postBody.textContent = typed;
        postBody.appendChild(caret);
        await wait(prefersReduced ? 5 : 28, gen);
      }
      postBody.textContent = POST_TEXT;

      // --- Phase 4: done ---
      setTimerRunning(false);
      // Land the timer on a believable value under 30
      demoTimer.textContent = '24,6';
      demoState.textContent = 'Klaar';
      dividerLabel.textContent = 'KLAAR — JIJ KEURT GOED';
      dividerLabel.classList.remove('writing');
      postFoot.classList.add('live');

      await wait(5200, gen);

      running = false;
      runDemo(); // loop
    } catch (err) {
      running = false; // cancelled — restart handled by caller
    }
  }

  // Start on view; restart on mic click
  if ('IntersectionObserver' in window) {
    var started = false;
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !started) {
          started = true;
          dio.unobserve(demoCard);
          setTimeout(runDemo, 600);
        }
      });
    }, { threshold: 0.35 });
    dio.observe(demoCard);
  } else {
    setTimeout(runDemo, 800);
  }

  micBtn.addEventListener('click', function () {
    generation++;       // cancel current run
    running = false;
    setTimerRunning(false);
    setTimeout(runDemo, 60);
  });

  // ---------------- Cross-domain: forward UTM + ad click-IDs to the app ----------------
  // Bewaart campagne-/click-parameters van de landings-URL (first-touch, per sessie) en
  // plakt ze op alle links naar de app, zodat de app de aanmelding aan de juiste
  // advertentie kan toeschrijven. GA4 koppelt de bezoeker-ID zelf via de _gl-linker;
  // dit forwardt de marketing-attributie (gclid, li_fat_id, utm_*, enz.).
  (function forwardAttribution() {
    var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'gbraid', 'wbraid', 'gad_source', 'fbclid', 'li_fat_id', 'ttclid', 'msclkid', 'twclid'];
    var STORE = 'pp_attrib';
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem(STORE) || '{}'); } catch (e) {}
    try {
      var sp = new URLSearchParams(window.location.search);
      KEYS.forEach(function (k) { var v = sp.get(k); if (v && !stored[k]) stored[k] = v; });
    } catch (e) {}
    try { sessionStorage.setItem(STORE, JSON.stringify(stored)); } catch (e) {}
    var keys = Object.keys(stored);
    if (!keys.length) return;
    document.querySelectorAll('a[href*="app.postpilotapp.nl"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        keys.forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, stored[k]); });
        a.href = u.toString();
      } catch (e) {}
    });
  })();
})();
