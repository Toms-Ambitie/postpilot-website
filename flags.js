/* Vlaggen voor postpilotapp.nl. Laadt in de <head> van elke pagina, vóór de
   stylesheets, zodat alles vanaf de eerste pixel klopt.

   stripeTrial: pas op true zetten als de Stripe-proefperiode werkelijk werkt
   (proefperiode, kaartregistratie, afschrijving op dag 30, bericht op dag 27).
   Dan verschijnt alle 30-dagen-copy (data-requires="stripe-trial") en wordt
   elke oproepknop "Start 30 dagen gratis" in plaats van "Probeer Premium".
   De knopteksten zelf staan op één plek: v6.css, bij "Oproepknoppen". */
(function () {
  var stripeTrial = false;
  if (stripeTrial) document.documentElement.classList.add('trial-aan');
})();
