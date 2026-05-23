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

  // ---------------- Waitlist modal ----------------
  // App bestaat nog niet; conversie-CTA's openen een wachtlijst-modal i.p.v. een dode link.
  const WAITLIST = new Set(['#start', '#start-free', '#start-basic', '#start-premium', '#claim', '#login']);

  const overlay = document.createElement('div');
  overlay.className = 'wl-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Wachtlijst');
  overlay.innerHTML =
    '<div class="wl-modal">' +
      '<button class="wl-close" aria-label="Sluiten" type="button">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>' +
      '</button>' +
      '<div class="wl-view wl-view-form">' +
        '<div class="wl-eyebrow">WACHTLIJST</div>' +
        '<h3>Als eerste erbij zijn?</h3>' +
        '<p>PostPilot opent binnenkort. Laat je e-mail achter, dan hoor je het meteen — inclusief je kans op de Founder Deal.</p>' +
        '<form class="wl-form" novalidate>' +
          '<label for="wl-email" class="wl-label-sr">E-mailadres</label>' +
          '<input id="wl-email" type="email" name="email" placeholder="jij@bedrijf.nl" autocomplete="email" required aria-describedby="wl-error">' +
          '<button class="btn btn-primary" type="submit"><span class="wl-btn-label">Zet me op de lijst</span></button>' +
          '<p class="wl-error" role="alert" id="wl-error"></p>' +
        '</form>' +
        '<p class="wl-foot">GEEN SPAM · ALLEEN EEN BERICHT BIJ DE LANCERING</p>' +
      '</div>' +
      '<div class="wl-view wl-view-success" hidden>' +
        '<div class="wl-success">' +
          '<div class="check"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
          '<h3>Je staat op de lijst.</h3>' +
          '<p>We sturen je een bericht zodra PostPilot opengaat. Tot snel.</p>' +
          '<button class="btn btn-ghost wl-done" type="button">Sluiten</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  const wlForm = overlay.querySelector('.wl-form');
  const wlFormView = overlay.querySelector('.wl-view-form');
  const wlSuccessView = overlay.querySelector('.wl-view-success');
  const wlInput = wlForm.querySelector('input[type="email"]');
  const wlSubmit = wlForm.querySelector('button[type="submit"]');
  const wlLabel = wlForm.querySelector('.wl-btn-label');
  const wlError = wlForm.querySelector('.wl-error');
  let wlSource = 'website';
  let wlLastFocus = null;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function wlOpen(source) {
    wlSource = source || 'website';
    wlError.textContent = '';
    wlInput.removeAttribute('aria-invalid');
    wlFormView.hidden = false;
    wlSuccessView.hidden = true;
    wlSubmit.disabled = false;
    wlLabel.textContent = 'Zet me op de lijst';
    wlInput.value = '';
    wlLastFocus = document.activeElement;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => wlInput.focus(), 60);
  }
  function wlClose() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (wlLastFocus && wlLastFocus.focus) wlLastFocus.focus();
  }

  overlay.querySelector('.wl-close').addEventListener('click', wlClose);
  overlay.querySelector('.wl-done').addEventListener('click', wlClose);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) wlClose(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) wlClose();
  });

  // Focus trap: keep Tab focus inside the dialog while it is open.
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !overlay.classList.contains('is-open')) return;
    const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.prototype.filter.call(
      overlay.querySelectorAll(sel),
      (el) => el.offsetParent !== null && !el.disabled
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Intercept CTA clicks in the capture phase so the smooth-scroll handler doesn't also fire.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const hash = href.indexOf('#') >= 0 ? '#' + href.split('#')[1] : '';
    if (!WAITLIST.has(hash)) return;
    if (href.charAt(0) === '#') {
      e.preventDefault();
      e.stopImmediatePropagation();
      wlOpen(hash.slice(1));
    }
    // cross-page links (bv. index.html#start) navigeren door; modal opent dan via de hash bij load
  }, true);

  if (WAITLIST.has(window.location.hash)) {
    const src = window.location.hash.slice(1);
    if (window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    wlOpen(src);
  }

  wlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (wlInput.value || '').trim();
    if (!EMAIL_RE.test(email)) {
      wlError.textContent = 'Vul een geldig e-mailadres in.';
      wlInput.setAttribute('aria-invalid', 'true');
      wlInput.focus();
      return;
    }
    wlError.textContent = '';
    wlInput.removeAttribute('aria-invalid');
    wlSubmit.disabled = true;
    wlLabel.textContent = 'Bezig…';
    try {
      const r = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: wlSource }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        wlFormView.hidden = true;
        wlSuccessView.hidden = false;
      } else if (r.status === 503) {
        wlError.innerHTML = 'De wachtlijst staat nog niet aan. Mail ons op <a href="mailto:hallo@postpilotapp.nl">hallo@postpilotapp.nl</a>.';
        wlSubmit.disabled = false;
        wlLabel.textContent = 'Zet me op de lijst';
      } else {
        wlError.textContent = (data && data.error) || 'Er ging iets mis. Probeer het later opnieuw.';
        wlSubmit.disabled = false;
        wlLabel.textContent = 'Zet me op de lijst';
      }
    } catch (err) {
      wlError.textContent = 'Geen verbinding. Probeer het later opnieuw.';
      wlSubmit.disabled = false;
      wlLabel.textContent = 'Zet me op de lijst';
    }
  });
})();
