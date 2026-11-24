/* Script van de vijf nieuwe pagina's. Elk onderdeel draait alleen als het
   bijbehorende element op de pagina staat. Knopteksten, attributie naar de app
   en de skip-link staan in /site.js. */
(function(){
'use strict';
var R=document.documentElement;R.classList.add('js');
var $=function(s){return document.querySelector(s)};
var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Oude ankers van de vorige homepage naar de nieuwe plek sturen.
(function oudeAnkers(){
  if(location.pathname!=='/'&&!/\/index(\.html)?$/.test(location.pathname))return;
  var naar={'#pricing':'/prijzen','#founder':'/prijzen#founder','#faq':'#vragen','#hoe':'#zo-werkt-het','#product':'#waarom','#voorbeelden':'#momenten'};
  var doel=naar[location.hash];
  if(!doel)return;
  if(doel.charAt(0)==='#'){history.replaceState(null,'',doel)}else{location.replace(doel)}
})();

try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch(e){}
function naarStart(){var d=location.hash&&document.getElementById(location.hash.slice(1));if(d){d.scrollIntoView({behavior:'instant',block:'start'})}else{window.scrollTo({top:0,left:0,behavior:'instant'})}}
naarStart();window.addEventListener('load',naarStart);

// Inkomen bij scrollen
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.2});
  $$('.rv,.proof,.other,.qs,.nots,.tl').forEach(function(el){io.observe(el)});
}else{
  $$('.rv,.proof,.other,.qs,.nots,.tl').forEach(function(el){el.classList.add('in')});
}

// Home: getallen tellen een keer op als ze in beeld komen. In de HTML staat het
// eindgetal; zonder script of met minder beweging blijft dat gewoon staan.
var tellers=$$('[data-tel]').filter(function(el){return +el.getAttribute('data-tel')>0});
if(tellers.length&&!rm&&'IntersectionObserver' in window&&window.requestAnimationFrame){
  var tel=function(el){var doel=+el.getAttribute('data-tel'),duur=700,t0=null;
    var stap=function(t){if(t0===null)t0=t;var p=Math.min(1,(t-t0)/duur),e=1-Math.pow(1-p,3);el.textContent=String(Math.round(doel*e));if(p<1)requestAnimationFrame(stap)};
    el.textContent='0';requestAnimationFrame(stap)};
  var to=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){to.unobserve(e.target);tel(e.target)}})},{threshold:.6});
  tellers.forEach(function(el){to.observe(el)});
}

// Schakelaars die markeringen aan en uit zetten
$$('.sw').forEach(function(sw){var doel=document.getElementById(sw.getAttribute('data-voor'));sw.addEventListener('click',function(){var aan=sw.getAttribute('aria-checked')!=='true';sw.setAttribute('aria-checked',String(aan));if(doel){doel.classList.add('in');doel.classList.toggle('off',!aan)}})});

// Tabbladen
$$('[role=tablist]').forEach(function(lijst){var tabs=$$('[role=tab]',lijst);
  function kies(t){tabs.forEach(function(x){var a=x===t;x.setAttribute('aria-selected',String(a));x.tabIndex=a?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!a})}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){kies(t)});t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;var n=tabs[(i+d+tabs.length)%tabs.length];kies(n);n.focus()})});
});

// Zo werkt het: filmstrook die meeschuift op een breed scherm
var pin=$('.pin');
if(pin){var binnen=pin.querySelector('.pin-in'),track=pin.querySelector('.track'),ruler=pin.querySelector('.ruler'),shots=$$('.shot',track),breed=window.matchMedia('(min-width:901px)');
  var over=function(){var l=shots[shots.length-1];return Math.max(0,l.offsetLeft+l.offsetWidth+shots[0].offsetLeft-window.innerWidth)};
  var schuif=function(){if(pin.classList.contains('flat'))return;var o=over(),r=pin.getBoundingClientRect(),p=Math.min(1,Math.max(0,(64-r.top)/Math.max(1,o)));track.style.transform='translate3d('+(-p*o)+'px,0,0)';ruler.style.setProperty('--p',p)};
  var zet=function(){var vlak=!breed.matches||rm;pin.classList.toggle('flat',vlak);if(vlak){pin.style.height='';track.style.transform='';return}pin.style.height=(binnen.offsetHeight+over())+'px';schuif()};
  zet();window.addEventListener('resize',zet);window.addEventListener('load',zet);window.addEventListener('scroll',schuif,{passive:true});
}

