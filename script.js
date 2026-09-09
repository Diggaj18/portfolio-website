const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const lerp = (a, b, t) => a + (b - a) * t;
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth <= 820;

/* -------------------------------------------------------
   BOOT SEQUENCE
------------------------------------------------------- */
const boot = qs('#boot');
const bootNumber = qs('#bootNumber');
const bootProgress = qs('#bootProgress');
const circumference = 383.27;
let bootValue = reducedMotion ? 100 : 0;
if (reducedMotion) boot?.classList.add('is-hidden');
else {
  const bootTimer = setInterval(() => {
    bootValue = Math.min(100, bootValue + Math.ceil(Math.random() * 11));
    bootNumber.textContent = String(bootValue).padStart(2, '0');
    bootProgress.style.strokeDashoffset = circumference * (1 - bootValue / 100);
    if (bootValue >= 100) {
      clearInterval(bootTimer);
      setTimeout(() => boot.classList.add('is-hidden'), 260);
    }
  }, 62);
}

/* -------------------------------------------------------
   GLOBAL HUD / NAV / CURSOR
------------------------------------------------------- */
const nav = qs('#nav');
const pageProgress = qs('#pageProgress');
const hudScroll = qs('#hudScroll');
const hudRpm = qs('#hudRpm');
const hudSection = qs('#hudSection');
const cursor = qs('#cursor');
const menuButton = qs('#menuButton');
const navLinks = qs('.nav__links');

menuButton?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
qsa('.nav__links a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

let mouseX = innerWidth * .5, mouseY = innerHeight * .5;
let cursorX = mouseX, cursorY = mouseY;
window.addEventListener('pointermove', e => { mouseX = e.clientX; mouseY = e.clientY; });

function cursorLoop(){
  cursorX += (mouseX - cursorX) * .18;
  cursorY += (mouseY - cursorY) * .18;
  if (cursor) cursor.style.transform = `translate(${cursorX - 21}px,${cursorY - 21}px)`;
  requestAnimationFrame(cursorLoop);
}
if (!reducedMotion && !isMobile()) cursorLoop();

qsa('.project__media').forEach(el => {
  el.addEventListener('mouseenter', () => cursor?.classList.add('is-media'));
  el.addEventListener('mouseleave', () => cursor?.classList.remove('is-media'));
});

qsa('.magnetic').forEach(el => {
  if (reducedMotion || isMobile()) return;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * .13;
    const y = (e.clientY - r.top - r.height / 2) * .18;
    el.style.transform = `translate(${x}px,${y}px)`;
  });
  el.addEventListener('mouseleave', () => el.style.transform = '');
});

const trackedSections = qsa('.tracked-section');
const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) hudSection.textContent = visible.target.dataset.hud || 'SYS / ONLINE';
}, { threshold:[.2,.4,.6] });
trackedSections.forEach(s => sectionObserver.observe(s));

/* Native reveal observer */
qsa('.mechanism-panel > *, .experience__intro > *, .role, .credential, .awards, .capabilities__head > *').forEach(el => el.classList.add('reveal-native'));
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
    else if (!reducedMotion && entry.boundingClientRect.top > innerHeight) entry.target.classList.remove('is-visible');
  });
}, { threshold:.12, rootMargin:'0px 0px -8% 0px' });
qsa('.reveal-native').forEach(el => revealObserver.observe(el));

