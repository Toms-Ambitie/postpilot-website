(function(){
'use strict';
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nav scroll state
var nav=document.getElementById('nav');
function onScroll(){nav.classList.toggle('is-scrolled',window.scrollY>24)}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// Mobile menu
var tgl=document.getElementById('navToggle'),mob=document.getElementById('navMobile');
if(tgl&&mob){tgl.addEventListener('click',function(){var o=mob.classList.toggle('open');tgl.setAttribute('aria-expanded',String(o))});mob.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){mob.classList.remove('open')})})}

// Reveal on scroll — alles al zichtbaar bij load krijgt direct .in,
// zodat inhoud nooit achter opacity:0 blijft hangen.
var rv=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window && !reduced){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.05,rootMargin:'0px 0px -5% 0px'});
  var vh=window.innerHeight;
  rv.forEach(function(el){
    var top=el.getBoundingClientRect().top;
    if(top<vh){el.classList.add('in')} else {io.observe(el)}
  });
}else{
  rv.forEach(function(el){el.classList.add('in')});
}

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function(b){
  var a=b.nextElementSibling;
  if(b.getAttribute('aria-expanded')==='true')requestAnimationFrame(function(){a.style.maxHeight=a.scrollHeight+'px'});
  b.addEventListener('click',function(){
    var o=b.getAttribute('aria-expanded')==='true';
    b.setAttribute('aria-expanded',String(!o));
    a.style.maxHeight=o?'0px':a.scrollHeight+'px';
  });
});

// Feature tabs with auto-rotate
(function(){
  var root=document.getElementById('tabs');if(!root)return;
  var tabs=[].slice.call(root.querySelectorAll('.tab')),panes=[].slice.call(root.querySelectorAll('.tab-pane'));
  var i=0,tm=null,DUR=7000,paused=false,started=false;
  function bars(){tabs.forEach(function(t){var b=t.querySelector('.prog i');b.style.transition='none';b.style.width='0'})}
  function show(n){
    i=n;
    tabs.forEach(function(t,k){t.classList.toggle('on',k===n);t.setAttribute('aria-selected',String(k===n))});
    panes.forEach(function(p,k){p.classList.toggle('on',k===n)});
    cycle();
  }
  function cycle(){
    clearTimeout(tm);bars();if(reduced)return;
    var b=tabs[i].querySelector('.prog i');
    requestAnimationFrame(function(){requestAnimationFrame(function(){b.style.transition='width '+DUR+'ms linear';b.style.width='100%'})});
    tm=setTimeout(function(){paused?cycle():show((i+1)%tabs.length)},DUR);
  }
  tabs.forEach(function(t,k){t.addEventListener('click',function(){show(k)})});
  root.addEventListener('mouseenter',function(){paused=true});
  root.addEventListener('mouseleave',function(){paused=false});
  if('IntersectionObserver' in window){
    var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!started){started=true;o.unobserve(root);cycle()}})},{threshold:.3});
    o.observe(root);
  }else cycle();
})();

// Sticky CTA (mobile)
var sc=document.getElementById('stickyCta'),pr=document.getElementById('pricing');
if(sc){
  window.addEventListener('scroll',function(){
    var past=window.scrollY>700;
    var r=pr?pr.getBoundingClientRect():null;
    var inPricing=r&&r.top<window.innerHeight&&r.bottom>0;
    sc.classList.toggle('show',past&&!inPricing);
  },{passive:true});
}

// Static waves (feature mockup)
document.querySelectorAll('[data-static-wave]').forEach(function(w){
  for(var i=0;i<40;i++){
    var b=document.createElement('i');
    b.style.height=(6+Math.round(Math.abs(Math.sin(i*.7))*22+Math.random()*6))+'px';
    w.appendChild(b);
  }
});

// Hero demo FSM
var app=document.getElementById('demoApp');if(!app)return;
var badge=document.getElementById('demoBadge'),state=document.getElementById('demoState'),timer=document.getElementById('demoTimer'),mic=document.getElementById('micBtn'),wave=document.getElementById('wave'),tr=document.getElementById('transcript'),post=document.getElementById('demoPost'),body=document.getElementById('postBody'),pub=document.getElementById('pubBtn');
var bars=[];for(var i=0;i<40;i++){var b=document.createElement('i');wave.appendChild(b);bars.push(b)}
var SPOKEN=['…dus','eh,','die','klant','van','vier','maanden','terug','belde','vanochtend,','ineens','gewoon','ja.','Geduld','werkt','dus','echt…'];
var TEXT='Vier maanden geleden gaf ik een pitch waarvan ik dacht: die landt niet.\n\nVanochtend belde de klant. Het landde wel. Het had alleen tijd nodig.\n\nSales is niet altijd opvolgen. Soms is het ruimte geven, bij hen, niet bij jou.\n\nWat is jouw langste ‘ja’ geweest?';
var gen=0,running=false,t0=0,raf=null,wi=null;
function fmt(s){return s.toFixed(1).replace('.',',')+' s'}
function timerOn(on){
  if(on){t0=performance.now();(function t(){timer.textContent=fmt((performance.now()-t0)/1000);raf=requestAnimationFrame(t)})()}
  else if(raf){cancelAnimationFrame(raf);raf=null}
}
function wait(ms,g){return new Promise(function(res,rej){setTimeout(function(){g!==gen?rej(new Error('x')):res()},ms)})}
function waveOn(on){
  wave.classList.toggle('live',on);
  bars.forEach(function(b){b.style.height='5px'});
  if(wi){clearInterval(wi);wi=null}
  if(on&&!reduced){wi=setInterval(function(){bars.forEach(function(b){b.style.height=(4+Math.random()*28)+'px'})},120)}
}
function setBadge(cls,txt){badge.className='badge'+(cls?' '+cls:'');state.textContent=txt}
function reset(){
  mic.classList.remove('live');waveOn(false);timerOn(false);timer.textContent='0,0 s';
  setBadge('','Klaar om op te nemen');tr.innerHTML='Tik op de microfoon en praat zoals je tegen een collega praat. Ehs mogen.';
  post.classList.remove('live');body.textContent='';pub.disabled=true;
}
async function run(){
  if(running)return;running=true;var g=++gen;
  try{
    reset();
    mic.classList.add('live');waveOn(true);timerOn(true);setBadge('rec','Opname');tr.innerHTML='';
    for(var i=0;i<SPOKEN.length;i++){await wait(reduced?20:170,g);var s=document.createElement('span');s.className='heard';s.textContent=(i?' ':'')+SPOKEN[i];tr.appendChild(s)}
    await wait(400,g);mic.classList.remove('live');waveOn(false);setBadge('warn','PostPilot schrijft…');post.classList.add('live');
    await wait(reduced?80:700,g);
    var caret=document.createElement('span');caret.className='caret';var step=reduced?40:3;
    for(var j=0;j<TEXT.length;j+=step){body.textContent=TEXT.slice(0,j+step);body.appendChild(caret);await wait(reduced?4:26,g)}
    body.textContent=TEXT;timerOn(false);
    timer.textContent='24,6 s';
    setBadge('ok','Klaar, jij keurt goed');pub.disabled=false;
    await wait(5500,g);running=false;run();
  }catch(e){running=false}
}
if('IntersectionObserver' in window){
  var st=false;
  var dio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!st){st=true;dio.unobserve(app);setTimeout(run,500)}})},{threshold:.3});
  dio.observe(app);
}else setTimeout(run,800);
mic.addEventListener('click',function(){gen++;running=false;timerOn(false);setTimeout(run,60)});
})();