// Voor wie: video's spelen alleen als ze in beeld zijn
if('IntersectionObserver' in window){
  var vo=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting&&!rm){var p=v.play();if(p&&p.catch)p.catch(function(){})}else{v.pause()}})},{threshold:.4});
  $$('.vid video').forEach(function(v){vo.observe(v)});
}

// Home: stappen en de telefoon die meescrollt
var steps=$$('.steps li'),scr=$$('.scr');
if(steps.length&&scr.length&&'IntersectionObserver' in window){
  var so=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var i=steps.indexOf(e.target);steps.forEach(function(s,j){s.classList.toggle('on',j===i)});scr.forEach(function(s,j){s.classList.toggle('on',j===i)})})},{rootMargin:window.matchMedia('(max-width:900px)').matches?'-62% 0px -28% 0px':'-48% 0px -48% 0px'});
  steps.forEach(function(s){so.observe(s)});
}

// Home: golflijnen achter de film
var cv=$('#veld');
var target=.35;
if(cv&&cv.getContext){
  var cx=cv.getContext('2d'),W=0,H=0,level=.35,t=0,zichtbaar=true,bezig=false;
  var maat=function(){var r=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)};
  var lus=function(){if(!bezig){bezig=true;requestAnimationFrame(teken)}};
  var teken=function(){bezig=false;level+=(target-level)*.05;cx.clearRect(0,0,W,H);for(var k=0;k<6;k++){cx.beginPath();var basis=H*(.2+.12*k),amp=(10+k*8)*level;for(var x=0;x<=W+8;x+=8){var y=basis+Math.sin(x*.0052+t*(.55+k*.12)+k*1.7)*amp+Math.sin(x*.0149-t*(.8+k*.06)+k)*amp*.45;if(x)cx.lineTo(x,y);else cx.moveTo(x,y)}cx.strokeStyle='rgba(232,166,64,'+(.11+.045*k)+')';cx.lineWidth=1.5;cx.stroke()}t+=.016;if(zichtbaar&&!rm)lus()};
  maat();teken();window.addEventListener('resize',function(){maat();lus()});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){zichtbaar=es[0].isIntersecting;if(zichtbaar)lus()}).observe(cv);
}

// Home: de film met vier opnames die een post worden
var clips=$$('.clip'),pc=$('#pc'),pcT=$('#pc-t');
if(clips.length&&pc&&pcT){
  var huidig=0,ronde=0,gestart=false;
  var posts=['Ken je dat? Een klant zegt nee, en drie maanden later belt ze zelf terug.','Vanochtend rondde ik een opdracht af voor een klant die ik niet heb hoeven zoeken.','Twee weken liep onze campagne slechter dan gepland. Toen veranderden we één ding.','Na de training bleef één deelnemer zitten, met een vraag die ik nooit eerder kreeg.'];
  var says=clips.map(function(c){return c.querySelector('.cap').textContent});
  var wacht=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
  var toon=function(i){huidig=i;clips.forEach(function(c,j){var vd=c.querySelector('video');c.classList.toggle('on',j===i);c.setAttribute('aria-pressed',String(j===i));if(j===i){var pr=vd.play();if(pr&&pr.catch)pr.catch(function(){})}else{vd.pause()}})};
  var scene=async function(i,m){toon(i);pc.classList.add('away');var cap=clips[i].querySelector('.cap'),rt=clips[i].querySelector('.rt');cap.textContent='';var ws=says[i].split(' ').map(function(w){var el=document.createElement('span');el.className='n';el.textContent=w;cap.appendChild(el);cap.appendChild(document.createTextNode(' '));return el});target=1;await wacht(500);for(var j=0;j<ws.length;j++){if(m!==ronde)return;ws[j].classList.remove('n');rt.textContent='Opname 0:'+('0'+Math.floor(j*.5)).slice(-2);await wacht(200)}target=.3;await wacht(800);if(m!==ronde)return;pcT.textContent=posts[i];pc.classList.remove('away');await wacht(5200)};
  var film=async function(i){gestart=true;for(;;){var m=++ronde;await scene(i%clips.length,m);if(m!==ronde)return;i++}};
  clips.forEach(function(c,i){c.addEventListener('click',function(){if(i===huidig)return;if(rm){toon(i);pcT.textContent=posts[i]}else{film(i)}})});
  if(rm){clips.forEach(function(c){c.querySelector('video').pause()})}
  else wacht(5600).then(function(){if(!gestart)film(1)});
}
})();
