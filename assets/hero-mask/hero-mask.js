/*
 * Hero mask (仕事一覧タブ): a carved mask, seen the cubist way, measured by φ,
 * on a faded 1980s picture.
 *
 * The mask is abstract: it borrows only what carved masks share (a long face,
 * an arched brow, slit eyes, a long straight nose, a small pushed-out mouth,
 * flat cut cheeks, repeated incised lines) and copies no real mask. It borrows
 * only the cubist idea, not any painting: the front view and the profile are
 * one face (the left half faces us, the right edge is a profile with its own
 * nose, lips and eye; the eyes are calm, lowered lines, never dark holes), the face is cut into 16 flat planes, each plane has its own
 * light, and the two eyes and cheeks are deliberately unequal.
 *
 * φ builds it: the face is a 1 : φ rectangle; brow, nose base and mouth sit on
 * golden divisions of its height; the incised lines step by 1/φ. The golden
 * rectangle, its divisions and its spiral are shown faintly as guides.
 *
 * One loop, 24 s: the guides are drawn → the planes slot in one by one and the
 * mask forms → the incisions are cut → the light moves from the front face to
 * the profile and back → the planes come apart and drift off → the empty frame
 * the loop began with.
 *
 * A quiet picture in daylight: a faded cream ground, a fixed camera (no zoom,
 * no turning), only planes that fit, come apart and change their light, slowly.
 *
 * The picture: faded colour with lifted blacks, a soft image (drawn small and
 * enlarged), reds and yellows that bleed to the right, a slight colour
 * misregistration, light grain, and now and then a weak horizontal noise band.
 * No scan lines, no screen frame, no distortion; no strong flashes. Every
 * random choice comes from the frame number (30 a second, 720 a loop), so the
 * loop closes exactly.
 *
 * Canvas 2D only (no images, no fonts). Nothing is built until the panel is
 * shown, and it pauses off screen. With prefers-reduced-motion: one still of the
 * finished mask, without moving noise.
 *
 * Usage: <div class="hero-mask" data-hero-mask></div> + this script.
 */
