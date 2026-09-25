* =========================================================
   Diggaj Niraula — portfolio
   1. helpers            5. terrain scene (three.js)
   2. image placeholders 6. plate tilt
   3. clock + year       7. boot
   4. scroll orchestration
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 1. HELPERS ---------- */

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COARSE  = window.matchMedia('(pointer: coarse)').matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function smoothstep(e0, e1, x) {
    var t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function hexToRgb(h) {
    h = h.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16)
    ];
  }

  function mixHex(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return 'rgb(' +
      Math.round(lerp(A[0], B[0], t)) + ',' +
      Math.round(lerp(A[1], B[1], t)) + ',' +
      Math.round(lerp(A[2], B[2], t)) + ')';
  }

  var PAL = {
    haze:    '#d9dedb',
    ink:     '#12171a',
    night:   '#080c10',
    paper:   '#eceeeb',
    copper:  '#c2662f',
    glacier: '#4a9aa8',
    mutedDay:   '#5d6764',
    mutedNight: '#8e9894'
  };

  /* value noise + fbm, used to build the ridge */

  function hash2(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf);
    var v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi),     b = hash2(xi + 1, yi);
    var c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }

  function fbm(x, y) {
    var s = 0, amp = 0.5, f = 1;
    for (var i = 0; i < 5; i++) {
      s += amp * vnoise(x * f, y * f);
      f *= 2.03;
      amp *= 0.5;
    }
    return s;
  }

  /* world height field. x across, z into the screen (negative = far) */
  function heightAt(x, z) {
    var nx = x * 0.055, nz = z * 0.055;
    var n = fbm(nx + 13.2, nz + 7.1);
    var ridged = 1 - Math.abs(n * 2 - 1);
    ridged = Math.pow(ridged, 1.85);

    var far = smoothstep(14, -30, z);         // 0 near the camera, 1 at the back
    var h = ridged * (0.8 + far * 17.5);

    // a meltwater channel wandering down the middle
    var wander = (fbm(nz * 1.7, 3.1) - 0.5) * 16;
    var river = Math.exp(-Math.pow((x - wander) / 5.5, 2));
    h *= 1 - river * 0.78 * (1 - far * 0.4);

    h += fbm(nx * 3.6, nz * 3.6) * 0.38;
    return h;
  }

  /* ---------- 2. IMAGE PLACEHOLDERS ---------- */

  function placeholderURI(label, w, h) {
    w = w || 1200; h = h || 800;
    var big = Math.max(13, Math.round(w / 32));
    var small = Math.max(11, Math.round(w / 46));
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#0f1518"/><stop offset="1" stop-color="#1c262b"/>' +
      '</linearGradient>' +
      '<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse">' +
      '<path d="M-7 7 L7 -7 M0 28 L28 0 M21 35 L35 21" stroke="#4a9aa8" stroke-opacity="0.16" stroke-width="1.3"/>' +
      '</pattern>' +
      '</defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#p)"/>' +
      '<circle cx="' + (w / 2) + '" cy="' + (h / 2 - big * 1.9) + '" r="' + (big * 0.34) + '" fill="#c2662f"/>' +
      '<text x="' + (w / 2) + '" y="' + (h / 2) + '" fill="#d9dedb" text-anchor="middle" ' +
      'font-family="ui-monospace,Menlo,Consolas,monospace" font-size="' + big + '">' + label + '</text>' +
      '<text x="' + (w / 2) + '" y="' + (h / 2 + big * 1.8) + '" fill="#8e9894" text-anchor="middle" ' +
      'font-family="ui-monospace,Menlo,Consolas,monospace" font-size="' + small + '">place this file in /assets</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function swapIn(img) {
    if (img.hasAttribute('data-missing')) return;
    var label = img.getAttribute('data-ph') || 'image';
    img.setAttribute('data-missing', '');
    img.src = placeholderURI(label, img.width || 1200, img.height || 800);
  }

  function wirePlaceholders() {
    // error does not bubble, so listen in the capture phase
    document.addEventListener('error', function (e) {
      var el = e.target;
      if (el && el.tagName === 'IMG' && el.hasAttribute('data-ph')) swapIn(el);
    }, true);

    // catch anything that already failed before this script ran
    var imgs = document.querySelectorAll('img[data-ph]');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete && imgs[i].naturalWidth === 0) swapIn(imgs[i]);
    }
  }

  /* ---------- 3. CLOCK + YEAR ---------- */

  function startClock() {
    var el = document.getElementById('hudClock');
    if (!el) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kathmandu', hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch (err) { return; }

    function tick() { el.textContent = fmt.format(new Date()); }
    tick();
    setInterval(tick, 1000);
  }

  function setYear() {
    var y = document.getElementById('footYear');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- 4. SCROLL ORCHESTRATION ---------- */

  var scroll = {
    page: 0,   // 0..1 down the whole document
    night: 0   // 0 = day, 1 = night. driven by the hinge section
  };

  var root = document.documentElement;
  var hinge = document.getElementById('hinge');
  var canvas = document.getElementById('terrain');
  var altNum = document.getElementById('altNum');
  var altBar = document.getElementById('altBar');
  var hudScan = document.getElementById('hudScan');
  var altRail = document.querySelector('.altitude');

  function readScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    scroll.page = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

    if (hinge) {
      var r = hinge.getBoundingClientRect();
      var vh = window.innerHeight;
      var raw = (vh - r.top) / (r.height + vh);
      scroll.night = smoothstep(0.46, 0.60, clamp(raw, 0, 1));
    } else {
      scroll.night = smoothstep(0.22, 0.42, scroll.page);
    }
  }

  function paint() {
    var t = scroll.night;

    root.style.setProperty('--bg', mixHex(PAL.haze, PAL.night, t));
    root.style.setProperty('--fg', mixHex(PAL.ink, PAL.paper, t));
    root.style.setProperty('--muted', mixHex(PAL.mutedDay, PAL.mutedNight, t));
    root.style.setProperty('--hinge', mixHex('#8f4418', '#e5813d', t));

    var lr = lerp(18, 236, t), lg = lerp(23, 238, t), lb = lerp(26, 235, t);
    root.style.setProperty('--line',
      'rgba(' + Math.round(lr) + ',' + Math.round(lg) + ',' + Math.round(lb) + ',' + lerp(0.16, 0.15, t).toFixed(3) + ')');

    // the ridge stays present but steps back behind the reading sections
    if (canvas) {
      var op = 1 - 0.74 * smoothstep(0.02, 0.20, scroll.page);
      op += 0.42 * (1 - Math.abs(scroll.night * 2 - 1));   // swell through the crossover
      op += 0.38 * smoothstep(0.76, 0.98, scroll.page);
      canvas.style.filter = 'opacity(' + clamp(op, 0.15, 1).toFixed(3) + ')';
    }

    if (altRail) altRail.style.opacity = (1 - smoothstep(0.93, 0.995, scroll.page)).toFixed(3);
    if (altNum) altNum.textContent = String(Math.round(lerp(8848, 1400, scroll.page)));
    if (altBar) altBar.style.height = (scroll.page * 100).toFixed(1) + '%';
    if (hudScan) {
      var pct = Math.round(scroll.page * 100);
      hudScan.textContent = (pct < 10 ? '00' : pct < 100 ? '0' : '') + pct + '%';
    }
  }

  /* ---------- 5. TERRAIN SCENE ---------- */

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  var POINT_VS = [
    'uniform float uTime;',
    'uniform float uSize;',
    'attribute float aRand;',
    'varying float vH;',
    'varying float vRand;',
    'varying float vFog;',
    'void main(){',
    '  vec3 p = position;',
    '  p.y += sin(uTime * 0.32 + p.x * 0.22 + p.z * 0.17) * 0.05;',
    '  vH = position.y;',
    '  vRand = aRand;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  vFog = smoothstep(112.0, 16.0, -mv.z) * smoothstep(4.0, 24.0, -mv.z);',
    '  gl_PointSize = clamp(uSize * (0.72 + aRand * 0.9) * (34.0 / max(-mv.z, 0.1)), 1.05, 12.0);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var POINT_FS = [
    'uniform vec3 uLow;',
    'uniform vec3 uHigh;',
    'uniform vec3 uSignal;',
    'uniform float uNight;',
    'uniform float uTime;',
    'varying float vH;',
    'varying float vRand;',
    'varying float vFog;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d = dot(c, c);',
    '  if (d > 0.25) discard;',
    '  float soft = smoothstep(0.25, 0.015, d);',
    '  float h = clamp(vH / 15.0, 0.0, 1.0);',
    '  vec3 col = mix(uLow, uHigh, smoothstep(0.08, 0.92, h));',
    '  float spark = step(0.9865, fract(vRand * 47.0 + uTime * 0.055));',
    '  col = mix(col, uSignal, spark * uNight);',
    '  float a = soft * vFog * (0.40 + 0.62 * h + spark * 0.9);',
    '  a *= mix(0.88, 0.96, uNight);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  var LINE_VS = [
    'attribute float aT;',
    'varying float vT;',
    'varying float vFog;',
    'void main(){',
    '  vT = aT;',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  vFog = smoothstep(115.0, 14.0, -mv.z) * smoothstep(4.0, 22.0, -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var LINE_FS = [
    'uniform float uTime;',
    'uniform float uNight;',
    'uniform float uOffset;',
    'uniform vec3 uColor;',
    'varying float vT;',
    'varying float vFog;',
    'void main(){',
    '  float head = fract(uTime * 0.075 + uOffset);',
    '  float d = vT - head;',
    '  d = d - floor(d + 0.5);',
    '  float pulse = exp(-abs(d) * 30.0);',
    '  float a = (0.05 + pulse * 1.15) * uNight * vFog;',
    '  gl_FragColor = vec4(uColor, a);',
    '}'
  ].join('\n');

  function buildScene() {
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance'
    });
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 220);
    var PORTRAIT = window.innerHeight > window.innerWidth;

    var group = new THREE.Group();
    scene.add(group);

    /* ---- point cloud ---- */
    var small = window.innerWidth < 760;
    var COLS = small ? 165 : 285;
    var ROWS = small ? 120 : 205;
    var X0 = -46, X1 = 46, Z0 = -52, Z1 = 12;

    var count = COLS * ROWS;
    var pos = new Float32Array(count * 3);
    var rnd = new Float32Array(count);
    var k = 0;

    for (var j = 0; j < ROWS; j++) {
      for (var i = 0; i < COLS; i++) {
        var x = X0 + (X1 - X0) * (i / (COLS - 1));
        var z = Z0 + (Z1 - Z0) * (j / (ROWS - 1));
        // break the grid up so it reads as a scan, not graph paper
        x += (hash2(i * 1.7, j * 2.3) - 0.5) * 0.55;
        z += (hash2(i * 3.1, j * 0.9) - 0.5) * 0.55;
        pos[k * 3]     = x;
        pos[k * 3 + 1] = heightAt(x, z);
        pos[k * 3 + 2] = z;
        rnd[k] = hash2(i * 5.3, j * 7.7);
        k++;
      }
    }

    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));

    var pointUniforms = {
      uTime:   { value: 0 },
      uSize:   { value: (small ? 2.6 : 2.2) * DPR },
      uNight:  { value: 0 },
      uLow:    { value: new THREE.Color('#9aa5a2') },
      uHigh:   { value: new THREE.Color(PAL.ink) },
      uSignal: { value: new THREE.Color(PAL.copper) }
    };

    var points = new THREE.Points(pg, new THREE.ShaderMaterial({
      uniforms: pointUniforms,
      vertexShader: POINT_VS,
      fragmentShader: POINT_FS,
      transparent: true,
      depthWrite: false
    }));
    group.add(points);

    /* ---- energy flow lines, running peak to valley ---- */
    var lineMats = [];
    var SEEDS = [[-30, -40], [-16, -46], [-4, -38], [7, -44], [19, -36], [31, -42], [12, -28]];

    for (var s = 0; s < SEEDS.length; s++) {
      var cx = SEEDS[s][0], cz = SEEDS[s][1];
      var verts = [], ts = [];
      var STEPS = 150;

      for (var n = 0; n < STEPS; n++) {
        var hh = heightAt(cx, cz);
        verts.push(cx, hh + 0.28, cz);
        ts.push(n / (STEPS - 1));

        // step downhill, with a bias toward the camera
        var e = 0.7;
        var gx = (heightAt(cx + e, cz) - heightAt(cx - e, cz)) / (2 * e);
        var gz = (heightAt(cx, cz + e) - heightAt(cx, cz - e)) / (2 * e);
        var len = Math.sqrt(gx * gx + gz * gz) + 1e-4;
        cx += (-gx / len) * 0.42;
        cz += (-gz / len) * 0.42 + 0.30;
        if (cz > Z1 || cx < X0 || cx > X1) break;
      }

      if (verts.length < 12) continue;

      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
      lg.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(ts), 1));

      var mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0 },
          uNight:  { value: 0 },
          uOffset: { value: s / SEEDS.length },
          uColor:  { value: new THREE.Color(s % 3 === 0 ? PAL.copper : PAL.glacier) }
        },
        vertexShader: LINE_VS,
        fragmentShader: LINE_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      lineMats.push(mat);
      group.add(new THREE.Line(lg, mat));
    }

    /* ---- resize ---- */
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = h > w ? 62 : 46;
      camera.updateProjectionMatrix();
    }
    resize();

    /* ---- pointer parallax ---- */
    var mx = 0, my = 0, tx = 0, ty = 0;
    if (!COARSE) {
      window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / window.innerWidth - 0.5);
        ty = (e.clientY / window.innerHeight - 0.5);
      }, { passive: true });
    }

    /* ---- frame ---- */
    var clock = new THREE.Clock();
    var running = true;

    function frame() {
      if (!running) return;
      requestAnimationFrame(frame);

      var time = clock.getElapsedTime();
      var p = scroll.page;
      var t = scroll.night;

      mx = lerp(mx, tx, 0.045);
      my = lerp(my, ty, 0.045);

      var ease = 1 - Math.pow(1 - p, 2.2);
      camera.position.set(mx * 3.6, lerp(7.5, 3.6, ease), lerp(21, 3.0, ease));
      camera.lookAt(mx * 1.4, lerp(5.6, 2.2, ease) + my * 1.6, -24);

      group.rotation.y = mx * 0.055 + p * 0.1;

      pointUniforms.uTime.value = time;
      pointUniforms.uNight.value = t;
      // daylight reads the rock dark against a pale sky; night inverts it
      // daylight: pale valley haze rising to dark rock.
      // night: meltwater blue rising to lit snow.
      pointUniforms.uHigh.value.set(mixHex(PAL.ink, PAL.paper, t));
      pointUniforms.uLow.value.set(mixHex('#9aa5a2', '#2a5a66', t));

      for (var m = 0; m < lineMats.length; m++) {
        lineMats[m].uniforms.uTime.value = time;
        lineMats[m].uniforms.uNight.value = t;
      }

      renderer.render(scene, camera);
    }

    function renderOnce() {
      var p = scroll.page, t = scroll.night;
      var ease = 1 - Math.pow(1 - p, 2.2);
      camera.position.set(0, lerp(7.5, 3.6, ease), lerp(21, 3.0, ease));
      camera.lookAt(0, lerp(5.6, 2.2, ease), -24);
      pointUniforms.uNight.value = t;
      for (var m = 0; m < lineMats.length; m++) lineMats[m].uniforms.uNight.value = t;
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', function () {
      resize();
      if (REDUCED) renderOnce();
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (REDUCED) return;
      if (document.hidden) { running = false; }
      else if (!running) { running = true; clock.getDelta(); frame(); }
    });

    canvas.classList.add('is-live');

    if (REDUCED) {
      renderOnce();
      return { onScroll: renderOnce };
    }
    frame();
    return { onScroll: null };
  }

  /* ---------- 6. PLATE TILT ---------- */

  function wireTilt() {
    if (COARSE || REDUCED) return;
    var plates = document.querySelectorAll('[data-tilt]');

    Array.prototype.forEach.call(plates, function (plate) {
      var inner = plate.querySelector('.plate__inner');
      if (!inner) return;

      plate.addEventListener('pointermove', function (e) {
        var r = plate.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transition = 'transform .12s linear';
        inner.style.transform =
          'rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 10).toFixed(2) + 'deg)';
      });

      plate.addEventListener('pointerleave', function () {
        inner.style.transition = '';
        inner.style.transform = '';
      });
    });
  }

  /* ---------- 7. BOOT ---------- */

  function boot() {
    wirePlaceholders();
    startClock();
    setYear();
    wireTilt();

    readScroll();
    paint();

    var scene = null;
    if (canvas && typeof THREE !== 'undefined' && webglOK()) {
      try { scene = buildScene(); }
      catch (err) { scene = null; }
    }
    if (!scene) {
      var fb = document.getElementById('stageFallback');
      if (fb) fb.classList.add('is-on');
    }

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        readScroll();
        paint();
        if (scene && scene.onScroll) scene.onScroll();
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
