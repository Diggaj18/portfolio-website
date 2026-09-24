/* JAVASCRIPT — Progressive enhancement. All content works without JavaScript. */
'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window) {
  if (!reducedMotion.matches) document.documentElement.classList.add('motion-ready');
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); reveals.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => reveals.observe(element));
  const sections = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navigation.querySelectorAll('a').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach(section => sections.observe(section));
}
const progress = document.querySelector('.progress');
const portrait = document.querySelector('.hero-photo img');
const hero = document.querySelector('.hero');
let scheduled = false;
function paintScroll() {
  scheduled = false;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  if (!reducedMotion.matches && y < hero.offsetHeight) {
    const amount = Math.min(1, y / Math.max(1, window.innerHeight * .75));
    portrait.style.transform = `scale(${1.05 + amount * .16}) translateY(${amount * -1.5}%)`;
  } else if (reducedMotion.matches) portrait.style.transform = 'none';
}
function schedulePaint() { if (!scheduled) { scheduled = true; requestAnimationFrame(paintScroll); } }
window.addEventListener('scroll', schedulePaint, { passive: true });
window.addEventListener('resize', schedulePaint);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) document.documentElement.classList.remove('motion-ready');
  schedulePaint();
});
paintScroll();