/* Hero entrance using Web Animations API */
if (!reducedMotion) {
  qsa('.hero-word').forEach((el,i) => el.animate([
    { transform:'translateY(115%) rotate(2deg)' },
    { transform:'translateY(0) rotate(0deg)' }
  ], { duration:1150, delay:540+i*120, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }));
  qsa('.hero__eyebrow, .hero__bottom, .hero__micro').forEach((el,i) => el.animate([
    { opacity:0, transform:'translateY(18px)' },
    { opacity:1, transform:'translateY(0)' }
  ], { duration:760, delay:930+i*75, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' }));
}

/* -------------------------------------------------------
   PROCEDURAL MECHANICAL CANVAS
   Dependency-free pseudo-3D gear assembly.
------------------------------------------------------- */
const worldEl = qs('#mechanicalWorld');
const canvas = qs('#mechanicalCanvas');
const fallback = qs('#mechanicalFallback');
const mechCtx = canvas?.getContext('2d');
let sceneProgress = 0;
let activePanel = -1;
let worldDpr = 1;
let worldW = 1, worldH = 1;

function resizeMechanicalCanvas(){
  if (!canvas || !mechCtx) return;
  worldDpr = Math.min(devicePixelRatio || 1, 1.75);
  worldW = worldEl.clientWidth;
  worldH = worldEl.clientHeight;
  canvas.width = Math.max(1, Math.round(worldW * worldDpr));
  canvas.height = Math.max(1, Math.round(worldH * worldDpr));
  canvas.style.width = worldW + 'px';
  canvas.style.height = worldH + 'px';
}
resizeMechanicalCanvas();

function gearPath(ctx, teeth, rootR, outerR, holeR){
  ctx.beginPath();
  const steps = teeth * 4;
  for(let i=0;i<=steps;i++){
    const phase = i % 4;
    const r = (phase === 1 || phase === 2) ? outerR : rootR;
    const a = i / steps * Math.PI * 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.moveTo(holeR,0);
  ctx.arc(0,0,holeR,0,Math.PI*2,true);
}

function drawGear(ctx, opt){
  const {x,y,teeth,rootR,outerR,holeR,rotation,face,edge,depth=9,scale=1,alpha=1} = opt;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x,y);
  ctx.rotate(rotation);
  ctx.scale(scale,scale);

  // Extrusion stack gives a convincing machined depth without WebGL.
  for(let d=depth; d>0; d--){
    ctx.save();
    ctx.translate(d*.7,d*.42);
    gearPath(ctx,teeth,rootR,outerR,holeR);
    ctx.fillStyle = edge;
    ctx.fill('evenodd');
    ctx.restore();
  }

  gearPath(ctx,teeth,rootR,outerR,holeR);
  const g = ctx.createLinearGradient(-outerR,-outerR,outerR,outerR);
  g.addColorStop(0,'rgba(255,255,255,.9)');
  g.addColorStop(.18,face);
  g.addColorStop(.58,'#6f777c');
  g.addColorStop(.8,face);
  g.addColorStop(1,'#2e3337');
  ctx.fillStyle=g;
  ctx.fill('evenodd');
  ctx.strokeStyle='rgba(255,255,255,.42)';
  ctx.lineWidth=1.1;
  ctx.stroke();

  // Inner bearing.
  ctx.beginPath();ctx.arc(0,0,holeR*.72,0,Math.PI*2);
  const bg=ctx.createRadialGradient(-holeR*.18,-holeR*.18,2,0,0,holeR*.75);
  bg.addColorStop(0,'#d9ff43');bg.addColorStop(.32,'#8a963f');bg.addColorStop(.34,'#3d4347');bg.addColorStop(1,'#111416');
  ctx.fillStyle=bg;ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.stroke();

  // Machined circular groove.
  ctx.beginPath();ctx.arc(0,0,rootR*.74,0,Math.PI*2);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}

function drawBoltCircle(ctx,cx,cy,r,count,rot){
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2,x=Math.cos(a)*r,y=Math.sin(a)*r;
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle='#24292d';ctx.fill();
    ctx.beginPath();ctx.moveTo(x-2.7,y);ctx.lineTo(x+2.7,y);ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.restore();
}

let mechTime=0, lastFrame=performance.now();
let smoothProgress=0, parallaxX=0, parallaxY=0;
function mechanicalFrame(now){
  if (!mechCtx) { fallback.style.display='grid'; return; }
  const dt=Math.min(.04,(now-lastFrame)/1000);lastFrame=now;mechTime+=dt;
  smoothProgress += (sceneProgress-smoothProgress)*.055;
  parallaxX += (((mouseX/innerWidth)-.5)-parallaxX)*.035;
  parallaxY += (((mouseY/innerHeight)-.5)-parallaxY)*.035;

  const ctx=mechCtx;
  ctx.setTransform(worldDpr,0,0,worldDpr,0,0);
  ctx.clearRect(0,0,worldW,worldH);

  const p=smoothProgress;
  const minDim=Math.min(worldW,worldH);
  const S=minDim/720;
  const cx=worldW*.50 + parallaxX*18;
  const cy=worldH*.50 + parallaxY*14;
  const explode=Math.sin(Math.PI*clamp(p/.52))*1.0;

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(p*.20);
  ctx.transform(1,.035,-.11,.94,0,0);
  ctx.scale(lerp(1.03,.90,p),lerp(1.03,.90,p));
  ctx.translate(-cx,-cy);

  // Backplate / datum circles.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-p*.18);
  ctx.strokeStyle='rgba(190,198,202,.16)';ctx.lineWidth=1;
  [205,250].forEach(r=>{ctx.beginPath();ctx.arc(0,0,r*S,0,Math.PI*2);ctx.stroke();});
  ctx.beginPath();ctx.moveTo(-300*S,0);ctx.lineTo(300*S,0);ctx.moveTo(0,-300*S);ctx.lineTo(0,300*S);ctx.stroke();
  ctx.restore();

  // Support rails behind the gears.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.06+p*.08);ctx.lineCap='round';
  ctx.strokeStyle='#596168';ctx.lineWidth=10*S;ctx.beginPath();ctx.moveTo(-185*S,-160*S);ctx.lineTo(230*S,-125*S);ctx.stroke();
  ctx.strokeStyle='#353b40';ctx.lineWidth=7*S;ctx.beginPath();ctx.moveTo(-155*S,190*S);ctx.lineTo(214*S,170*S);ctx.stroke();ctx.restore();

  const bx=cx-35*S, by=cy+8*S;
  const mainRot=mechTime*.34+p*.55;
  const gearBRot=-mechTime*.56-p*.75;
  const gearCRot=mechTime*.72+p*.9;
  const gearDRot=-mechTime*.86-p*1.2;

  // Positions are intentionally separated in Z-equivalent screen offsets during the explode phase.
  const bX=bx+245*S+explode*55*S, bY=by-142*S-explode*12*S;
  const cX=bx+240*S+explode*38*S, cY=by+115*S+explode*45*S;
  const dX=bx+38*S-explode*48*S, dY=by+236*S+explode*32*S;

  drawGear(ctx,{x:bx,y:by,teeth:32,rootR:158*S,outerR:186*S,holeR:56*S,rotation:mainRot,face:'#b9c0c4',edge:'#343a3f',depth:12*S});
  drawBoltCircle(ctx,bx,by,131*S,12,-mainRot*.4);
  drawGear(ctx,{x:bX,y:bY,teeth:20,rootR:96*S,outerR:115*S,holeR:33*S,rotation:gearBRot,face:'#697176',edge:'#252b2f',depth:9*S});
  drawGear(ctx,{x:cX,y:cY,teeth:15,rootR:72*S,outerR:88*S,holeR:25*S,rotation:gearCRot,face:'#d9ff43',edge:'#566010',depth:8*S});
  drawGear(ctx,{x:dX,y:dY,teeth:12,rootR:56*S,outerR:70*S,holeR:20*S,rotation:gearDRot,face:'#ff603d',edge:'#6e2415',depth:7*S});

  // Floating engineering highlights.
  ctx.save();ctx.translate(bx,by);ctx.rotate(-mainRot*.22);
  ctx.strokeStyle='rgba(217,255,67,.72)';ctx.lineWidth=1.1;
  ctx.beginPath();ctx.arc(0,0,213*S,.22,1.52);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,213*S,3.4,4.4);ctx.stroke();
  ctx.restore();
  ctx.restore();

  requestAnimationFrame(mechanicalFrame);
}
requestAnimationFrame(mechanicalFrame);

/* -------------------------------------------------------
   SCROLL STATE — MODEL MOVES BETWEEN TEXT SIDES
------------------------------------------------------- */
const mechanism = qs('.mechanism');
const storyPanels = qsa('.mechanism-panel');
function updateStory(){
  if(!mechanism) return;
  const start = mechanism.offsetTop;
  const span = Math.max(1, mechanism.offsetHeight - innerHeight);
  sceneProgress = clamp((scrollY - start) / span);

  let best=0, dist=Infinity;
  storyPanels.forEach((panel,i)=>{
    const r=panel.getBoundingClientRect();
    const d=Math.abs((r.top+r.height*.5)-innerHeight*.5);
    if(d<dist){dist=d;best=i;}
  });
  if(best!==activePanel){
    activePanel=best;
    if(!isMobile()) worldEl.style.transform = best % 2 === 1 ? `translateX(${-innerWidth*.42}px)` : 'translateX(0)';
  }
}

/* -------------------------------------------------------
   ROTARY WORK INDEX
------------------------------------------------------- */
const projects = qsa('.project');
const work = qs('.work');
const orbit = qs('.work__orbit');
const projectData = [
  {
    meta:'DESIGN / FABRICATION / TESTING',
    title:'Electrical<br/>Momo Steamer',
    desc:'Designed and tested an insulated electric steamer to reduce heat and steam loss while supporting electricity-based cooking as an alternative to LPG.',
    tags:['THERMAL','FABRICATION','E-COOKING']
  },
  {
    meta:'MECHANICAL DESIGN / PERFORMANCE',
    title:'Go-Kart Design<br/>& Fabrication',
    desc:'Constructed a racing go-kart around a 98 cc two-stroke engine and improved the machine through testing to reach a recorded top speed of 37 km/h.',
    tags:['CHASSIS','MECHANISMS','TESTING']
  },
  {
    meta:'ENERGY SYSTEMS / MUNICIPAL SCALE',
    title:'Municipal<br/>Energy Planning',
    desc:'Supported demand assessment, data collection, stakeholder inputs and technical analysis used to shape municipal energy planning and implementation decisions.',
    tags:['DEMAND','PLANNING','SYSTEMS']
  },
  {
    meta:'EFFICIENCY / DATA / EQUIPMENT',
    title:'Energy Audit<br/>& Efficiency',
    desc:'Worked with consumption patterns, equipment-level observations and process energy data to identify efficiency gaps and practical energy-conservation opportunities.',
    tags:['AUDIT','EFFICIENCY','ANALYSIS']
  },
  {
    meta:'CLIMATE / ECONOMICS / POLICY',
    title:'Carbon Pricing<br/>Policy Support',
    desc:'Provided technical and research support to a UNDP-supported national carbon-pricing policy programme, connecting engineering evidence with policy-oriented analysis.',
    tags:['CARBON','POLICY','TRANSITION']
  }
];
let workProgress=0,activeProject=0;
const currentEl=qs('#projectCurrent'),metaEl=qs('#projectMeta'),titleEl=qs('#projectTitle'),descEl=qs('#projectDesc'),tagsEl=qs('#projectTags');

function setProjectCopy(index){
  const d=projectData[index];
  const nodes=[metaEl,titleEl,descEl,tagsEl];
  if (!reducedMotion) nodes.forEach((n,i)=>n.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(10px)'}],{duration:140,delay:i*16,fill:'forwards'}));
  setTimeout(()=>{
    currentEl.textContent=String(index+1).padStart(2,'0'); metaEl.textContent=d.meta; titleEl.innerHTML=d.title; descEl.textContent=d.desc;
    tagsEl.innerHTML=d.tags.map(t=>`<span>${t}</span>`).join('');
    if (!reducedMotion) nodes.forEach((n,i)=>n.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,delay:i*20,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}));
  }, reducedMotion?0:160);
}

function updateWork(){
  if(!work || isMobile()) return;
  const start=work.offsetTop;
  const span=Math.max(1,work.offsetHeight-innerHeight);
  const p=clamp((scrollY-start)/span);
  workProgress=p*(projects.length-1);
  const step=360/projects.length;
  const radiusY=Math.min(innerHeight*.34,300);
  const radiusZ=530;

  projects.forEach((project,i)=>{
    const angle=(i-workProgress)*step;
    const rad=angle*Math.PI/180;
    const front=(Math.cos(rad)+1)/2;
    const x=Math.sin(rad)*Math.min(innerWidth*.07,90);
    const y=Math.sin(rad)*radiusY;
    const z=(Math.cos(rad)-1)*radiusZ;
    const scale=.70+front*.30;
    const opacity=.12+Math.pow(front,2.1)*.88;
    project.style.transform=`translate3d(${x}px,${y}px,${z}px) rotateX(${-angle*.09}deg) rotateY(${Math.sin(rad)*-8}deg) scale(${scale})`;
    project.style.opacity=opacity.toFixed(3);
    project.style.zIndex=String(Math.round(front*100));
  });
  if(orbit) orbit.style.transform=`translate(-50%,-50%) rotate(${workProgress*step*.42}deg)`;

  const next=clamp(Math.round(workProgress),0,projects.length-1);
  if(next!==activeProject){
    activeProject=next;setProjectCopy(next);
    projects.forEach((p,i)=>{
      const v=qs('video',p);
      if(v && p.classList.contains('has-video')) i===next ? v.play().catch(()=>{}) : v.pause();
    });
  }
}

async function hydrateProjectMedia(project){
  const videoPath=project.dataset.video;
  const imagePath=project.dataset.image;
  const video=qs('video',project);
  if(videoPath){
    try{
      const res=await fetch(videoPath,{method:'HEAD',cache:'no-store'});
      if(res.ok){ video.src=videoPath; project.classList.add('has-video'); video.load(); return; }
    }catch(_){ }
  }
  if(imagePath){
    try{
      const res=await fetch(imagePath,{method:'HEAD',cache:'no-store'});
      if(res.ok){ const img=new Image(); img.src=imagePath; img.alt='Project visual'; qs('.project__media',project).prepend(img); project.classList.add('has-image'); }
    }catch(_){ }
  }
}
projects.forEach(hydrateProjectMedia);

/* -------------------------------------------------------
   ENGINEERING SCOPE
------------------------------------------------------- */
const scopeCanvas=qs('#scopeCanvas');
const scopeCtx=scopeCanvas?.getContext('2d');
const scopeLabel=qs('#scopeLabel');
const capabilityButtons=qsa('.capability');
let scopeTarget=.92,scopeValue=.92,scopePhase=0;

capabilityButtons.forEach(btn=>{
  const activate=()=>{
    capabilityButtons.forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');
    scopeTarget=Number(btn.dataset.level)/100;scopeLabel.textContent=btn.querySelector('b').textContent.toUpperCase();
  };
  btn.addEventListener('mouseenter',activate);btn.addEventListener('focus',activate);btn.addEventListener('click',activate);
});

function drawScope(){
  if(!scopeCtx) return;
  const c=scopeCanvas.width,h=scopeCanvas.height,ctx=scopeCtx,cx=c/2,cy=h/2;
  scopeValue+= (scopeTarget-scopeValue)*.035; scopePhase+=.012;
  ctx.clearRect(0,0,c,h);
  ctx.strokeStyle='rgba(236,236,231,.11)';ctx.lineWidth=1;
  [100,180,260].forEach(r=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();});
  ctx.beginPath();ctx.moveTo(60,cy);ctx.lineTo(c-60,cy);ctx.moveTo(cx,60);ctx.lineTo(cx,h-60);ctx.stroke();
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2,r1=276,r2=i%3===0?294:285;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();
  }
  const scan=scopePhase%(Math.PI*2);
  const grad=ctx.createRadialGradient(cx,cy,10,cx,cy,285);grad.addColorStop(0,'rgba(217,255,67,.20)');grad.addColorStop(1,'rgba(217,255,67,0)');
  ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,280,scan-.16,scan);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#d9ff43';ctx.lineWidth=3;ctx.beginPath();
  for(let x=80;x<=c-80;x+=3){
    const nx=(x-80)/(c-160),amp=42+scopeValue*88,envelope=.28+.72*Math.sin(nx*Math.PI);
    const y=cy+Math.sin(nx*18*Math.PI+scopePhase*4)*amp*envelope*(.45+.55*Math.sin(nx*3.5*Math.PI+scopePhase));
    if(x===80)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.fillStyle='#d9ff43';ctx.font='500 18px DM Mono';ctx.fillText(String(Math.round(scopeValue*100)).padStart(2,'0')+'%',cx-22,cy+10);
  requestAnimationFrame(drawScope);
}
drawScope();

