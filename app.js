/* ==========================================================================
   PostPilot — landing interactions
   ========================================================================== */

(function () {
  'use strict';

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
  document.querySelectorAll('.faq-q').forEach((btn) => {
    const a = btn.nextElementSibling;

    // Initialize: if expanded by default, set max-height
    if (btn.getAttribute('aria-expanded') === 'true' && a) {
      // wait a tick so scrollHeight is correct
      requestAnimationFrame(() => {
        a.style.maxHeight = a.scrollHeight + 'px';
      });
    }

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (open) {
        a.style.maxHeight = '0px';
      } else {
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  // ---------------- Smooth scroll for hash links ----------------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
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
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
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
})();
