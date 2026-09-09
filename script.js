(() => {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     Theme
     ---------------------------------------------------------- */
  const themeToggle = qs("#themeToggle");

  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }

    try {
      localStorage.setItem("dn-theme", theme);
    } catch (_) {}

    window.dispatchEvent(new Event("dn-theme-change"));
  }

  themeToggle?.addEventListener("click", () => {
    applyTheme(currentTheme() === "light" ? "dark" : "light");
  });

  /* ----------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------- */
  const menuToggle = qs("#menuToggle");
  const navLinks = qs("#navLinks");

  function closeMenu() {
    menuToggle?.classList.remove("open");
    navLinks?.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = !navLinks?.classList.contains("open");
    menuToggle.classList.toggle("open", isOpen);
    navLinks?.classList.toggle("open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  qsa(".nav-link").forEach(link => link.addEventListener("click", closeMenu));

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) closeMenu();
  });

  /* ----------------------------------------------------------
     Navigation state + scroll progress
     ---------------------------------------------------------- */
  const nav = qs("#siteNav");
  const progress = qs("#scrollProgress");
  const navLinkMap = new Map(
    qsa(".nav-link").map(link => [link.getAttribute("href")?.slice(1), link])
  );
  const sections = qsa(".section-anchor");

  function updateScrollUI() {
    const y = window.scrollY;
    nav?.classList.toggle("scrolled", y > 18);

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, (y / maxScroll) * 100)}%`;

    const probe = y + window.innerHeight * 0.38;
    let current = "";

    for (const section of sections) {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (probe >= top && probe < bottom) {
        current = section.id;
        break;
      }
    }

    qsa(".nav-link").forEach(link => link.classList.remove("active"));
    navLinkMap.get(current)?.classList.add("active");
  }

  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });

  /* ----------------------------------------------------------
     Reveal animations
     ---------------------------------------------------------- */
  const revealItems = qsa(".reveal");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(el => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach(el => revealObserver.observe(el));
  }

  /* ----------------------------------------------------------
     Capability bars
     ---------------------------------------------------------- */
  const capabilityItems = qsa(".capability");

  capabilityItems.forEach(item => {
    const level = Number(item.dataset.level || 0);
    item.style.setProperty("--level", Math.max(0, Math.min(100, level)));
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    capabilityItems.forEach(item => item.classList.add("is-visible"));
  } else {
    const capabilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          capabilityObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    capabilityItems.forEach(item => capabilityObserver.observe(item));
  }

  /* ----------------------------------------------------------
     Count-up values
     ---------------------------------------------------------- */
  const counters = qsa("[data-count]");

  function animateCounter(el) {
    const target = Number(el.dataset.count || 0);
    if (!Number.isFinite(target)) return;

    if (reducedMotion) {
      el.textContent = String(target);
      return;
    }

    const duration = 1300;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window && !reducedMotion) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => countObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ----------------------------------------------------------
     Typing line
     ---------------------------------------------------------- */
  const typingText = qs("#typingText");
  const roles = [
    "energy systems",
    "mechanical design",
    "energy audits",
    "municipal energy planning",
    "carbon pricing research",
    "practical engineering"
  ];

  if (typingText && !reducedMotion) {
    let roleIndex = 0;
    let charIndex = roles[0].length;
    let deleting = true;

    const tick = () => {
      const word = roles[roleIndex];

      if (deleting) {
        charIndex -= 1;
        typingText.textContent = word.slice(0, Math.max(0, charIndex));

        if (charIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          setTimeout(tick, 280);
          return;
        }

        setTimeout(tick, 38);
      } else {
        const nextWord = roles[roleIndex];
        charIndex += 1;
        typingText.textContent = nextWord.slice(0, charIndex);

        if (charIndex >= nextWord.length) {
          deleting = true;
          setTimeout(tick, 1450);
          return;
        }

        setTimeout(tick, 62);
      }
    };

    setTimeout(tick, 1200);
  }

  /* ----------------------------------------------------------
     Profile image graceful fallback
     ---------------------------------------------------------- */
  const profileImage = qs("#profileImage");

  function markImageMissing() {
    profileImage?.classList.add("is-missing");
  }

  if (profileImage) {
    if (profileImage.complete && profileImage.naturalWidth === 0) {
      markImageMissing();
    }
    profileImage.addEventListener("error", markImageMissing);
  }

  /* ----------------------------------------------------------
     Hero mechanical plate pointer parallax
     ---------------------------------------------------------- */
  const heroMachine = qs("#heroMachine");
  const machinePlate = heroMachine?.querySelector(".machine-plate");

  if (heroMachine && machinePlate && !reducedMotion && matchMedia("(hover: hover)").matches) {
    heroMachine.addEventListener("pointermove", event => {
      const rect = heroMachine.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      machinePlate.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateZ(0)`;
    });

    heroMachine.addEventListener("pointerleave", () => {
      machinePlate.style.transform = "";
    });
  }

  /* ----------------------------------------------------------
     Project card tilt
     ---------------------------------------------------------- */
  if (!reducedMotion && matchMedia("(hover: hover)").matches) {
    qsa(".tilt-card").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.8).toFixed(2)}deg) translateY(-2px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------
     Magnetic buttons
     ---------------------------------------------------------- */
  if (!reducedMotion && matchMedia("(hover: hover)").matches) {
    qsa(".magnetic").forEach(button => {
      button.addEventListener("pointermove", event => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${(x * 0.06).toFixed(1)}px, ${(y * 0.08).toFixed(1)}px)`;
      });

      button.addEventListener("pointerleave", () => {
        button.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------
     Cursor crosshair for desktop
     ---------------------------------------------------------- */
  const cursor = qs("#cursorCrosshair");

  if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion) {
    let cursorX = 0;
    let cursorY = 0;
    let renderedX = 0;
    let renderedY = 0;
    let rafId = 0;

    const renderCursor = () => {
      renderedX += (cursorX - renderedX) * 0.22;
      renderedY += (cursorY - renderedY) * 0.22;
      cursor.style.transform = `translate(${renderedX - 14}px, ${renderedY - 14}px)`;
      rafId = requestAnimationFrame(renderCursor);
    };

    window.addEventListener("pointermove", event => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursor.classList.add("active");
      if (!rafId) rafId = requestAnimationFrame(renderCursor);
    });

    document.addEventListener("pointerover", event => {
      if (event.target.closest("a, button, input, textarea")) cursor.classList.add("hover");
    });

    document.addEventListener("pointerout", event => {
      if (event.target.closest("a, button, input, textarea")) cursor.classList.remove("hover");
    });

    document.addEventListener("mouseleave", () => cursor.classList.remove("active"));
  }

  /* ----------------------------------------------------------
     Mechanical canvas: moving drafting nodes + linkages
     ---------------------------------------------------------- */
  const canvas = qs("#mechanicalCanvas");
  const ctx = canvas?.getContext("2d");
  let canvasNodes = [];
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 1;
  let animationFrame = 0;

  function canvasPalette() {
    const styles = getComputedStyle(document.documentElement);
    return {
      line: styles.getPropertyValue("--line-strong").trim() || "rgba(255,255,255,.2)",
      cyan: styles.getPropertyValue("--cyan").trim() || "#4ed8d0",
      orange: styles.getPropertyValue("--orange").trim() || "#ff8d4d"
    };
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvasDpr = Math.min(2, window.devicePixelRatio || 1);
    canvasWidth = Math.max(1, rect.width);
    canvasHeight = Math.max(1, rect.height);

    canvas.width = Math.round(canvasWidth * canvasDpr);
    canvas.height = Math.round(canvasHeight * canvasDpr);
    ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);

    const count = Math.max(14, Math.min(34, Math.floor(canvasWidth / 46)));

    canvasNodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      r: i % 7 === 0 ? 2.2 : 1.1,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function drawCanvas(time = 0) {
    if (!canvas || !ctx) return;
    const palette = canvasPalette();

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const node of canvasNodes) {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < -10) node.x = canvasWidth + 10;
      if (node.x > canvasWidth + 10) node.x = -10;
      if (node.y < -10) node.y = canvasHeight + 10;
      if (node.y > canvasHeight + 10) node.y = -10;
    }

    ctx.lineWidth = 0.7;
    ctx.strokeStyle = palette.line;

    for (let i = 0; i < canvasNodes.length; i++) {
      for (let j = i + 1; j < canvasNodes.length; j++) {
        const a = canvasNodes[i];
        const b = canvasNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 145) {
          ctx.globalAlpha = (1 - distance / 145) * 0.22;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;

    canvasNodes.forEach((node, index) => {
      const pulse = 0.65 + Math.sin(time * 0.0012 + node.phase) * 0.25;
      ctx.fillStyle = index % 8 === 0 ? palette.orange : palette.cyan;
      ctx.globalAlpha = index % 8 === 0 ? 0.55 : 0.24 * pulse;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();

      if (index % 10 === 0) {
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = palette.cyan;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 9 + Math.sin(time * 0.001 + node.phase) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
    animationFrame = requestAnimationFrame(drawCanvas);
  }

  if (canvas && ctx) {
    resizeCanvas();

    if (reducedMotion) {
      drawCanvas(0);
      cancelAnimationFrame(animationFrame);
    } else {
      animationFrame = requestAnimationFrame(drawCanvas);
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("dn-theme-change", () => {
      if (reducedMotion) {
        drawCanvas(0);
        cancelAnimationFrame(animationFrame);
      }
    });
  }

  /* ----------------------------------------------------------
     Back to top + current year
     ---------------------------------------------------------- */
  qs("#backToTop")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });

  const year = qs("#currentYear");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------
     Contact form small quality-of-life enhancement
     ---------------------------------------------------------- */
  const contactForm = qs("#contactForm");
  contactForm?.addEventListener("submit", () => {
    const button = contactForm.querySelector('button[type="submit"]');
    if (!button) return;
    button.dataset.original = button.innerHTML;
    button.querySelector("span")?.replaceChildren(document.createTextNode("Transmitting..."));
    button.style.pointerEvents = "none";
    setTimeout(() => {
      button.style.pointerEvents = "";
      if (button.dataset.original) button.innerHTML = button.dataset.original;
    }, 5000);
  });
})();
