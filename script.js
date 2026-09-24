/* INTERACTIVE PORTFOLIO — dependency-free 3D projection, scroll scenes and pointer motion. */
'use strict';
(() => {
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, min=0, max=1) => Math.max(min, Math.min(max,v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 901px) and (min-height: 700px)');
let motion = !reduce.matches;
try { if (localStorage.getItem('dn-motion') === 'off') motion = false; } catch (_) {}
const nav = $('#navigation'), menu = $('.menu-toggle');
function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); }
menu.addEventListener('click', () => { const open=nav.classList.toggle('open'); menu.setAttribute('aria-expanded',String(open)); });
nav.addEventListener('click', e=>{ if(e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e=>{if(e.key==='Escape' && nav.classList.contains('open')){closeMenu();menu.focus();}});
document.addEventListener('click', e=>{if(!e.target.closest('.site-header')) closeMenu();});
matchMedia('(min-width:701px)').addEventListener('change',closeMenu);
$('#year').textContent=new Date().getFullYear();
const projectSection=$('#projects'), track=$('.project-track'), cards=$$('.project');
let activeProject=0, scrollFraction=0, scrollY=window.scrollY, pageMax=1;
let projectTop=0, projectRange=1, projectTravel=0, pinned=false;
let frame=0,lastTime=0,fieldTime=0,dirty=true;
const canvas=$('#energy-field'), ctx=canvas.getContext('2d');
let width=innerWidth,height=innerHeight,dpr=1;
let rotation=.4,rotationTarget=.4,tilt=.2,tiltTarget=.2,dragging=false,dragX=0,dragY=0;
let pointerX=0,pointerY=0,pulse=0;
const points=Array.from({length:innerWidth<701?440:820},(_,i)=>i); // deterministic spherical geometry
const count=points.length;
for(let i=0;i<count;i++) { const y=1-(i/(count-1))*2, r=Math.sqrt(1-y*y),theta=i*2.399963229728653;points[i]={x:Math.cos(theta)*r,y,z:Math.sin(theta)*r}; }
function resize() {
 width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';
 if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
 measure();dirty=true;requestFrame();
}
function measure(){
 pinned=motion&&desktop.matches;
 document.documentElement.classList.toggle('scroll-showcase',pinned);
 projectTop=projectSection.getBoundingClientRect().top+window.scrollY;
 projectRange=Math.max(1,projectSection.offsetHeight-(height-88));
 projectTravel=Math.max(0,track.scrollWidth-track.clientWidth);
 pageMax=Math.max(1,document.documentElement.scrollHeight-height);
 if(!pinned)track.style.transform='none';
}
function updateProject(index){
 activeProject=clamp(index,0,cards.length-1);
 $('.project-counter').textContent=String(activeProject+1).padStart(2,'0')+' / 03';
 $('.project-meter span').style.width=((activeProject+1)/cards.length*100)+'%';
 $('.project-prev').disabled=activeProject===0;$('.project-next').disabled=activeProject===cards.length-1;
}
function goProject(index){
 index=clamp(index,0,cards.length-1);
 if(pinned)window.scrollTo({top:projectTop-88+projectRange*index/(cards.length-1),behavior:motion?'smooth':'instant'});
 else if(innerWidth<=900)track.scrollTo({left:cards[index].offsetLeft-cards[0].offsetLeft,behavior:motion?'smooth':'instant'});
 else cards[index].scrollIntoView({behavior:motion?'smooth':'instant',block:'center'});
 updateProject(index);
}
$('.project-prev').addEventListener('click',()=>goProject(activeProject-1));
$('.project-next').addEventListener('click',()=>goProject(activeProject+1));
track.addEventListener('scroll',()=>{if(!pinned){const step=cards[1].offsetLeft-cards[0].offsetLeft;updateProject(Math.round(track.scrollLeft/Math.max(1,step)));}},{passive:true});
// Keep keyboard-focused project controls inside the horizontal viewport.
track.addEventListener('focusin',e=>{const card=e.target.closest('.project');if(card)goProject(cards.indexOf(card));});
$$('details').forEach(d=>d.addEventListener('toggle',()=>{measure();dirty=true;requestFrame();}));
function applyMotion(save=false){
 document.documentElement.classList.toggle('motion-off',!motion);
 document.documentElement.classList.toggle('motion-ready',motion);
 $('.motion-toggle').setAttribute('aria-pressed',String(motion));
 $('.motion-label').textContent=motion?'Motion on':'Motion off';
 $('#pulse-field').disabled=!motion;
 if(save)try{localStorage.setItem('dn-motion',motion?'on':'off');}catch(_){}
 if(!motion){$('.hero-photo img').style.transform='none';$$('.name-line').forEach(e=>e.style.transform='none');$$('.tilt,.magnetic').forEach(e=>e.style.transform='');}
 measure();dirty=true;requestFrame();
}
$('.motion-toggle').addEventListener('click',()=>{motion=!motion&&!reduce.matches;applyMotion(true);});
reduce.addEventListener('change',()=>{motion=!reduce.matches;applyMotion();});
desktop.addEventListener('change',()=>{measure();dirty=true;requestFrame();});
$('#pulse-field').addEventListener('click',()=>{if(motion){pulse=1;rotationTarget+=.7;requestFrame();}});
const stage=$('.hero-stage');
stage.addEventListener('pointerdown',e=>{
 if(!motion||e.pointerType==='touch'||e.target.closest('a,button,figure'))return;
 dragging=true;dragX=e.clientX;dragY=e.clientY;stage.setPointerCapture(e.pointerId);stage.style.cursor='grabbing';
});
stage.addEventListener('pointermove',e=>{
 if(dragging){rotationTarget+=(e.clientX-dragX)*.009;tiltTarget=clamp(tiltTarget+(e.clientY-dragY)*.005,-1,1);dragX=e.clientX;dragY=e.clientY;}
});
function release(){dragging=false;stage.style.cursor='';}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
window.addEventListener('pointermove',e=>{
 pointerX=(e.clientX/width-.5)*2;pointerY=(e.clientY/height-.5)*2;
 if(motion&&e.pointerType==='mouse')$('.cursor-aura').style.transform=`translate(${e.clientX-110}px,${e.clientY-110}px)`;
},{passive:true});
$$('.tilt').forEach(el=>{
 el.addEventListener('pointermove',e=>{
  if(!motion||e.pointerType!=='mouse')return;
  const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  el.style.transform=`perspective(1000px) rotateX(${-y*7}deg) rotateY(${x*9}deg) ${el.classList.contains('hero-photo')?'rotate(4deg)':''}`;
 });
 el.addEventListener('pointerleave',()=>el.style.transform='');
});
$$('.magnetic').forEach(el=>{
 el.addEventListener('pointermove',e=>{if(!motion||e.pointerType!=='mouse')return;const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.2}px,${(e.clientY-r.top-r.height/2)*.2}px)`;});
 el.addEventListener('pointerleave',()=>el.style.transform='');
});
if('IntersectionObserver' in window){
 const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target);}}),{threshold:.06});
 $$('.reveal').forEach(el=>reveal.observe(el));
 const sections=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){const ids=['home','about','projects','experience','education','contact'];$('#scene-label').textContent=String(ids.indexOf(e.target.id)+1).padStart(2,'0')+' / '+(e.target.id==='home'?'INTRODUCTION':e.target.id.toUpperCase());$$('nav a').forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}),{rootMargin:'-10% 0px -65% 0px'});
 $$('main section[id]').forEach(el=>sections.observe(el));
 const rows=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-active',e.isIntersecting)),{rootMargin:'-20% 0px -30% 0px'});
 $$('.timeline-row').forEach(el=>rows.observe(el));
} else $$('.reveal').forEach(e=>e.classList.add('visible'));
function drawField(dt){
 if(!ctx)return;
 ctx.clearRect(0,0,width,height);
 if(motion){fieldTime+=dt;rotationTarget+=dragging?0:dt*.075;pulse=Math.max(0,pulse-dt*.55);}
 rotation+=(rotationTarget-rotation)*.07;tilt+=(tiltTarget-tilt)*.07;
 const t=fieldTime, sc=scrollFraction, radius=Math.min(width*.32,height*.49)*(1+pulse*.23);
 const cx=width*(width<701?.57:.7)+pointerX*10,cy=height*.49+pointerY*8;
 const angle=rotation+sc*3,ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
 const morph=clamp(sc*2.1), alpha=scrollY<height*1.5?.65:.25;
 function project(x,y,z){
  const rx=x*ca-z*sa,rz=x*sa+z*ca,ry=y*ct-rz*st,zz=y*st+rz*ct;
  const depth=2.8/(2.8-zz*.55);return {x:cx+rx*radius*depth,y:cy+ry*radius*depth,z:zz,depth};
 }
 // Orbital paths give the field an explicit, rotating three-dimensional structure.
 for(let ring=0;ring<3;ring++){
  ctx.beginPath();for(let j=0;j<=100;j++){
   const a=j/100*Math.PI*2,rr=1.11+ring*.1;
   const x=Math.cos(a)*rr,y=Math.sin(a)*Math.cos(ring*1.07+t*.06)*rr,z=Math.sin(a)*Math.sin(ring*1.07+t*.06)*rr;
   const p=project(x,y,z);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
  }ctx.strokeStyle=`rgba(185,215,117,${alpha*(.16+ring*.025)})`;ctx.lineWidth=.65;ctx.stroke();
 }
 for(let i=0;i<count;i++){
  const v=points[i],wave=Math.sin(v.x*7+t*.5+v.z*4)*.13*morph;
  const p=project(v.x*(1+morph*.3),v.y*(1-morph*.35)+wave,v.z);
  const a=clamp((p.z+1.8)/3.2)*alpha;
  ctx.fillStyle=`rgba(${i%11===0?'230,255,173':'172,203,111'},${a})`;
  const size=(i%11===0?1.65:.85)*p.depth*(1+pulse*.8);ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();
 }
 // A bright point travels along each orbit instead of random flashing.
 for(let i=0;i<3;i++){
  const a=t*(.3+i*.07)+i*2,rr=1.11+i*.1,p=project(Math.cos(a)*rr,Math.sin(a)*Math.cos(i*1.07+t*.06)*rr,Math.sin(a)*Math.sin(i*1.07+t*.06)*rr);
  ctx.fillStyle='#d5fb62';ctx.shadowColor='#d5fb62';ctx.shadowBlur=13;ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 }
 if(pulse>0){ctx.beginPath();ctx.arc(cx,cy,radius*(1+(1-pulse)*1.4),0,Math.PI*2);ctx.strokeStyle=`rgba(213,251,98,${pulse*.45})`;ctx.lineWidth=1;ctx.stroke();}
}
function updateScroll(){
 scrollY=window.scrollY;scrollFraction=clamp(scrollY/pageMax);
 $('.progress').style.transform=`scaleX(${scrollFraction})`;
 if(pinned){const p=clamp((scrollY-projectTop+88)/projectRange);track.style.transform=`translate3d(${-p*projectTravel}px,0,0)`;updateProject(Math.round(p*(cards.length-1)));}
 if(motion){
  const heroProgress=clamp(scrollY/height);$('.hero-photo img').style.transform=`scale(${1.06+heroProgress*.25})`;
  $$('.name-line').forEach((el,i)=>el.style.transform=`translate3d(${heroProgress*(i===0?-45:55)}px,0,0)`);
  const education=$('.education-photo');const pos=education.getBoundingClientRect().top/height;education.querySelector('img').style.transform=`scale(1.12) translateY(${clamp(pos,-1,1)*-3}%)`;
 }
}
function tick(now){
 frame=0;if(document.hidden)return;
 const dt=Math.min((now-(lastTime||now))/1000,.045);lastTime=now;
 if(dirty){updateScroll();dirty=false;}
 drawField(dt);
 if(motion)requestFrame();
}
function requestFrame(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
window.addEventListener('scroll',()=>{dirty=true;requestFrame();},{passive:true});
window.addEventListener('resize',resize);
window.addEventListener('load',()=>{measure();dirty=true;requestFrame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{lastTime=0;dirty=true;requestFrame();}});
applyMotion();resize();updateProject(0);
})();
