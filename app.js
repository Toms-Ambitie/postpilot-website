/* ==========================================================================
   PostPilot — landing interactions
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- A11y: skip-link + main landmark ----------------
  (function ensureSkipLink() {
    const main = document.getElementById('main') || document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main';
      main.setAttribute('tabindex', '-1');
    }
    if (!document.querySelector('.skip-link')) {
      const sl = document.createElement('a');
      sl.className = 'skip-link';
      sl.href = '#main';
      sl.textContent = 'Naar inhoud';
      sl.addEventListener('click', (e) => {
        const t = document.getElementById('main');
        if (!t) return;
        e.preventDefault();
        t.focus();
        t.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
      document.body.insertBefore(sl, document.body.firstChild);
    }
  })();

  // ---------------- Sticky nav border on scroll ----------------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 50) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------- Reveal on scroll ----------------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => {
      el.classList.add('reveal');
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // ---------------- FAQ accordion ----------------
  document.querySelectorAll('.faq-q').forEach((btn, i) => {
    const a = btn.nextElementSibling;
    if (!a) return;

    // Link button to its answer region for screen readers
    if (!a.id) a.id = 'faq-a-' + i;
    btn.setAttribute('aria-controls', a.id);

    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      // wait a tick so scrollHeight is correct
      requestAnimationFrame(() => {
        a.style.maxHeight = a.scrollHeight + 'px';
      });
    } else {
      // Hide collapsed content from keyboard + screen readers (keeps the animation)
      a.setAttribute('inert', '');
    }

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (open) {
        a.style.maxHeight = '0px';
        a.setAttribute('inert', '');
      } else {
        a.style.maxHeight = a.scrollHeight + 'px';
        a.removeAttribute('inert');
      }
    });
  });

  // ---------------- Smooth scroll for hash links ----------------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.classList.contains('skip-link')) return;
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // ---------------- Billing toggle (pricing page) ----------------
  const billingSwitch = document.getElementById('billingSwitch');
  const billingToggle = document.getElementById('billingToggle');
  if (billingSwitch && billingToggle) {
    const opts = billingToggle.querySelectorAll('.opt');
    const apply = (annual) => {
      // amount + suffix swap
      document.querySelectorAll('.price-amount .amt[data-m]').forEach((el) => {
        el.textContent = annual ? el.dataset.a : el.dataset.m;
      });
      document.querySelectorAll('.price-amount .per[data-m]').forEach((el) => {
        const note = el.querySelector('.ann-note');
        el.childNodes[0].nodeValue = annual ? el.dataset.a : el.dataset.m;
        if (note) note.textContent = annual ? (note.dataset.a || '') : '';
      });
      // Pass the chosen billing cycle through to the app checkout deep-links
      const cyc = annual ? 'yearly' : 'monthly';
      document.querySelectorAll('.price-foot a[href*="cycle="]').forEach((a) => {
        a.href = a.href.replace(/cycle=(monthly|yearly)/, 'cycle=' + cyc);
      });
      opts.forEach((o) => o.classList.toggle('is-active', (o.dataset.bill === 'annual') === annual));
    };
    billingSwitch.addEventListener('change', () => apply(billingSwitch.checked));
    apply(billingSwitch.checked);
  }

  // ---------------- Mobile nav (lightweight: expand inline) ----------------
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        Object.assign(navLinks.style, {
          display: 'flex',
          position: 'absolute',
          top: '64px',
          left: '0',
          right: '0',
          flexDirection: 'column',
          background: 'var(--paper)',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          padding: '18px 24px 24px',
          gap: '18px',
          zIndex: '60',
        });
      } else {
        navLinks.removeAttribute('style');
      }
    });
  }

  // ---------------- Cross-domain: forward UTM + ad click-IDs to the app ----------------
  // Bewaart campagne-/click-parameters van de landings-URL (first-touch, per sessie) en
  // plakt ze op alle links naar de app, zodat de app de aanmelding aan de juiste
  // advertentie kan toeschrijven. GA4 koppelt de bezoeker-ID zelf via de _gl-linker;
  // dit forwardt de marketing-attributie (gclid, li_fat_id, utm_*, enz.).
  (function forwardAttribution() {
    const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'gbraid', 'wbraid', 'gad_source', 'fbclid', 'li_fat_id', 'ttclid', 'msclkid', 'twclid'];
    const STORE = 'pp_attrib';
    let stored = {};
    try { stored = JSON.parse(sessionStorage.getItem(STORE) || '{}'); } catch (e) {}
    try {
      const sp = new URLSearchParams(window.location.search);
      KEYS.forEach((k) => { const v = sp.get(k); if (v && !stored[k]) stored[k] = v; }); // first-touch
    } catch (e) {}
    try { sessionStorage.setItem(STORE, JSON.stringify(stored)); } catch (e) {}
    const keys = Object.keys(stored);
    if (!keys.length) return;
    document.querySelectorAll('a[href*="app.postpilotapp.nl"]').forEach((a) => {
      try {
        const u = new URL(a.href);
        keys.forEach((k) => { if (!u.searchParams.has(k)) u.searchParams.set(k, stored[k]); });
        a.href = u.toString();
      } catch (e) {}
    });
  })();

  // ---------------- Founder seats (live teller, social proof vanaf 20) ----------------
  // Haalt het aantal vergeven Founder-plekken op via een PII-vrije Supabase-RPC
  // (get_founder_seats geeft alléén {claimed, total}, geen klantdata). Het getal
  // verschijnt pas vanaf SHOW_FROM; daaronder blijft de statische tekst staan.
  // Faalt stil (netwerk / te weinig founders) → geen zichtbare wijziging.
  (function founderSeats() {
    const SUPA_URL = 'https://qhwwbkculkqmiyraiblz.supabase.co';
    const SUPA_KEY = 'sb_publishable_6w7e_0sDxK1-7489jdROrg_KilH-KH0';
    const SHOW_FROM = 20;
    const metas = document.querySelectorAll('.founder-counter .counter-meta');
    const strip = document.querySelector('.founder-strip > span:not(.dot)');
    if (!metas.length && !strip) return;
    fetch(SUPA_URL + '/rest/v1/rpc/get_founder_seats', {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rows) => {
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row) return;
        const claimed = parseInt(row.claimed, 10);
        const total = parseInt(row.total, 10) || 100;
        if (!Number.isFinite(claimed) || claimed < SHOW_FROM) return; // houd statische tekst
        metas.forEach((el) => {
          el.textContent = 'Al ' + claimed + ' van de ' + total + ' Founder-plekken vergeven.';
        });
        if (strip) {
          strip.innerHTML = '<span class="hide-sm">Founder Deal — </span>€199 lifetime · al ' +
            claimed + ' van ' + total + ' vergeven.';
        }
      })
      .catch(function () {});
  })();
})();

/* ==========================================================================
   Contact form — /contact
   ========================================================================== */
(function () {
  'use strict';

  const form    = document.getElementById('contactForm');
  const btn     = document.getElementById('cfSubmit');
  const status  = document.getElementById('cfStatus');

  if (!form) return;

  function setStatus(type, msg) {
    status.textContent    = msg;
    status.className      = 'form-status is-visible ' + type;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    /* Clear previous state */
    status.className = 'form-status';
    status.textContent = '';

    /* Client-side validation */
    const name    = form.elements['name'].value.trim();
    const email   = form.elements['email'].value.trim();
    const subject = form.elements['subject'].value;
    const message = form.elements['message'].value.trim();

    if (!name || !email || !subject || !message) {
      setStatus('error', 'Vul alle verplichte velden in.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error', 'Voer een geldig e-mailadres in.');
      return;
    }

    /* Send */
    btn.disabled = true;
    btn.textContent = 'Versturen…';

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('success', 'Bericht verstuurd. We reageren doorgaans binnen 1 werkdag.');
        form.reset();
      } else {
        setStatus('error', data.error || 'Er ging iets mis. Probeer het opnieuw.');
      }
    } catch {
      setStatus('error', 'Geen verbinding. Controleer je internet en probeer het opnieuw.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Stuur bericht <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    }
  });
})();