/* -------------------------------------------------------
   CONTACT ORBIT TEXT
------------------------------------------------------- */
const orbitText=qs('#orbitText');
if(orbitText){
  const text=orbitText.textContent.trim();orbitText.textContent='';orbitText.classList.add('is-built');
  [...text].forEach((ch,i)=>{
    const s=document.createElement('span');s.textContent=ch===' '?'\u00A0':ch;
    s.style.setProperty('--a',`${(i/text.length)*360}deg`);orbitText.appendChild(s);
  });
}

/* -------------------------------------------------------
   MOBILE PROJECT CAPTIONS
------------------------------------------------------- */
projects.forEach((project,i)=>{
  const d=projectData[i];
  const c=document.createElement('div');c.className='project__mobilecopy';
  c.innerHTML=`<span>${String(i+1).padStart(2,'0')} / 05 · ${d.meta}</span><h3>${d.title.replace('<br/>',' ')}</h3><p>${d.desc}</p>`;
  project.appendChild(c);
});

/* -------------------------------------------------------
   MASTER SCROLL LOOP
------------------------------------------------------- */
let ticking=false;
function onScroll(){
  if(ticking)return;ticking=true;
  requestAnimationFrame(()=>{
    const doc=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const p=clamp(scrollY/doc);
    pageProgress.style.transform=`scaleX(${p})`;
    hudScroll.textContent=String(Math.round(p*100)).padStart(3,'0');
    hudRpm.textContent=String(Math.round(720+p*2160)).padStart(4,'0');
    nav.classList.toggle('is-scrolled',scrollY>30);
    updateStory();updateWork();

    if(work){
      const fadeStart=work.offsetTop-innerHeight*.6;
      const fade=clamp((scrollY-fadeStart)/(innerHeight*.6));
      worldEl.style.opacity=String(1-fade);
    }
    ticking=false;
  });
}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{
  resizeMechanicalCanvas();
  if(isMobile()) worldEl.style.transform='';
  onScroll();
});
onScroll();

window.addEventListener('load',()=>document.documentElement.classList.add('is-ready'));
