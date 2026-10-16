/* Vlaggen voor postpilotapp.nl. Laadt in de <head> van elke pagina, vóór de
   stylesheets, zodat alles vanaf de eerste pixel klopt.

   stripeTrial: staat aan sinds 16 oktober 2026, nadat een live checkout op
   productie 30 dagen gratis en daarna €19 per maand liet zien. Aan = alle
   30-dagen-copy (data-requires="stripe-trial") zichtbaar en elke oproepknop
   "Start 30 dagen gratis". Uit = verborgen en "Probeer Premium".
   Een belofte over een bericht vóór het einde van de proef staat bewust NIET
   op de site, tot de app die herinnering aantoonbaar verstuurt.
   De knopteksten zelf staan op één plek: v6.css, bij "Oproepknoppen". */
(function () {
  var stripeTrial = true;
  if (stripeTrial) document.documentElement.classList.add('trial-aan');
})();
