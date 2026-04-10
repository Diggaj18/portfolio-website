/* =========================================
   DIGGAJ NIRAULA — PORTFOLIO JS
   "Full Energy Mode"
   ========================================= */
(function () {
  'use strict';

  const html = document.documentElement;

  // ==========================
  // PARTICLE CANVAS (Hero)
  // ==========================
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animFrame;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  function createParticles() {
    particles = [];
    const count = Math.min(80, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 12000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        color: Math.random() > 0.6 ? 'teal' : Math.random() > 0.5 ? 'electric' : 'white'
      });
    }
  }

  function getColor(type, alpha) {
    const isLight = html.classList.contains('light');
    if (type === 'teal') return isLight ? `rgba(0,196,168,${alpha})` : `rgba(0,245,212,${alpha})`;
    if (type === 'electric') return isLight ? `rgba(98,70,234,${alpha})` : `rgba(123,97,255,${alpha})`;
    return isLight ? `rgba(0,0,0,${alpha * 0.3})` : `rgba(255,255,255,${alpha * 0.4})`;
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150 * 0.8;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < -10) p.x = canvas.offsetWidth + 10;
      if (p.x > canvas.offsetWidth + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.offsetHeight + 10;
      if (p.y > canvas.offsetHeight + 10) p.y = -10;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = getColor(p.color, 0.6);
      ctx.fill();

      // Draw connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const d = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = getColor(p.color, (1 - d / 120) * 0.15);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animFrame = requestAnimationFrame(drawParticles);
  }

  function initCanvas() {
    resizeCanvas();
    createParticles();
    drawParticles();
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Pause when not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animFrame);
    } else {
      drawParticles();
    }
  });

  initCanvas();

  // ==========================
  // CURSOR GLOW FOLLOWER
  // ==========================
  const cursorGlow = document.getElementById('cursorGlow');
  let glowX = 0, glowY = 0, currentGlowX = 0, currentGlowY = 0;

  document.addEventListener('mousemove', (e) => {
    glowX = e.clientX;
    glowY = e.clientY;
    if (!cursorGlow.classList.contains('active')) {
      cursorGlow.classList.add('active');
    }
  });

  function updateGlow() {
    currentGlowX += (glowX - currentGlowX) * 0.08;
    currentGlowY += (glowY - currentGlowY) * 0.08;
    cursorGlow.style.left = currentGlowX + 'px';
    cursorGlow.style.top = currentGlowY + 'px';
    requestAnimationFrame(updateGlow);
  }
  updateGlow();

  // ==========================
  // THEME TOGGLE
  // ==========================
  const themeBtn = document.getElementById('themeToggle');
  themeBtn.addEventListener('click', () => {
    const isLight = html.classList.toggle('light');
    localStorage.setItem('dn-theme', isLight ? 'light' : 'dark');
  });

  // ==========================
  // NAV SCROLL EFFECT
  // ==========================
  const nav = document.getElementById('nav');

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ==========================
  // MOBILE HAMBURGER
  // ==========================
  const burger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  navLinks.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  // ==========================
  // SMOOTH SCROLL
  // ==========================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(html).getPropertyValue('--nav-h'));
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: 'smooth'
      });
    });
  });

  // ==========================
  // SCROLL SPY
  // ==========================
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav__link');

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinkEls.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => spyObserver.observe(s));

  // ==========================
  // REVEAL ANIMATIONS
  // ==========================
  const reveals = document.querySelectorAll('.reveal-up, .bento__card--skill');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Set skill bar width from data attribute
        if (entry.target.classList.contains('bento__card--skill')) {
          const level = entry.target.getAttribute('data-level');
          if (level) entry.target.style.setProperty('--level', level);
        }

        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  // ==========================
  // COUNTER ANIMATION (Stats)
  // ==========================
  const counters = document.querySelectorAll('[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        let current = 0;
        const duration = 1500;
        const start = performance.now();

        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4); // ease out quart
          current = Math.round(eased * target);
          el.textContent = current;
          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));

  // ==========================
  // TYPING ANIMATION
  // ==========================
  const typingEl = document.getElementById('typingText');
  const titles = [
    'Mechanical Engineer',
    'Renewable Energy Researcher',
    'CAD Design Specialist',
    'Data Analyst',
    'Problem Solver'
  ];

  let titleIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let typeTimer;

  function typeStep() {
    const current = titles[titleIdx];

    if (!deleting) {
      charIdx++;
      typingEl.textContent = current.substring(0, charIdx);
      if (charIdx === current.length) {
        typeTimer = setTimeout(() => { deleting = true; typeStep(); }, 2400);
        return;
      }
      typeTimer = setTimeout(typeStep, 55 + Math.random() * 35);
    } else {
      charIdx--;
      typingEl.textContent = current.substring(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        titleIdx = (titleIdx + 1) % titles.length;
        typeTimer = setTimeout(typeStep, 500);
        return;
      }
      typeTimer = setTimeout(typeStep, 25);
    }
  }

  setTimeout(typeStep, 1800);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(typeTimer);
    } else {
      typeTimer = setTimeout(typeStep, 300);
    }
  });

  // ==========================
  // BACK TO TOP
  // ==========================
  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ==========================
  // TILT EFFECT ON CARDS
  // ==========================
  document.querySelectorAll('.proj, .edu-card, .bento__card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px) scale(1.01)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ==========================
  // HERO PHOTO: auto-swap avatar when real image loads
  // ==========================
  const heroImg = document.getElementById('heroImg');
  const heroAvatar = document.getElementById('heroAvatar');
  if (heroImg) {
    const testImg = new Image();
    testImg.onload = function () {
      heroImg.style.display = 'block';
      heroImg.classList.add('loaded');
      if (heroAvatar) heroAvatar.style.display = 'none';
    };
    testImg.src = heroImg.src;
  }

  // ==========================
  // HERO PHOTO PARALLAX TILT
  // ==========================
  const photoWrap = document.querySelector('.hero__photo-wrap');
  if (photoWrap) {
    const hero = document.getElementById('home');

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Photo follows mouse with soft parallax
      photoWrap.style.transform = `translate(${x * 24}px, ${y * 24}px)`;

      // Inner photo gets a subtle 3D tilt
      const photo = photoWrap.querySelector('.hero__photo');
      if (photo) {
        photo.style.transform = `translate(-50%, -50%) perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
      }
    });

    hero.addEventListener('mouseleave', () => {
      photoWrap.style.transform = '';
      const photo = photoWrap.querySelector('.hero__photo');
      if (photo) photo.style.transform = 'translate(-50%, -50%)';
    });
  }

  // ==========================
  // HERO PARALLAX ON SCROLL
  // ==========================
  const heroContent = document.querySelector('.hero__text');
  const heroPhoto = document.querySelector('.hero__photo-wrap');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = window.innerHeight;
    if (scrollY > heroH) return;

    const ratio = scrollY / heroH;
    if (heroContent) heroContent.style.transform = `translateY(${ratio * 60}px)`;
    if (heroPhoto) heroPhoto.style.opacity = 1 - ratio * 1.2;
  }, { passive: true });

  // ==========================
  // MAGNETIC BUTTONS
  // ==========================
  document.querySelectorAll('.btn--glow, .btn--outline').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-3px) scale(1.02)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

})();
