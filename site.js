/* Gedeeld script voor alle pagina's (naast v6.js):
   skip-link, knopteksten, cookiekeuze voor de app, attributie naar de app,
   contactformulier. */
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

  // Cookiekeuze delen met de app. CookieYes bewaart de keuze alleen op de host
  // van de website (_rootDomain is leeg; delen met subdomeinen kan alleen met
  // CookieYes Pro). Daarom zetten we dezelfde keuze in pp_toestemming op
  // .postpilotapp.nl, zodat app.postpilotapp.nl hem kan lezen.
  // - Waarde: analytics:yes|no,advertisement:yes|no.
  // - Na elke keuze in de banner opnieuw gezet, ook bij intrekken (dan "no").
  // - Bij het laden alleen gezet als hij ontbreekt of afwijkt, zodat hij niet
  //   langer geldt dan de keuze in CookieYes (scriptExpiry: 365 dagen).
  // - Nog geen keuze in CookieYes: geen pp_toestemming, een oude wordt gewist.
  (function deelToestemming() {
    var NAAM = 'pp_toestemming';
    var DAGEN = 365;
    var host = location.hostname;
    var domein = (host === 'postpilotapp.nl' || /\.postpilotapp\.nl$/.test(host)) ? '; Domain=.postpilotapp.nl' : '';

    function waarde(analytics, advertisement) {
      return 'analytics:' + (analytics ? 'yes' : 'no') + ',advertisement:' + (advertisement ? 'yes' : 'no');
    }
    function zet(w) {
      document.cookie = NAAM + '=' + w + '; Max-Age=' + (DAGEN * 86400) + '; Path=/' + domein + '; SameSite=Lax; Secure';
    }
    function wis() {
      document.cookie = NAAM + '=; Max-Age=0; Path=/' + domein + '; SameSite=Lax; Secure';
    }
    function huidig() {
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + NAAM + '=([^;]*)'));
      return m ? m[1] : null;
    }
    // De keuze zoals CookieYes hem in zijn eigen cookie heeft staan, of null.
    function keuzeUitCookieYes() {
      try {
        var m = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]*)/);
        if (!m) return null;
        var w = decodeURIComponent(m[1]);
        if (!/(?:^|,)\s*action:yes(?:,|$)/.test(w)) return null;
        return waarde(/(?:^|,)\s*analytics:yes(?:,|$)/.test(w), /(?:^|,)\s*advertisement:yes(?:,|$)/.test(w));
      } catch (e) { return null; }
    }

    try {
      var k = keuzeUitCookieYes();
      var nu = huidig();
      if (k === null) { if (nu !== null) wis(); }
      else if (nu !== k) zet(k);
    } catch (e) {}

    // CookieYes stuurt dit na elke keuze, met de geaccepteerde categorieën.
    document.addEventListener('cookieyes_consent_update', function (ev) {
      try {
        var aan = (ev && ev.detail && ev.detail.accepted) || [];
        zet(waarde(aan.indexOf('analytics') !== -1, aan.indexOf('advertisement') !== -1));
      } catch (e) {}
    });
  })();

  // Campagnevelden uit het adres van de bezoeker meegeven aan links naar de
  // app, zodat een aanmelding zijn bron houdt.
  // - utm_* gaan altijd mee in de link van deze pagina (er wordt niets bewaard).
  // - Onthouden over meerdere pagina's (sessionStorage) alleen met
  //   toestemming voor analytische cookies; _gl ook alleen dan.
  // - Click-ID's van advertentienetwerken alleen met toestemming voor
  //   advertenties.
  // De toestemming wordt bij elke klik opnieuw gelezen, zodat een keuze in de
  // cookiebanner meteen telt. De app legt zelf ook alleen met toestemming vast.
  (function forwardAttribution() {
    var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    var ANALYTICS = ['_gl'];
    var ADS = ['gclid', 'gbraid', 'wbraid', 'gad_source', 'fbclid', 'li_fat_id', 'ttclid', 'msclkid', 'twclid'];
    var STORE = 'pp_attrib';

    function toestemming() {
      var uit = { analytics: false, advertenties: false };
      try {
        var m = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]*)/);
        if (!m) return uit;
        var w = decodeURIComponent(m[1]);
        uit.analytics = /(?:^|,)\s*analytics:yes(?:,|$)/.test(w);
        uit.advertenties = /(?:^|,)\s*advertisement:yes(?:,|$)/.test(w);
      } catch (e) {}
      return uit;
    }

    function velden() {
      var t = toestemming();
      var mag = UTM.slice();
      if (t.analytics) mag = mag.concat(ANALYTICS);
      if (t.advertenties) mag = mag.concat(ADS);
      var stored = {};
      if (t.analytics) {
        try { stored = JSON.parse(sessionStorage.getItem(STORE) || '{}') || {}; } catch (e) { stored = {}; }
      }
      var uit = {};
      mag.forEach(function (k) { if (stored[k]) uit[k] = String(stored[k]).slice(0, 200); });
      try {
        var sp = new URLSearchParams(window.location.search);
        mag.forEach(function (k) { var v = sp.get(k); if (v && !uit[k]) uit[k] = v.slice(0, 200); });
      } catch (e) {}
      if (t.analytics && Object.keys(uit).length) {
        try { sessionStorage.setItem(STORE, JSON.stringify(uit)); } catch (e) {}
      }
      return uit;
    }

    function versier(a) {
      try {
        var mee = velden();
        var keys = Object.keys(mee);
        if (!keys.length) return;
        var u = new URL(a.href);
        if (u.hostname !== 'app.postpilotapp.nl') return;
        keys.forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, mee[k]); });
        a.href = u.toString();
      } catch (e) {}
    }

    function alle() {
      document.querySelectorAll('a[href*="app.postpilotapp.nl"]').forEach(versier);
    }
    alle();
    // Vlak voor het volgen van een link nog een keer, met de toestemming van dat moment.
    ['pointerdown', 'keydown'].forEach(function (soort) {
      document.addEventListener(soort, function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="app.postpilotapp.nl"]') : null;
        if (a) versier(a);
      }, true);
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
