/* =============================================================
   Diggaj Niraula — personal site
   Vanilla JS, no dependencies, no build step.

   Contents
     1. helpers
     2. day / night ink
     3. the printing surface (background canvas)
     4. custom cursor
     5. the clock in Kathmandu
     6. dragging things around the desk
     7. brick breaker
     8. confetti
     9. the button you should not press
    10. odds and ends
   ============================================================= */

(() => {
  'use strict';

  /* --- 1. helpers ------------------------------------------------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rand  = (min, max) => min + Math.random() * (max - min);

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let inks = {};
  function readInks() {
    const s = getComputedStyle(document.documentElement);
    inks = {
      paper: s.getPropertyValue('--paper').trim(),
      ink:   s.getPropertyValue('--ink').trim(),
      soft:  s.getPropertyValue('--ink-soft').trim(),
      pink:  s.getPropertyValue('--pink').trim(),
      aqua:  s.getPropertyValue('--aqua').trim(),
      sun:   s.getPropertyValue('--sun').trim()
    };
  }
  readInks();

  function rgba(hex, alpha) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  /* --- 2. day / night ink ----------------------------------------- */
  const modeBtn = $('#modeToggle');
  const modeLabel = $('#modeLabel');

  function paintMode() {
    const night = document.documentElement.dataset.mode === 'night';
    if (modeLabel) modeLabel.textContent = night ? 'turn the lights on' : 'turn the lights off';
    if (modeBtn) modeBtn.setAttribute('aria-pressed', String(night));
    readInks();
  }
  paintMode();

  modeBtn?.addEventListener('click', () => {
    const night = document.documentElement.dataset.mode === 'night';
    document.documentElement.dataset.mode = night ? 'day' : 'night';
    paintMode();
    seedSurface();
  });

  /* --- 3. the printing surface ------------------------------------ */
  /* By day: three inks overprinting and drifting, the way a riso
     press misregisters. By night: the same sky Kathmandu gets.     */
  const bg = $('#bg');
  const bgc = bg?.getContext('2d');
  let sw = 0, sh = 0, blobs = [], stars = [], streak = null, nextStreak = 4000;

  function sizeSurface() {
    if (!bg || !bgc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    sw = window.innerWidth;
    sh = window.innerHeight;
    bg.width = Math.round(sw * dpr);
    bg.height = Math.round(sh * dpr);
    bgc.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedSurface();
  }

  function seedSurface() {
    if (!sw) return;
    const base = Math.max(sw, sh);
    blobs = [
      { hue: 'pink', r: base * 0.30, ax: sw * -0.02, ay: sh * 0.22, sx: 0.00021, sy: 0.00016, px: 0, py: 1.7 },
      { hue: 'aqua', r: base * 0.28, ax: sw * 1.02, ay: sh * 0.30, sx: 0.00017, sy: 0.00023, px: 2.1, py: 0.4 },
      { hue: 'sun',  r: base * 0.24, ax: sw * 0.62, ay: sh * 1.02, sx: 0.00025, sy: 0.00013, px: 4.2, py: 3.1 },
      { hue: 'aqua', r: base * 0.20, ax: sw * 0.10, ay: sh * 0.96, sx: 0.00014, sy: 0.00019, px: 1.2, py: 5.0 }
    ];
    const count = Math.round(clamp(sw * sh / 9000, 60, 220));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * sw,
      y: Math.random() * sh,
      r: Math.random() < 0.9 ? rand(0.5, 1.3) : rand(1.4, 2.1),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.0008, 0.0022)
    }));
  }

  function drawDay(t) {
    for (const b of blobs) {
      const x = b.ax + Math.sin(t * b.sx + b.px) * sw * 0.13;
      const y = b.ay + Math.cos(t * b.sy + b.py) * sh * 0.15;
      const r = b.r * (0.9 + Math.sin(t * 0.0002 + b.px) * 0.1);
      const grad = bgc.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, rgba(inks[b.hue], 0.15));
      grad.addColorStop(0.4, rgba(inks[b.hue], 0.06));
      grad.addColorStop(1, rgba(inks[b.hue], 0));
      bgc.fillStyle = grad;
      bgc.beginPath();
      bgc.arc(x, y, r, 0, Math.PI * 2);
      bgc.fill();
    }
  }

  function drawNight(t, dt) {
    /* two faint washes so the sky is not flat black */
    for (const b of blobs.slice(0, 2)) {
      const x = b.ax + Math.sin(t * b.sx + b.px) * sw * 0.1;
      const y = b.ay + Math.cos(t * b.sy + b.py) * sh * 0.1;
      const grad = bgc.createRadialGradient(x, y, 0, x, y, b.r);
      grad.addColorStop(0, rgba(inks[b.hue], 0.13));
      grad.addColorStop(1, rgba(inks[b.hue], 0));
      bgc.fillStyle = grad;
      bgc.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
    }

    for (const s of stars) {
      const twinkle = calm ? 0.7 : 0.35 + Math.abs(Math.sin(t * s.speed + s.phase)) * 0.65;
      bgc.fillStyle = rgba(inks.sun, twinkle * 0.9);
      bgc.beginPath();
      bgc.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgc.fill();
    }

    if (calm) return;

    nextStreak -= dt;
    if (!streak && nextStreak <= 0) {
      streak = { x: rand(sw * 0.15, sw * 0.9), y: rand(-40, sh * 0.4), life: 1 };
      nextStreak = rand(7000, 15000);
    }
    if (streak) {
      streak.x -= 9;
      streak.y += 4.5;
      streak.life -= 0.011;
      if (streak.life <= 0) { streak = null; }
      else {
        const grad = bgc.createLinearGradient(streak.x, streak.y, streak.x + 130, streak.y - 65);
        grad.addColorStop(0, rgba(inks.aqua, streak.life));
        grad.addColorStop(1, rgba(inks.aqua, 0));
        bgc.strokeStyle = grad;
        bgc.lineWidth = 1.6;
        bgc.beginPath();
        bgc.moveTo(streak.x, streak.y);
        bgc.lineTo(streak.x + 130, streak.y - 65);
        bgc.stroke();
      }
    }
  }

  let lastSurface = 0;
  function runSurface(now) {
    requestAnimationFrame(runSurface);
    if (!bgc) return;
    const dt = now - lastSurface;
    if (dt < 33) return;            /* the press runs at 30fps, not 120 */
    lastSurface = now;
    bgc.clearRect(0, 0, sw, sh);
    const t = calm ? 12000 : now;
    if (document.documentElement.dataset.mode === 'night') drawNight(t, dt);
    else drawDay(t);
  }

  if (bgc) {
    sizeSurface();
    window.addEventListener('resize', sizeSurface);
    requestAnimationFrame(runSurface);
  }

  /* --- 4. custom cursor ------------------------------------------- */
  const ring = $('#ring');
  const ringLabel = $('#ringLabel');
  const dot = $('#dot');

  if (fine && ring && dot) {
    document.body.classList.add('has-cursor');

    const words = {
      drag:  'drag me',
      press: 'press',
      open:  'open',
      spin:  'listen',
      home:  'to the top'
    };

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let rx = tx, ry = ty;

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px)`;
      ring.classList.add('is-on');
      dot.classList.add('is-on');

      const target = e.target instanceof Element
        ? e.target.closest('[data-cursor], a, button')
        : null;

      if (target) {
        const key = target.dataset ? target.dataset.cursor : null;
        ringLabel.textContent = words[key] || 'click';
        ring.classList.add('is-big');
      } else {
        ring.classList.remove('is-big');
      }
    });

    document.addEventListener('mouseleave', () => {
      ring.classList.remove('is-on');
      dot.classList.remove('is-on');
    });

    (function trail() {
      requestAnimationFrame(trail);
      rx += (tx - rx) * 0.16;      /* the ring lags behind, like wet ink */
      ry += (ty - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    })();
  }

  /* --- 5. the clock in Kathmandu ---------------------------------- */
  /* Nepal sits at UTC+05:45 and does not observe daylight saving,
     so a fixed offset is honest and needs no timezone database.    */
  const NPT_OFFSET = (5 * 60 + 45) * 60 * 1000;
  const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const doings = [
    [0,  'Asleep, and no use to anybody.'],
    [5,  'Awake against my better judgement. Tea first.'],
    [8,  'On the way to a site visit, or stuck in traffic thinking about one.'],
    [10, 'Elbow deep in a spreadsheet of somebody\u2019s energy demand.'],
    [13, 'Dal bhat. This is not negotiable.'],
    [15, 'Drawings, drafts, and a report that is late.'],
    [18, 'Reading something about carbon pricing and arguing with it.'],
    [21, 'Tinkering. Or losing at the game further down this page.']
  ];

  const clockTime = $('#clockTime');
  const clockDate = $('#clockDate');
  const clockStatus = $('#clockStatus');

  function tickClock() {
    const local = new Date();
    const utc = local.getTime() + local.getTimezoneOffset() * 60000;
    const npt = new Date(utc + NPT_OFFSET);

    const pad = (n) => String(n).padStart(2, '0');
    if (clockTime) {
      clockTime.textContent = `${pad(npt.getHours())}:${pad(npt.getMinutes())}:${pad(npt.getSeconds())}`;
    }
    if (clockDate) {
      clockDate.textContent = `${DAYS[npt.getDay()]}, ${npt.getDate()} ${MONTHS[npt.getMonth()]}`;
    }
    if (clockStatus) {
      const h = npt.getHours();
      let line = doings[0][1];
      for (const [from, text] of doings) if (h >= from) line = text;
      clockStatus.textContent = line;
    }
  }

  if (clockTime) {
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* --- 6. dragging things around the desk -------------------------- */
  const draggables = $$('[data-drag]');
  let topLayer = 5;

  function place(el) {
    const x = Number(el.dataset.x || 0);
    const y = Number(el.dataset.y || 0);
    el.style.transform = `translate(${x}px, ${y}px) rotate(${el.dataset.rot || 0}deg)`;
  }

  draggables.forEach((el) => {
    el.dataset.x = '0';
    el.dataset.y = '0';
    place(el);

    let startX = 0, startY = 0, baseX = 0, baseY = 0;
    let homeLeft = 0, homeTop = 0, w = 0, h = 0;
    let live = false;

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      live = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
      el.style.transition = 'none';
      el.style.zIndex = String(++topLayer);

      startX = e.clientX;
      startY = e.clientY;
      baseX = Number(el.dataset.x || 0);
      baseY = Number(el.dataset.y || 0);

      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      homeLeft = r.left - baseX;      /* where it would sit untranslated */
      homeTop = r.top - baseY;
      e.preventDefault();
    });

    el.addEventListener('pointermove', (e) => {
      if (!live) return;
      let nx = baseX + (e.clientX - startX);
      let ny = baseY + (e.clientY - startY);

      /* never let a thing be dragged entirely off the edge */
      nx = clamp(nx, -homeLeft - w * 0.55, window.innerWidth - homeLeft - w * 0.45);
      ny = clamp(ny, -homeTop - h * 0.55, window.innerHeight - homeTop - h * 0.45);

      el.dataset.x = String(nx);
      el.dataset.y = String(ny);
      place(el);
    });

    const drop = (e) => {
      if (!live) return;
      live = false;
      el.classList.remove('is-dragging');
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
  });

  $('#tidyBtn')?.addEventListener('click', () => {
    draggables.forEach((el, i) => {
      el.style.transition = `transform .5s ${i * 60}ms cubic-bezier(.22,.68,.28,1)`;
      el.dataset.x = '0';
      el.dataset.y = '0';
      el.style.zIndex = '';
      place(el);
    });
  });

  /* --- 7. brick breaker -------------------------------------------- */
  const cv = $('#game');

  if (cv && cv.getContext) {
    const g = cv.getContext('2d');
    const W = 640, H = 420;

    const COLS = 9, ROWS = 5;
    const PAD = 6, LEFT = 26, TOP = 52;
    const BW = (W - LEFT * 2 - PAD * (COLS - 1)) / COLS;
    const BH = 20;

    const el = {
      score: $('#gScore'),
      level: $('#gLevel'),
      best:  $('#gBest'),
      lives: $('#gLives'),
      start: $('#gStart'),
      pause: $('#gPause'),
      reset: $('#gReset')
    };

    const paddle = { x: W / 2 - 46, y: H - 30, w: 92, h: 11, speed: 8 };
    const ball = { x: W / 2, y: H - 46, r: 7, vx: 0, vy: 0 };

    let bricks = [];
    let state = 'idle';        /* idle | ready | running | paused | over | done */
    let score = 0, best = 0, lives = 3, level = 1, speed = 5;
    const keys = { left: false, right: false };
    let visible = true;

    function fit() {
      const rect = cv.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(rect.width * dpr);
      cv.height = Math.round(rect.width * (H / W) * dpr);
      const s = cv.width / W;
      g.setTransform(s, 0, 0, s, 0, 0);
    }

    function build() {
      bricks = [];
      const rows = Math.min(ROWS + Math.floor((level - 1) / 2), 7);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < COLS; c++) {
          bricks.push({
            x: LEFT + c * (BW + PAD),
            y: TOP + r * (BH + PAD),
            row: r,
            alive: true
          });
        }
      }
    }

    function rowInk(row) {
      return [inks.pink, inks.pink, inks.aqua, inks.aqua, inks.sun, inks.pink, inks.aqua][row % 7];
    }

    function rowPoints(row) { return (5 - Math.min(row, 4)) * 10; }

    function park() {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 1;
      ball.vx = 0;
      ball.vy = 0;
    }

    function launch() {
      const angle = rand(-0.5, 0.5) - Math.PI / 2;
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      state = 'running';
    }

    function hud() {
      if (el.score) el.score.textContent = String(score);
      if (el.level) el.level.textContent = String(level);
      if (el.best)  el.best.textContent = String(best);
      if (el.lives) {
        el.lives.innerHTML = '';
        for (let i = 0; i < 3; i++) {
          const pip = document.createElement('i');
          if (i >= lives) pip.className = 'is-spent';
          el.lives.appendChild(pip);
        }
      }
    }

    function newGame() {
      score = 0;
      lives = 3;
      level = 1;
      speed = 5;
      build();
      park();
      state = 'ready';
      hud();
      if (el.start) el.start.textContent = 'Start';
    }

    function loseLife() {
      lives -= 1;
      hud();
      if (lives <= 0) {
        state = 'over';
        best = Math.max(best, score);
        hud();
        if (el.start) el.start.textContent = 'Play again';
      } else {
        park();
        state = 'ready';
      }
    }

    function clearedLevel() {
      level += 1;
      speed = Math.min(speed + 0.55, 9.5);
      build();
      park();
      state = 'ready';
      best = Math.max(best, score);
      hud();
      const r = cv.getBoundingClientRect();
      burst(60, r.left + r.width / 2, r.top + r.height / 2);
    }

    function step() {
      if (keys.left)  paddle.x -= paddle.speed;
      if (keys.right) paddle.x += paddle.speed;
      paddle.x = clamp(paddle.x, 0, W - paddle.w);

      if (state === 'ready') { park(); return; }
      if (state !== 'running') return;

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r < 0)      { ball.x = ball.r; ball.vx *= -1; }
      if (ball.x + ball.r > W)      { ball.x = W - ball.r; ball.vx *= -1; }
      if (ball.y - ball.r < 0)      { ball.y = ball.r; ball.vy *= -1; }

      if (ball.y - ball.r > H) { loseLife(); return; }

      /* paddle */
      if (ball.vy > 0 &&
          ball.y + ball.r >= paddle.y &&
          ball.y - ball.r <= paddle.y + paddle.h &&
          ball.x >= paddle.x - ball.r &&
          ball.x <= paddle.x + paddle.w + ball.r) {
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        const angle = clamp(hit, -1, 1) * (Math.PI / 3);
        const v = Math.max(speed, Math.hypot(ball.vx, ball.vy));
        ball.vx = Math.sin(angle) * v;
        ball.vy = -Math.abs(Math.cos(angle) * v);
        ball.y = paddle.y - ball.r - 0.5;
      }

      /* bricks */
      for (const b of bricks) {
        if (!b.alive) continue;
        const nx = clamp(ball.x, b.x, b.x + BW);
        const ny = clamp(ball.y, b.y, b.y + BH);
        const dx = ball.x - nx, dy = ball.y - ny;
        if (dx * dx + dy * dy > ball.r * ball.r) continue;

        const overX = (BW / 2 + ball.r) - Math.abs(ball.x - (b.x + BW / 2));
        const overY = (BH / 2 + ball.r) - Math.abs(ball.y - (b.y + BH / 2));
        if (overX < overY) ball.vx *= -1; else ball.vy *= -1;

        b.alive = false;
        score += rowPoints(b.row);
        best = Math.max(best, score);
        hud();
        break;
      }

      if (!bricks.some((b) => b.alive)) clearedLevel();
    }

    function centreText(lines) {
      g.save();
      g.fillStyle = rgba(inks.paper, 0.88);
      g.fillRect(0, H / 2 - 62, W, 124);
      g.strokeStyle = inks.ink;
      g.lineWidth = 1;
      g.strokeRect(0.5, H / 2 - 61.5, W - 1, 123);
      g.textAlign = 'center';
      g.fillStyle = inks.ink;
      g.font = '700 26px "Bricolage Grotesque", Helvetica, sans-serif';
      g.fillText(lines[0], W / 2, H / 2 - 8);
      if (lines[1]) {
        g.fillStyle = inks.soft;
        g.font = '400 14px "IBM Plex Mono", monospace';
        g.fillText(lines[1], W / 2, H / 2 + 22);
      }
      g.restore();
    }

    function draw() {
      g.clearRect(0, 0, W, H);

      for (const b of bricks) {
        if (!b.alive) continue;
        g.fillStyle = rgba(rowInk(b.row), 0.85);
        g.fillRect(b.x, b.y, BW, BH);
        g.strokeStyle = inks.ink;
        g.lineWidth = 1.4;
        g.strokeRect(b.x + 0.7, b.y + 0.7, BW - 1.4, BH - 1.4);
      }

      g.fillStyle = inks.ink;
      g.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

      g.beginPath();
      g.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      g.fillStyle = inks.pink;
      g.fill();
      g.lineWidth = 1.4;
      g.strokeStyle = inks.ink;
      g.stroke();

      if (state === 'idle')    centreText(['brick breaker', 'press start, or hit the space bar']);
      if (state === 'ready')   centreText([`level ${level}`, 'space bar to launch']);
      if (state === 'paused')  centreText(['paused', 'space bar to carry on']);
      if (state === 'over')    centreText(['all out of lives', `you scored ${score}`]);
    }

    function loop() {
      requestAnimationFrame(loop);
      if (visible) { step(); draw(); }
    }

    /* input */
    cv.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      const x = ((e.clientX - r.left) / r.width) * W;
      paddle.x = clamp(x - paddle.w / 2, 0, W - paddle.w);
    });

    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cv.focus();
      if (state === 'idle' || state === 'ready') launch();
      else if (state === 'over') { newGame(); launch(); }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;

      const onControl = document.activeElement &&
        document.activeElement.matches('button, a, input, textarea, select');

      if (e.key === ' ' && visible && !onControl) {
        e.preventDefault();
        if (state === 'idle' || state === 'ready') launch();
        else if (state === 'running') state = 'paused';
        else if (state === 'paused') state = 'running';
        else if (state === 'over') { newGame(); launch(); }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    });

    el.start?.addEventListener('click', () => {
      if (state === 'over' || state === 'idle') { newGame(); launch(); }
      else if (state === 'ready') launch();
      else if (state === 'paused') state = 'running';
    });
    el.pause?.addEventListener('click', () => {
      if (state === 'running') state = 'paused';
      else if (state === 'paused') state = 'running';
    });
    el.reset?.addEventListener('click', () => { newGame(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.12 }).observe(cv);
    }

    window.addEventListener('resize', fit);
    fit();
    newGame();
    state = 'idle';
    loop();
  }

  /* --- 8. confetti -------------------------------------------------- */
  const fx = $('#fx');
  const fxc = fx?.getContext('2d');
  let bits = [];

  function sizeFx() {
    if (!fx || !fxc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    fx.width = Math.round(window.innerWidth * dpr);
    fx.height = Math.round(window.innerHeight * dpr);
    fxc.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst(count, x, y) {
    if (!fxc || calm) return;
    const palette = [inks.pink, inks.aqua, inks.sun, inks.ink];
    for (let i = 0; i < count; i++) {
      bits.push({
        x, y,
        vx: rand(-9, 9),
        vy: rand(-15, -4),
        w: rand(5, 12),
        h: rand(3, 7),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.3, 0.3),
        color: palette[i % palette.length],
        life: 1
      });
    }
  }

  function runFx() {
    requestAnimationFrame(runFx);
    if (!fxc) return;
    fxc.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (!bits.length) return;

    bits = bits.filter((p) => p.life > 0 && p.y < window.innerHeight + 60);
    for (const p of bits) {
      p.vy += 0.32;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.004;

      fxc.save();
      fxc.translate(p.x, p.y);
      fxc.rotate(p.rot);
      fxc.fillStyle = rgba(p.color, clamp(p.life, 0, 1));
      fxc.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      fxc.restore();
    }
  }

  if (fxc) {
    sizeFx();
    window.addEventListener('resize', sizeFx);
    requestAnimationFrame(runFx);
  }

  /* --- 9. the button you should not press --------------------------- */
  /* Knocks every visible piece of text out of the layout and lets it
     fall. Nothing is destroyed: the undo puts each one back.          */
  const eggBtn = $('#eggBtn');
  const eggUndo = $('#eggUndo');
  let loose = [];
  let restingScroll = 0;
  let fallFrame = 0;

  function knockOver() {
    if (loose.length) return;

    /* Anything with a transformed or backdrop-filtered ancestor is left
       standing: a fixed element inside one anchors to that ancestor
       rather than to the viewport, and would fly off somewhere silly.
       That rules out the sticky bar and the draggable notes.          */
    const picks = $$([
      'main h1', 'main h2', 'main h3',
      '.place', '.lede', '.spread__note',
      '.bed__body p', '.bed__stagelabel',
      '.log__where', '.log__what p',
      '.shelf__col p',
      '.letters__lede', '.letters__ps', '.addresses__val',
      '.foot p'
    ].join(', '))
      .filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
      })
      .filter((node, _, all) => !all.some((other) => other !== node && other.contains(node)));

    if (!picks.length) return;

    restingScroll = window.scrollY;

    for (const node of picks) {
      const r = node.getBoundingClientRect();
      node.dataset.eggStyle = node.getAttribute('style') || '';
      node.classList.add('is-loose');
      node.style.left = '0px';
      node.style.top = '0px';
      node.style.width = `${r.width}px`;
      node.style.height = `${r.height}px`;

      loose.push({
        node,
        x: r.left, y: r.top,
        w: r.width, h: r.height,
        vx: rand(-4, 4),
        vy: rand(-7, -1),
        rot: 0,
        vr: rand(-0.075, 0.075),
        asleep: false
      });
    }

    document.body.classList.add('is-frozen');
    if (eggBtn) eggBtn.hidden = true;
    if (eggUndo) eggUndo.hidden = false;
    fall();
  }

  function fall() {
    fallFrame = requestAnimationFrame(fall);
    const floor = window.innerHeight;
    let moving = false;

    for (const p of loose) {
      if (p.asleep) {
        p.node.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}rad)`;
        continue;
      }
      moving = true;

      p.vy += 0.78;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      /* the element spins about its own centre, so the half-height that
         actually meets the floor grows as it tips over */
      const sin = Math.abs(Math.sin(p.rot));
      const cos = Math.abs(Math.cos(p.rot));
      const halfDown = (p.w * sin + p.h * cos) / 2;
      const halfSide = (p.w * cos + p.h * sin) / 2;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;

      if (cx - halfSide < 0) { p.x += -(cx - halfSide); p.vx *= -0.5; }
      if (cx + halfSide > window.innerWidth) {
        p.x -= (cx + halfSide) - window.innerWidth;
        p.vx *= -0.5;
      }

      if (cy + halfDown > floor) {
        p.y = floor - halfDown - p.h / 2;
        p.vy *= -0.38;
        p.vx *= 0.7;
        p.vr *= 0.32;
        if (Math.abs(p.vy) < 1.2 && Math.abs(p.vx) < 0.35) {
          p.asleep = true;
          p.vy = 0;
          p.vx = 0;
          p.vr = 0;
        }
      }

      p.node.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}rad)`;
    }

    if (!moving) cancelAnimationFrame(fallFrame);
  }

  function standBackUp() {
    cancelAnimationFrame(fallFrame);
    for (const p of loose) {
      p.node.classList.remove('is-loose');
      const old = p.node.dataset.eggStyle;
      if (old) p.node.setAttribute('style', old);
      else p.node.removeAttribute('style');
      delete p.node.dataset.eggStyle;
    }
    loose = [];
    document.body.classList.remove('is-frozen');
    window.scrollTo(0, restingScroll);
    if (eggBtn) eggBtn.hidden = false;
    if (eggUndo) eggUndo.hidden = true;
    burst(70, window.innerWidth / 2, window.innerHeight * 0.62);
  }

  eggBtn?.addEventListener('click', knockOver);
  eggUndo?.addEventListener('click', standBackUp);

  /* --- 10. odds and ends -------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* for anyone who still remembers the code */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let typed = [];
  window.addEventListener('keydown', (e) => {
    typed.push(e.key);
    if (typed.length > KONAMI.length) typed.shift();
    if (typed.length === KONAMI.length && typed.every((k, i) => k === KONAMI[i])) {
      typed = [];
      burst(140, window.innerWidth / 2, window.innerHeight * 0.35);
    }
  });

})();
