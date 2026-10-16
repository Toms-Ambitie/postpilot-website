/* Gedeeld script voor alle pagina's (naast v6.js):
   skip-link, knopteksten, attributie naar de app, contactformulier. */
(function () {
  'use strict';

  // Skip-link + focusdoel voor toetsenbord- en screenreadergebruikers
  (function skipLink() {
    var main = document.getElementById('main') || document.querySelector('main');
    if (!main || document.querySelector('.skip-link')) return;
    if (!main.id) main.id = 'main';
    main.setAttribute('tabindex', '-1');
    var a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#main';
    a.textContent = 'Naar de inhoud';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      main.focus();
      main.scrollIntoView();
    });
    document.body.insertBefore(a, document.body.firstChild);
  })();

  // Campagne- en klik-ID's van de landings-URL doorgeven aan links naar de app,
  // zodat een aanmelding aan de juiste advertentie gekoppeld kan worden.
  // First-touch: de eerste waarde in een sessie wint. GA4 koppelt de bezoeker zelf
  // via de _gl-linker; die geven we ook door als hij in de URL staat.
  // Knopteksten staan op één plek: v6.css (.cta-label::before), gestuurd door de
  // vlag stripeTrial in /flags.js. Zet die tekst daarna als echte tekst in de
  // knop, zodat schermlezers, Tag Manager en zoekmachines dezelfde tekst zien.
  (function ctaLabels() {
    document.querySelectorAll('.cta-label').forEach(function (el) {
      var c = getComputedStyle(el, '::before').content;
      if (!c || c === 'none' || c === 'normal') return;
      el.textContent = c.replace(/^["']|["']$/g, '');
      el.classList.add('is-set');
    });
  })();

  (function forwardAttribution() {
    var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'gbraid', 'wbraid', 'gad_source', 'fbclid', 'li_fat_id', 'ttclid',
      'msclkid', 'twclid', '_gl'];
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

  // Contactformulier (contact en investeren) → /api/contact
  (function contactForm() {
    var form = document.getElementById('contactForm');
    var btn = document.getElementById('cfSubmit');
    var status = document.getElementById('cfStatus');
    if (!form || !btn || !status) return;
    var btnHtml = btn.innerHTML;

    function setStatus(type, msg) {
      status.textContent = msg;
      status.className = 'form-status is-visible ' + type;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      var el = form.elements;
      var name = (el['name'] && el['name'].value || '').trim();
      var email = (el['email'] && el['email'].value || '').trim();
      var subject = el['subject'] ? el['subject'].value : '';
      var message = (el['message'] && el['message'].value || '').trim();
      var website = el['website'] ? el['website'].value : '';

      if (!name || !email || !subject || !message) {
        setStatus('error', 'Vul alle verplichte velden in.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('error', 'Voer een geldig e-mailadres in.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Versturen…';
      try {
        var res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, subject: subject, message: message, website: website })
        });
        var data = await res.json().catch(function () { return {}; });
        if (res.ok) {
          setStatus('success', 'Bericht verstuurd. We reageren doorgaans binnen 1 werkdag.');
          form.reset();
        } else {
          setStatus('error', data.error || 'Er ging iets mis. Probeer het opnieuw.');
        }
      } catch (err) {
        setStatus('error', 'Geen verbinding. Controleer je internet en probeer het opnieuw.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = btnHtml;
      }
    });
  })();
})();