(function () {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var LOOP = 24, FPS = 30, FRAMES = LOOP * FPS;
  var STILL = 10.6;
  var TAU = Math.PI * 2;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hash(a, b) {
    var h = (a * 374761393 + (b || 0) * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // faded video colour: a little less saturation, lifted blacks, softer whites
  function fade(c, k) {
    var l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    var r = [lerp(l, c[0], 0.66), lerp(l, c[1], 0.64), lerp(l, c[2], 0.7)];
    return [22 + r[0] * k * 0.84, 18 + r[1] * k * 0.83, 20 + r[2] * k * 0.8];
  }
  function rgba(c, a, k) {
    c = fade(c, k == null ? 1 : k);
    return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' + Math.round(clamp(c[2], 0, 255)) + ',' + clamp(a, 0, 1).toFixed(3) + ')';
  }

  var C = {
    ground: [240, 232, 214],   // faded cream: a quiet picture in daylight
    black: [70, 50, 38],       // the darkest ink is a deep brown, never black
    umber: [74, 48, 32],
    wood: [138, 92, 56],
    lightwood: [190, 142, 92],
    ochre: [196, 150, 70],
    blue: [78, 98, 120],
    red: [158, 74, 52],
    guide: [120, 86, 58]
  };

  // ---------- the mask, in units of its height (y from -0.5 to 0.5; the face is 1 : φ) ----------
  var HW = 0.5 / PHI;              // half width of the front face ≈ 0.309
  var BROW = -0.5 + 1 / (PHI * PHI); // -0.118: forehead is 1/φ² of the height
  var NOSE = BROW + (0.5 - BROW) / PHI; // 0.264: nose base on the golden division below the brow
  var MOUTH = NOSE + (0.5 - NOSE) / (PHI * PHI); // 0.354

  // planes: points, colour, the angle its own light comes from, and which face it belongs to
  // (f: the front face, p: the profile)
  var P = [
    { pts: [[0, -0.5], [-0.16, -0.48], [-0.27, -0.39], [-0.31, -0.22], [-0.05, BROW]], c: 'ochre', a: -2.4, g: 'f' },
    { pts: [[0, -0.5], [0.16, -0.475], [0.27, -0.38], [0.32, -0.2], [0.34, -0.11], [0.05, BROW]], c: 'wood', a: -0.6, g: 'p' },
    { pts: [[-0.05, BROW], [0.05, BROW], [0, -0.5]], c: 'lightwood', a: -1.6, g: 'f' },
    { pts: [[-0.31, -0.22], [-0.05, BROW], [-0.06, 0.02], [-0.3, -0.05]], c: 'blue', a: -2.8, g: 'f' },
    { pts: [[-0.3, -0.05], [-0.06, 0.02], [-0.06, 0.15], [-0.27, 0.12]], c: 'umber', a: 2.9, g: 'f' },
    { pts: [[-0.27, 0.12], [-0.06, 0.15], [-0.075, NOSE], [-0.21, 0.28]], c: 'wood', a: 2.2, g: 'f' },
    { pts: [[-0.045, BROW], [0, BROW], [0, NOSE], [-0.075, NOSE]], c: 'lightwood', a: -1.2, g: 'f' },
    { pts: [[0, BROW], [0.045, BROW], [0.075, NOSE], [0, NOSE]], c: 'wood', a: 0.4, g: 'f' },
    { pts: [[-0.075, NOSE], [0.075, NOSE], [0.055, MOUTH - 0.03], [-0.055, MOUTH - 0.03]], c: 'wood', a: -1.4, g: 'f' }, // under the nose
    { pts: [[0.05, BROW], [0.34, -0.11], [0.29, -0.06], [0.31, 0.05], [0.07, 0.06]], c: 'red', a: -0.3, g: 'p' },
    { pts: [[0.07, 0.06], [0.31, 0.05], [0.42, 0.22], [0.3, 0.25], [0.075, NOSE]], c: 'ochre', a: 0.2, g: 'p' },
    { pts: [[-0.21, 0.28], [-0.075, NOSE], [-0.05, MOUTH - 0.03], [-0.055, MOUTH + 0.03], [-0.05, 0.49], [-0.13, 0.41]], c: 'umber', a: 2.2, g: 'f' },
    { pts: [[0.075, NOSE], [0.3, 0.25], [0.35, 0.31], [0.31, 0.34], [0.34, 0.37], [0.24, 0.45], [0.06, 0.5], [0.055, MOUTH + 0.03], [0.05, MOUTH - 0.03]], c: 'wood', a: 0.9, g: 'p' },
    { pts: [[-0.05, 0.49], [-0.055, MOUTH + 0.03], [0.055, MOUTH + 0.03], [0.06, 0.5], [0, 0.505]], c: 'umber', a: 1.6, g: 'f' },
    // the small pushed-out mouth: a top plane and a front plane
    { pts: [[-0.055, MOUTH - 0.03], [0.055, MOUTH - 0.03], [0.045, MOUTH - 0.005], [-0.045, MOUTH - 0.005]], c: 'lightwood', a: -1.6, g: 'f' },
    { pts: [[-0.045, MOUTH - 0.005], [0.045, MOUTH - 0.005], [0.05, MOUTH + 0.03], [-0.05, MOUTH + 0.03]], c: 'red', a: 1.6, g: 'f' }
  ];
  // the whole outline (front contour on the left, profile on the right), for the shadow view
  var OUT = [[0, -0.5], [0.16, -0.475], [0.27, -0.38], [0.32, -0.2], [0.34, -0.11], [0.29, -0.06], [0.31, 0.05], [0.42, 0.22], [0.3, 0.25],
    [0.35, 0.31], [0.31, 0.34], [0.34, 0.37], [0.24, 0.45], [0.06, 0.5], [-0.05, 0.49], [-0.13, 0.41], [-0.21, 0.28], [-0.27, 0.12],
    [-0.3, -0.05], [-0.31, -0.22], [-0.27, -0.39], [-0.16, -0.48]];
  P.forEach(function (pl) {
    var x = 0, y = 0;
    pl.pts.forEach(function (p) { x += p[0]; y += p[1]; });
    pl.cx = x / pl.pts.length; pl.cy = y / pl.pts.length;
  });

  // eyes (unequal on purpose), calm and lowered: thin lines and a pale plane, never a dark hole.
  // front: a long, gently lowered lid line with a fold above it; profile: a small pale almond with a lid line
  var LIDS = [
    [[-0.235, -0.07], [-0.195, -0.056], [-0.155, -0.052], [-0.115, -0.056], [-0.075, -0.068]],
    [[-0.225, -0.088], [-0.155, -0.098], [-0.09, -0.088]],
    [[0.19, -0.06], [0.235, -0.05], [0.28, -0.06]]
  ];
  var ALMOND = [[0.18, -0.062], [0.235, -0.084], [0.29, -0.062], [0.235, -0.044]];
  // the arched brow over the front eye, and the profile's lips
  var BROWARC = [[-0.27, -0.1], [-0.2, -0.15], [-0.12, -0.158], [-0.055, -0.125]];

  // incised lines, spaced by 1/φ steps
  function buildCuts() {
    var cuts = [], y, i, d;
    // forehead (front): short horizontal lines, each step 1/φ of the last
    y = -0.44; d = 0.07;
    for (i = 0; i < 5; i++) { cuts.push([[-0.2 + i * 0.012, y], [-0.07, y + 0.004]]); y += d; d /= PHI; }
    // forehead (profile): short upright ticks along the temple
    for (i = 0; i < 6; i++) { var x = 0.1 + i * 0.03; cuts.push([[x, -0.42 + i * 0.01], [x + 0.008, -0.36 + i * 0.012]]); }
    // left cheek: three slanted lines, 1/φ apart
    d = 0.04; y = 0.0;
    for (i = 0; i < 3; i++) { cuts.push([[-0.25, y], [-0.13, y + 0.05]]); y += d; d /= PHI; }
    // right cheek: two chevrons
    for (i = 0; i < 2; i++) { var cy = 0.0 + i * 0.026; cuts.push([[0.12, cy], [0.18, cy + 0.03], [0.24, cy]]); }
    // chin: a row of five ticks
    for (i = 0; i < 5; i++) { var cx = -0.1 + i * 0.05; cuts.push([[cx, 0.43], [cx, 0.465]]); }
    return cuts;
  }
  var CUTS = buildCuts();

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var S = document.createElement('canvas'), sx = S.getContext('2d');      // the scene
    var R = document.createElement('canvas'), rx = R.getContext('2d');      // its warm channel, for the bleed
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var W = 1, H = 1, grains = null, lastFi = -1;
    var t0 = performance.now() - 2000, raf = 0, visible = true;
    var fixedTime = opts.time;

    function resize() {
      var r = el.getBoundingClientRect();
      if (r.width < 2) return;
      // drawn at reduced size and enlarged by the browser: the softness of tape
      var k = r.width < 700 ? 0.72 : 0.52;
      W = Math.max(1, Math.round(r.width * k)); H = Math.max(1, Math.round(r.height * k));
      canvas.width = S.width = R.width = W; canvas.height = S.height = R.height = H;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      grains = [makeGrain(W + 16, H + 16, 5), makeGrain(W + 16, H + 16, 9)];
      lastFi = -1;
      if (fixedTime != null) draw(fixedTime); else if (reduce.matches) draw(STILL, true);
    }

    function makeGrain(w, h, seed) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
      for (var i = 0; i < w * h; i++) {
        seed = (seed * 16807) % 2147483647;
        var v = 128 + ((seed % 1000) / 1000 - 0.5) * 120;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    function layout() {
      var wide = W / H > 1.6;
      var h = H * (wide ? 0.84 : 0.7);
      return { wide: wide, h: h, x: wide ? W * 0.5 + h * 0.36 : W * 0.5 - h * 0.03, y: H * 0.5 };
    }

    function path(g, pts, X, Y, s, close) {
      g.beginPath();
      g.moveTo(X + pts[0][0] * s, Y + pts[0][1] * s);
      for (var i = 1; i < pts.length; i++) g.lineTo(X + pts[i][0] * s, Y + pts[i][1] * s);
      if (close) g.closePath();
    }
    function partialLine(g, a, b, p) {
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); g.stroke();
    }

    function scene(T) {
      var g = sx, L = layout(), h = L.h, X = L.x, Y = L.y, u = W / 700;
      g.globalAlpha = 1;
      g.fillStyle = rgba(C.ground, 1);
      g.fillRect(0, 0, W, H);

      // backdrop: a few large, very dark planes on golden divisions of the frame
      var bk = 0.55 + 0.45 * smooth(0.3, 3, T) * (1 - smooth(21.5, 23.6, T));
      g.fillStyle = rgba(C.blue, 0.2 * bk, 1.5);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W / PHI - h * 0.2, 0); g.lineTo(W / PHI - h * 0.55, H); g.lineTo(0, H); g.fill();
      g.fillStyle = rgba(C.ochre, 0.16 * bk, 1.15);
      g.beginPath(); g.moveTo(W - W / (PHI * PHI) + h * 0.1, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(W - W / (PHI * PHI) - h * 0.15, H); g.fill();
      g.fillStyle = rgba(C.red, 0.08 * bk, 1.4);
      g.fillRect(X - h * 0.62, Y + h * 0.5 - h / (PHI * PHI * PHI), h * 1.24, h / (PHI * PHI * PHI));

      // the other view: the same head as a faint thin line drawing, turned to look the other way (no fill)
      var shA = 0.42 * bk * smooth(1.5, 4.5, T) * (1 - smooth(20, 22.5, T));
      if (shA > 0.003) {
        var shX = L.wide ? X - h * 0.74 : X - h * 0.16, shS = L.wide ? h / PHI * PHI : h * 1.08;
        g.save(); g.translate(shX, Y + (L.wide ? 0 : h * 0.03)); g.scale(-1, 1);
        path(g, OUT, 0, 0, shS, true);
        g.lineWidth = Math.max(0.6, u * 0.8); g.lineJoin = 'round';
        g.strokeStyle = rgba(C.guide, shA); g.stroke();
        g.restore();
      }

      // guides: the face's golden rectangle, its divisions, and a golden spiral
      var gi = smooth(0.4, 3.4, T), go = 1 - smooth(20.5, 23, T);
      var ga = 0.42 * Math.min(1, gi * 1.5) * go * (1 - 0.45 * smooth(9, 11, T) * (1 - smooth(18, 20, T)));
      if (ga > 0.003) {
        g.strokeStyle = rgba(C.guide, ga);
        g.lineWidth = Math.max(0.6, u * 0.7);
        var rw = h / PHI, rx0 = X - rw / 2, ry0 = Y - h / 2;
        var corners = [[rx0, ry0], [rx0 + rw, ry0], [rx0 + rw, ry0 + h], [rx0, ry0 + h], [rx0, ry0]];
        for (var i = 0; i < 4; i++) partialLine(g, corners[i], corners[i + 1], clamp(gi * 4 - i * 0.6, 0, 1));
        if (L.wide) {
          // around both views: a lying golden rectangle and its first square
          var Lw = h * PHI * 1.08, Lh = Lw / PHI, lx0 = W / 2 - Lw / 2 - h * 0.02, ly0 = Y - Lh / 2;
          g.strokeStyle = rgba(C.guide, ga * 0.55);
          var lc = [[lx0, ly0], [lx0 + Lw, ly0], [lx0 + Lw, ly0 + Lh], [lx0, ly0 + Lh], [lx0, ly0]];
          for (var j = 0; j < 4; j++) partialLine(g, lc[j], lc[j + 1], clamp(gi * 3 - 0.4 - j * 0.4, 0, 1));
          partialLine(g, [lx0 + Lh, ly0], [lx0 + Lh, ly0 + Lh], clamp(gi * 2 - 0.8, 0, 1));
          g.strokeStyle = rgba(C.guide, ga);
        }
        [BROW, NOSE, MOUTH].forEach(function (ly, k) {
          var p = clamp(gi * 3 - 0.8 - k * 0.3, 0, 1);
          partialLine(g, [rx0 - h * 0.08, Y + ly * h], [rx0 + rw + h * 0.12, Y + ly * h], p);
        });
        partialLine(g, [X, ry0 - h * 0.03], [X, ry0 + h * 1.03], clamp(gi * 2 - 0.6, 0, 1));
        // a golden spiral in whirling squares, fitted to the face rectangle: built lying down
        // (h wide, h/φ tall) and turned upright
        g.save();
        g.translate(rx0 + rw, ry0); g.rotate(Math.PI / 2);
        var x = 0, y = 0, w = h, hh = rw, arcs = [];
        for (i = 0; i < 9; i++) {
          var d = i % 4, s;
          if (d === 0) { s = hh; arcs.push([x + s, y + s, s, Math.PI, Math.PI * 1.5]); x += s; w -= s; }
          else if (d === 1) { s = w; arcs.push([x, y + s, s, Math.PI * 1.5, Math.PI * 2]); y += s; hh -= s; }
          else if (d === 2) { s = hh; arcs.push([x + w - s, y, s, 0, Math.PI * 0.5]); w -= s; }
          else { s = w; arcs.push([x + s, y + hh - s, s, Math.PI * 0.5, Math.PI]); hh -= s; }
        }
        var sp = clamp(gi * 1.6 - 0.5, 0, 1) * arcs.length;
        for (i = 0; i < arcs.length && sp > 0; i++, sp -= 1) {
          var A = arcs[i];
          g.beginPath(); g.arc(A[0], A[1], A[2], A[3], A[3] + (A[4] - A[3]) * Math.min(1, sp)); g.stroke();
        }
        g.restore();
      }

      // the light: front face lit, then the profile, then the front again
      var sw = T < 11 || T > 19 ? 1 : Math.cos(TAU * (T - 11) / 8);
      var la = -2.0 + 0.5 * Math.sin(TAU * T / LOOP);

      // planes slot in one by one (from outside, turning into place) and drift apart at the end
      var n = P.length, built = 0;
      for (i = 0; i < n; i++) {
        var pl = P[i];
        var tin = 3.2 + i * 0.36, tout = 18.8 + (n - 1 - i) * 0.2;
        var pin = smooth(tin, tin + 0.9, T), pout = smooth(tout, tout + 1.4, T);
        var a = pin * (1 - pout);
        if (a <= 0.003) continue;
        built += a / n;
        var off = (1 - pin) + pout * 1.3;
        var dx = pl.cx, dy = pl.cy, dl = Math.hypot(dx, dy) || 1;
        var ox = dx / dl * 0.22 * off * h, oy = dy / dl * 0.22 * off * h + (1 - pin) * 0.04 * h;
        var rot = (i % 2 ? 1 : -1) * 0.25 * off;
        g.save();
        g.translate(X + pl.cx * h + ox, Y + pl.cy * h + oy);
        g.rotate(rot);
        g.translate(-(X + pl.cx * h), -(Y + pl.cy * h));
        path(g, pl.pts, X, Y, h, true);
        var b = 1.02 + 0.16 * Math.cos(pl.a - la) + (pl.g === 'f' ? 0.17 : -0.17) * sw;
        g.fillStyle = rgba(C[pl.c], a, b);
        g.fill();
        g.lineWidth = Math.max(0.6, h * 0.004);
        g.strokeStyle = rgba(C.black, 0.7 * a);
        g.stroke();
        g.restore();
      }

      // features and incisions, once the face is together
      var fe = smooth(8.4, 9.6, T) * (1 - smooth(18.4, 19.4, T));
      if (fe > 0.003) {
        path(g, ALMOND, X, Y, h, true);
        g.fillStyle = rgba(C.lightwood, 0.85 * fe, 1.1); g.fill();
        g.lineWidth = Math.max(0.6, h * 0.0035);
        g.strokeStyle = rgba(C.black, 0.6 * fe); g.stroke();
        LIDS.forEach(function (ln, k) {
          g.lineWidth = Math.max(0.7, h * (k === 1 ? 0.003 : 0.0055));
          g.strokeStyle = rgba(C.black, (k === 1 ? 0.45 : 0.8) * fe);
          path(g, ln, X, Y, h, false); g.stroke();
        });
        g.lineWidth = Math.max(0.8, h * 0.006);
        g.strokeStyle = rgba(C.black, 0.7 * fe);
        path(g, BROWARC, X, Y, h, false); g.stroke();
        var nc = CUTS.length;
        for (i = 0; i < nc; i++) {
          var tc = 9.3 + i / nc * 1.6, c = smooth(tc, tc + 0.3, T) * (1 - smooth(18.2, 19, T));
          if (c <= 0.003) continue;
          g.lineWidth = Math.max(0.7, h * 0.0045);
          g.strokeStyle = rgba(C.black, 0.8 * c);
          path(g, CUTS[i], X, Y, h, false); g.stroke();
          g.save(); g.translate(h * 0.003, h * 0.003);
          g.lineWidth = Math.max(0.5, h * 0.002);
          g.strokeStyle = rgba(C.lightwood, 0.35 * c);
          path(g, CUTS[i], X, Y, h, false); g.stroke();
          g.restore();
        }
        // the profile's lips: a small step on the edge
        g.lineWidth = Math.max(0.7, h * 0.005);
        g.strokeStyle = rgba(C.black, 0.8 * fe);
        path(g, [[0.315, 0.255], [0.37, 0.315], [0.34, 0.33], [0.37, 0.345], [0.33, 0.37]], X, Y, h, false); g.stroke();
      }
      return built;
    }

    function draw(time, still) {
      var T = ((time % LOOP) + LOOP) % LOOP;
      var fi = Math.floor(T * FPS + 1e-6) % FRAMES;
      T = fi / FPS;
      lastFi = fi;
      scene(T);
      var u = W / 700;

      // the tape: base picture
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(S, 0, 0);
      // reds and yellows bleed to the right; a faint blue ghost sits a little to the left
      rx.globalCompositeOperation = 'source-over';
      rx.drawImage(S, 0, 0);
      rx.globalCompositeOperation = 'screen';
      rx.fillStyle = 'rgb(110,30,0)';  // the ghost keeps its red: where it falls, the picture turns warm
      rx.fillRect(0, 0, W, H);
      var wob = still ? 0 : Math.sin(fi * 0.05) * 0.5 + (hash(Math.floor(fi / 3), 1) - 0.5) * 0.6;
      // (on a light ground the bleed is a warm ghost of each shape, trailing to the right)
      ctx.globalCompositeOperation = 'darken'; // the ground is untouched; only shapes leave a trail
      ctx.globalAlpha = 0.5; ctx.drawImage(R, (2 + wob) * u, 0);
      ctx.globalAlpha = 0.28; ctx.drawImage(R, (4.5 + wob) * u, 0);
      ctx.globalAlpha = 0.14; ctx.drawImage(R, (8 + wob) * u, 0);
      ctx.globalAlpha = 0.12; ctx.drawImage(S, (-2 - wob) * u, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // a slow, slight drift in colour
      if (!still) {
        var tint = Math.sin(TAU * T / LOOP * 3);
        ctx.fillStyle = tint > 0 ? 'rgba(120,90,160,' + (0.025 * tint).toFixed(3) + ')' : 'rgba(170,140,70,' + (-0.025 * tint).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      // now and then a weak horizontal noise band: a strip slips sideways, with a faint bright streak
      if (!still) {
        for (var k = 0; k < 2; k++) {
          var win = Math.floor(fi / 9) + k * 97;
          if (hash(win, 30 + k) > 0.16) continue;
          var by = Math.floor(H * hash(win, 40 + k) + (fi % 9) * H * 0.012), bh = Math.max(2, Math.round(H * (0.012 + 0.02 * hash(win, 50 + k))));
          var shift = Math.round((hash(fi, 60 + k) - 0.3) * 6 * u);
          if (by + bh < H) ctx.drawImage(canvas, 0, by, W, bh, shift, by, W, bh);
          ctx.fillStyle = 'rgba(255,250,240,' + (0.12 + 0.1 * hash(fi, 70 + k)).toFixed(3) + ')';
          var sx0 = W * hash(fi, 80 + k) * 0.6;
          ctx.fillRect(sx0, by + bh * 0.5, W * (0.15 + 0.35 * hash(fi, 90 + k)), Math.max(1, bh * 0.25));
        }
      }
      // light grain
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.22;
      ctx.drawImage(grains[still ? 0 : fi % 2], still ? 0 : -Math.floor(hash(fi, 9) * 16), still ? 0 : -Math.floor(hash(fi, 10) * 16));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // soft, darker edges
      var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      v.addColorStop(0, 'rgba(150,120,90,0)'); v.addColorStop(1, 'rgba(150,120,90,0.12)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    function frame(now) {
      raf = 0;
      if (!visible || reduce.matches || fixedTime != null || paused) return;
      var t = (now - t0) / 1000;
      if ((Math.floor((((t % LOOP) + LOOP) % LOOP) * FPS + 1e-6) % FRAMES) !== lastFi) draw(t);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!paused && !raf && visible && !reduce.matches && fixedTime == null) raf = requestAnimationFrame(frame); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) draw(STILL, true); else { lastFi = -1; start(); } });
    // size changes come in bursts (a phone turning, a window being dragged): rebuild once they settle,
    // but at once when the panel first gets a size (it was hidden)
    var rzTimer = 0;
    // a resize clears the canvas: while paused, paint the paused moment again
    function resizeNow() { resize(); if (paused && !reduce.matches && fixedTime == null) draw((pausedAt - t0) / 1000); }
    function resizeSoon() { clearTimeout(rzTimer); if (canvas.width <= 2) resizeNow(); else rzTimer = setTimeout(resizeNow, 150); }
    if ('ResizeObserver' in window) new ResizeObserver(resizeSoon).observe(el); else window.addEventListener('resize', resizeSoon);
    // pause and resume (for the pause button, assets/hero-pause): the picture stops where it is and goes on from there
    var paused = false, pausedAt = 0;
    el.__heroCtl = {
      pause: function () { if (paused) return; paused = true; pausedAt = performance.now(); },
      resume: function () { if (!paused) return; paused = false; t0 += performance.now() - pausedAt; start(); },
      isPaused: function () { return paused; }
    };
    resize();
    start();
    return { draw: draw, setTime: function (t, still) { fixedTime = t; draw(t, still); }, loop: LOOP };
  }

  window.HeroMask = { mount: mount };
  // nothing is built until the panel is actually shown (its tab starts hidden)
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-mask]'), function (el) {
      if (el.__heroMask) return;
      function ready() { return el.getBoundingClientRect().width > 1; }
      if (ready() || !('ResizeObserver' in window)) { el.__heroMask = mount(el); return; }
      var ro = new ResizeObserver(function () {
        if (!el.__heroMask && ready()) { ro.disconnect(); el.__heroMask = mount(el); }
      });
      ro.observe(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
