/*
 * Hero carve (仕事一覧タブ): carved figures measured by the golden ratio.
 *
 * An abstract, symmetric, elongated figure in wood and bronze, built only from
 * geometry: a crest, two faceted diamonds, a notched neck and a stepped base.
 * Each diamond holds a copy of itself scaled by 1/φ, four times over (a nested,
 * fractal relief), every part's height follows φ, and the figure stands between
 * smaller copies of itself at 1/φ and 1/φ². Not a copy of any real work or
 * pattern: only the shared language of carving (symmetry, cut planes,
 * repeated incisions, long proportions).
 *
 * One loop, 28 s, one story:
 *   dark room → a point of light → a mirrored pair of golden spirals unwinds
 *   from it, with their squares → the figure's outline is drawn → its planes
 *   are carved from the top down, each diamond from the outside in → the
 *   incisions are cut (Fibonacci counts: 5, 8) → its smaller copies stand up
 *   beside it → climax: a raking light sweeps across and every plane turns →
 *   stillness → the carving withdraws into lines, the spirals rewind into the
 *   point, and the point goes out, exactly where it began.
 *
 * Drawn with Canvas 2D paths only (no images, no fonts). Nothing runs until the
 * panel is shown (the tab is display:none until then), and the loop pauses when
 * the panel is off screen. With prefers-reduced-motion, one still of the
 * finished carving.
 *
 * Usage: <div class="hero-carve" data-hero-carve></div> + this script.
 */
(function () {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var LOOP = 28;
  var STILL = 18; // the moment shown when motion is reduced
  var COL = {
    room: [23, 19, 15],
    dark: [52, 36, 26],
    wood: [124, 84, 54],
    light: [176, 128, 80],
    bronze: [220, 174, 108],
    earth: [150, 78, 52],
    line: [214, 176, 120]
  };

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function env(t, a, b, c, d) { return smooth(a, b, t) * (1 - smooth(c, d, t)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  // wood shade from a brightness 0..1: dark heartwood → wood → light wood → bronze
  function shade(b) {
    b = clamp(b, 0, 1.25);
    if (b < 0.45) return mix(COL.dark, COL.wood, b / 0.45);
    if (b < 0.8) return mix(COL.wood, COL.light, (b - 0.45) / 0.35);
    return mix(COL.light, COL.bronze, clamp((b - 0.8) / 0.45, 0, 1));
  }

  // ---------- the figure, in units of its height (top at y = 0, axis at x = 0) ----------
  // part heights follow φ: head 1/φ³, torso 1/φ², base 1/φ⁴
  var HEAD = { y: 0.105 + 0.118, a: 0.236 / PHI / 2, b: 0.236 / 2 };
  var TORSO = { y: 0.395 + 0.191, a: 0.382 / PHI / 2, b: 0.382 / 2 };
  var CREST = { top: 0, bot: 0.095, w: 0.112 };
  var NECK = { top: 0.345, bot: 0.389, w: 0.066 };
  var BASE = { top: 0.79, bot: 0.936, wt: 0.092, wb: 0.15 };
  var LEVELS = 4;

  // every carved plane of the figure, in the order it is cut
  function buildFacets() {
    var F = [];
    function face(poly, n, part) { F.push({ poly: poly, n: n, part: part }); }
    // crest: a tall triangle, split down the middle
    face([[0, CREST.top], [0, CREST.bot], [-CREST.w / 2, CREST.bot]], [-0.95, -0.3], 0);
    face([[0, CREST.top], [CREST.w / 2, CREST.bot], [0, CREST.bot]], [0.95, -0.3], 0);
    // a diamond holding copies of itself at 1/φ, cut from the outside in
    function diamond(D, part) {
      var nL = Math.hypot(D.a, D.b);
      for (var k = 0; k < LEVELS; k++) {
        var s0 = Math.pow(PHI, -k), s1 = Math.pow(PHI, -k - 1);
        var sg = k % 2 === 0 ? 1 : -1; // raised and sunken rings alternate
        var o = function (s) { return [[0, D.y - D.b * s], [D.a * s, D.y], [0, D.y + D.b * s], [-D.a * s, D.y]]; };
        var A = o(s0), B = o(s1);
        var nx = D.b / nL, ny = D.a / nL;
        face([A[3], A[0], B[0], B[3]], [-nx * sg, -ny * sg], part); // upper left
        face([A[0], A[1], B[1], B[0]], [nx * sg, -ny * sg], part);  // upper right
        face([A[1], A[2], B[2], B[1]], [nx * sg, ny * sg], part);   // lower right
        face([A[2], A[3], B[3], B[2]], [-nx * sg, ny * sg], part);  // lower left
      }
      // the innermost diamond: a small pyramid
      var s = Math.pow(PHI, -LEVELS), I = [[0, D.y - D.b * s], [D.a * s, D.y], [0, D.y + D.b * s], [-D.a * s, D.y]], C = [0, D.y];
      face([I[3], I[0], C], [-0.7, -0.7], part); face([I[0], I[1], C], [0.7, -0.7], part);
      face([I[1], I[2], C], [0.7, 0.7], part); face([I[2], I[3], C], [-0.7, 0.7], part);
    }
    diamond(HEAD, 1);
    // neck: a short block, two planes
    face([[-NECK.w / 2, NECK.top], [0, NECK.top], [0, NECK.bot], [-NECK.w / 2, NECK.bot]], [-1, 0], 2);
    face([[0, NECK.top], [NECK.w / 2, NECK.top], [NECK.w / 2, NECK.bot], [0, NECK.bot]], [1, 0], 2);
    diamond(TORSO, 3);
    // base: a tapered block, two planes and a top
    var bm = BASE.top + (BASE.bot - BASE.top) / PHI / PHI;
    face([[-BASE.wt / 2, BASE.top], [BASE.wt / 2, BASE.top], [BASE.wb / 2, bm], [-BASE.wb / 2, bm]], [0, -1], 4);
    face([[-BASE.wb / 2, bm], [0, bm], [0, BASE.bot], [-BASE.wb / 2, BASE.bot]], [-1, 0.15], 4);
    face([[0, bm], [BASE.wb / 2, bm], [BASE.wb / 2, BASE.bot], [0, BASE.bot]], [1, 0.15], 4);
    return F;
  }
  var FACETS = buildFacets();

  // incisions: short cuts across the diamonds' edges (8 per edge on the torso,
  // 5 on the head), chevrons on the neck and crest, and a sawtooth on the base
  function buildCuts() {
    var C = [];
    function edgeCuts(D, n, len) {
      var P = [[0, D.y - D.b], [D.a, D.y], [0, D.y + D.b], [-D.a, D.y]];
      var order = [3, 0, 1, 2]; // edges, in turn: upper left, upper right, lower right, lower left
      for (var e = 0; e < 4; e++) {
        var p = P[order[e]], q = P[(order[e] + 1) % 4];
        var ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey);
        var nx = -ey / L, ny = ex / L; // points inward for this winding
        if (nx * (0 - (p[0] + q[0]) / 2) + ny * (D.y - (p[1] + q[1]) / 2) < 0) { nx = -nx; ny = -ny; }
        for (var i = 1; i <= n; i++) {
          var t = i / (n + 1), x = p[0] + ex * t, y = p[1] + ey * t;
          C.push([[x, y], [x + nx * len, y + ny * len]]);
        }
      }
    }
    edgeCuts(HEAD, 5, 0.016);
    edgeCuts(TORSO, 8, 0.022);
    // neck: five chevrons
    for (var i = 0; i < 5; i++) {
      var y = NECK.top + (NECK.bot - NECK.top) * (i + 0.5) / 5;
      C.push([[-NECK.w * 0.36, y - 0.004], [0, y + 0.004], [NECK.w * 0.36, y - 0.004]]);
    }
    // crest: chevrons nested at 1/φ
    for (i = 1; i <= 3; i++) {
      var s = Math.pow(PHI, -i), yb = CREST.bot - 0.008;
      C.push([[-CREST.w / 2 * s, yb], [0, yb - (CREST.bot - CREST.top) * s * 0.9], [CREST.w / 2 * s, yb]]);
    }
    // base: a sawtooth of eight teeth
    var bm = BASE.top + (BASE.bot - BASE.top) / PHI / PHI, pts = [], n = 8;
    for (i = 0; i <= n * 2; i++) {
      pts.push([-BASE.wb / 2 + BASE.wb * i / (n * 2), i % 2 ? bm + 0.024 : bm + 0.006]);
    }
    C.push(pts);
    return C;
  }
  var CUTS = buildCuts();

  // outer contour of the figure, part by part (for the drawn outline)
  var OUTLINES = [
    [[0, CREST.top], [CREST.w / 2, CREST.bot], [-CREST.w / 2, CREST.bot], [0, CREST.top]],
    [[0, HEAD.y - HEAD.b], [HEAD.a, HEAD.y], [0, HEAD.y + HEAD.b], [-HEAD.a, HEAD.y], [0, HEAD.y - HEAD.b]],
    [[-NECK.w / 2, NECK.top], [NECK.w / 2, NECK.top], [NECK.w / 2, NECK.bot], [-NECK.w / 2, NECK.bot], [-NECK.w / 2, NECK.top]],
    [[0, TORSO.y - TORSO.b], [TORSO.a, TORSO.y], [0, TORSO.y + TORSO.b], [-TORSO.a, TORSO.y], [0, TORSO.y - TORSO.b]],
    [[-BASE.wt / 2, BASE.top], [BASE.wt / 2, BASE.top], [BASE.wb / 2, BASE.top + 0.056], [BASE.wb / 2, BASE.bot], [-BASE.wb / 2, BASE.bot], [-BASE.wb / 2, BASE.top + 0.056], [-BASE.wb / 2 + 0.0001, BASE.top + 0.056], [-BASE.wt / 2, BASE.top]]
  ];

  // ---------- golden spiral: quarter arcs in whirling squares ----------
  function goldenSquares(h) {
    var x = 0, y = 0, w = h * PHI, out = [];
    for (var i = 0; i < 14; i++) {
      var d = i % 4, s;
      if (d === 0) { s = h; out.push({ sq: [x, y, s], c: [x + s, y + s], a0: Math.PI, a1: Math.PI * 1.5 }); x += s; w -= s; }
      else if (d === 1) { s = w; out.push({ sq: [x, y, s], c: [x, y + s], a0: Math.PI * 1.5, a1: Math.PI * 2 }); y += s; h -= s; }
      else if (d === 2) { s = h; out.push({ sq: [x + w - s, y, s], c: [x + w - s, y], a0: 0, a1: Math.PI * 0.5 }); w -= s; }
      else { s = w; out.push({ sq: [x, y + h - s, s], c: [x + s, y + h - s], a0: Math.PI * 0.5, a1: Math.PI }); h -= s; }
      out[out.length - 1].r = s;
    }
    return { arcs: out, eye: [x + w / 2, y + h / 2] };
  }

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var W = 1, H = 1, dpr = 1, grain = null, G = null;
    // the first view starts as the spirals begin to unwind, not on an empty room
    var t0 = performance.now() - 1200, raf = 0, visible = true;
    var fixedTime = opts.time;

    function layout() {
      var wide = W / H > 1.6;
      var h = H * (wide ? 0.84 : 0.7);
      var base = H * (wide ? 0.93 : 0.86);
      var figs = [{ x: W / 2, h: h, k: 0 }];
      if (wide) {
        figs.push({ x: W / 2 - h * 0.62, h: h / PHI, k: 1 }, { x: W / 2 + h * 0.62, h: h / PHI, k: 1 },
                  { x: W / 2 - h * 1.12, h: h / PHI / PHI, k: 2 }, { x: W / 2 + h * 1.12, h: h / PHI / PHI, k: 2 });
      } else {
        figs.push({ x: W * 0.16, h: h / PHI, k: 1 }, { x: W * 0.84, h: h / PHI, k: 1 });
      }
      figs.forEach(function (f) { f.top = base - f.h * BASE.bot; });
      var eye = [W / 2, figs[0].top + HEAD.y * h];
      return { wide: wide, h: h, figs: figs, eye: eye, sp: wide ? H * 0.98 : W * 0.62 };
    }

    function resize() {
      var r = el.getBoundingClientRect();
      if (r.width < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // geometric shapes stay crisp at 1.5×, and each frame is about half the work of 2×
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      grain = makeGrain(W, H);
      G = null;
      if (reduce.matches || fixedTime != null) draw(fixedTime != null ? fixedTime : STILL);
    }

    function makeGrain(w, h) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
      var seed = 7;
      for (var i = 0; i < w * h; i++) {
        seed = (seed * 16807) % 2147483647;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = (seed % 1000) / 1000 * 15;
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    function poly(P, X, Y, S) {
      ctx.beginPath();
      ctx.moveTo(X + P[0][0] * S, Y + P[0][1] * S);
      for (var i = 1; i < P.length; i++) ctx.lineTo(X + P[i][0] * S, Y + P[i][1] * S);
    }

    // a partly drawn polyline (fraction p of its length)
    function partial(P, X, Y, S, p) {
      if (p <= 0) return;
      var L = 0, i;
      for (i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      var left = L * Math.min(1, p);
      ctx.beginPath();
      ctx.moveTo(X + P[0][0] * S, Y + P[0][1] * S);
      for (i = 1; i < P.length && left > 0; i++) {
        var l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]), t = Math.min(1, left / l);
        ctx.lineTo(X + lerp(P[i - 1][0], P[i][0], t) * S, Y + lerp(P[i - 1][1], P[i][1], t) * S);
        left -= l;
      }
      ctx.stroke();
    }

    // st: { line, cut(i), face(i), notch, alpha } as functions of the loop time
    function figure(f, T, L, lightAng, sweepX, sweepK) {
      var S = f.h, X = f.x, Y = f.top, k = f.k;
      // copies stand up a little later and leave a little earlier
      var d = k * 0.7;
      var A = k === 0 ? 1 : env(T, 9.8 + d, 12 + d, 21 - d * 0.5, 22.6 - d * 0.5);
      if (A <= 0.001) return;
      var lift = (1 - A) * S * 0.04;
      Y += lift;
      ctx.save();
      ctx.globalAlpha = A;
      var lx = Math.cos(lightAng), ly = Math.sin(lightAng);
      var n = FACETS.length;
      for (var i = 0; i < n; i++) {
        var F = FACETS[i];
        // cut from the top down (in part order), each diamond from the outside in; withdrawn in reverse
        var at = k === 0 ? 6.0 + i / n * 4.0 : 10.4 + d + i / n * 1.4;
        var out = k === 0 ? 20.2 + (n - 1 - i) / n * 2.4 : 99;
        var a = env(T, at, at + 0.6, out, out + 0.6);
        if (a <= 0.003) continue;
        var cx = 0, cy = 0;
        for (var j = 0; j < F.poly.length; j++) { cx += F.poly[j][0]; cy += F.poly[j][1]; }
        cx = X + cx / F.poly.length * S;
        var b = 0.42 + 0.42 * (F.n[0] * lx + F.n[1] * ly);
        // the raking light: planes near the moving band flare toward bronze
        b += sweepK * Math.exp(-Math.pow((cx - sweepX) / (S * 0.12), 2)) * (0.35 + 0.35 * Math.max(0, F.n[0] * lx + F.n[1] * ly));
        poly(F.poly, X, Y, S);
        ctx.closePath();
        ctx.fillStyle = rgba(shade(b * (0.55 + 0.45 * a)), a);
        ctx.fill();
        ctx.strokeStyle = rgba(COL.dark, 0.5 * a);
        ctx.lineWidth = Math.max(0.6, S * 0.0018);
        ctx.stroke();
      }
      // the outline, drawn before the carving and withdrawn after it
      var lw = Math.max(0.8, S * 0.0026);
      ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      var pin = k === 0 ? smooth(4.4, 6.8, T) : smooth(10 + d, 11.4 + d, T);
      var pout = k === 0 ? 1 - smooth(22.2, 24.6, T) : 1;
      var lineA = 0.75 * env(T, 4.2, 4.6, 22, 24.8);
      if (k !== 0) lineA = 0.5;
      ctx.strokeStyle = rgba(COL.line, lineA);
      OUTLINES.forEach(function (P, m) {
        var p = Math.min(pin * 1.25 - m * 0.06, pout * 1.25 - (OUTLINES.length - 1 - m) * 0.06);
        partial(P, X, Y, S, p);
      });
      // incisions: dark cut with a light lip beside it
      var nc = CUTS.length;
      for (i = 0; i < nc; i++) {
        var at2 = k === 0 ? 9.2 + i / nc * 3.2 : 11.6 + d + i / nc * 0.8;
        var c = env(T, at2, at2 + 0.35, k === 0 ? 19.8 : 99, k === 0 ? 20.8 : 100);
        if (c <= 0.003) continue;
        var P = CUTS[i];
        ctx.lineWidth = Math.max(0.7, S * 0.0034);
        ctx.strokeStyle = rgba([30, 20, 14], 0.85 * c);
        poly(P, X, Y, S); ctx.stroke();
        ctx.lineWidth = Math.max(0.5, S * 0.0016);
        ctx.strokeStyle = rgba(COL.bronze, (0.28 + 0.5 * sweepK * Math.exp(-Math.pow((X + P[0][0] * S - sweepX) / (S * 0.14), 2))) * c);
        ctx.save(); ctx.translate(S * 0.0024, S * 0.0024); poly(P, X, Y, S); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }

    function spirals(L, T) {
      if (!G) G = goldenSquares(L.sp);
      var grow = smooth(1.3, 5.6, T) * (1 - smooth(22.6, 26.2, T));
      var sqA = 0.1 * env(T, 2.2, 5.2, 15.5, 19);
      if (grow <= 0.001 && sqA <= 0.001) return;
      var arcs = G.arcs, N = arcs.length, ex = G.eye[0], ey = G.eye[1];
      for (var m = 0; m < 2; m++) {
        ctx.save();
        ctx.translate(L.eye[0], L.eye[1]);
        if (m) ctx.scale(-1, 1);
        ctx.translate(-ex, -ey);
        // from the eye outward: the smallest arc first
        var shown = grow * N;
        for (var i = N - 1; i >= 0; i--) {
          var idx = N - 1 - i;
          var p = clamp(shown - idx, 0, 1);
          if (p <= 0) break;
          var A = arcs[i];
          if (sqA > 0.001) {
            ctx.strokeStyle = rgba(COL.line, sqA * p);
            ctx.lineWidth = Math.max(0.5, dpr * 0.6);
            ctx.strokeRect(A.sq[0], A.sq[1], A.sq[2], A.sq[2]);
          }
          ctx.strokeStyle = rgba(COL.line, 0.42 * Math.min(1, grow * 1.5));
          ctx.lineWidth = Math.max(0.8, dpr * 1.1);
          ctx.beginPath();
          // drawn backwards, from the inner end toward the outer
          ctx.arc(A.c[0], A.c[1], A.r, A.a1, A.a1 - (A.a1 - A.a0) * p, true);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function draw(time) {
      var T = ((time % LOOP) + LOOP) % LOOP;
      var L = layout();
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba(COL.room, 1);
      ctx.fillRect(0, 0, W, H);

      // the climax: a raking light crosses from left to right, and the planes turn with it
      var sweepK = env(T, 13.0, 14.0, 16.4, 18.2);
      var sweepX = lerp(-W * 0.1, W * 1.1, smooth(13.0, 17.0, T));
      var lightAng = -2.25 + 1.3 * env(T, 13.2, 16.4, 17.2, 20.5);

      // warm pool behind the main figure; brighter at the climax
      var present = env(T, 5.5, 9, 21.5, 24.5);
      var glow = 0.1 * present + 0.2 * sweepK;
      if (glow > 0.002) {
        var gx = L.eye[0], gy = L.figs[0].top + L.h * 0.5;
        var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, L.h * 0.95);
        g.addColorStop(0, 'rgba(150,104,60,' + glow.toFixed(3) + ')');
        g.addColorStop(0.5, 'rgba(90,62,38,' + (glow * 0.4).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(23,19,15,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      spirals(L, T);
      // a ground line where the figures stand
      var gA = 0.22 * env(T, 8.5, 11, 21.8, 23.6);
      if (gA > 0.002) {
        var by = L.figs[0].top + L.h * BASE.bot;
        ctx.strokeStyle = rgba(COL.line, gA);
        ctx.lineWidth = Math.max(0.6, dpr * 0.8);
        ctx.beginPath(); ctx.moveTo(W * 0.06, by + 0.5); ctx.lineTo(W * 0.94, by + 0.5); ctx.stroke();
      }
      // smaller copies behind, the main figure in front
      for (var i = L.figs.length - 1; i >= 0; i--) figure(L.figs[i], T, L, lightAng, sweepX, sweepK);

      // the point of light at the eye of the spirals: where it all starts and ends
      var pt = env(T, 0.4, 1.6, 25.8, 27.4) * (1 - 0.85 * smooth(6, 8, T) * (1 - smooth(21, 23.5, T)));
      if (pt > 0.002) {
        var r = Math.max(2, L.h * 0.012);
        var pg = ctx.createRadialGradient(L.eye[0], L.eye[1], 0, L.eye[0], L.eye[1], r * 5);
        pg.addColorStop(0, rgba(COL.bronze, 0.55 * pt)); pg.addColorStop(1, rgba(COL.bronze, 0));
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(L.eye[0], L.eye[1], r * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(COL.bronze, pt);
        ctx.beginPath(); ctx.arc(L.eye[0], L.eye[1], r, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalAlpha = 0.5;
      ctx.drawImage(grain, 0, 0);
      ctx.globalAlpha = 1;
      var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    function frame(now) {
      raf = 0;
      if (!visible || reduce.matches || fixedTime != null) return;
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !reduce.matches && fixedTime == null) raf = requestAnimationFrame(frame); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) draw(STILL); else start(); });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);
    resize();
    start();
    return { draw: draw, setTime: function (t) { fixedTime = t; draw(t); }, loop: LOOP };
  }

  window.HeroCarve = { mount: mount };
  // nothing is built until the panel is actually shown (its tab starts hidden)
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-carve]'), function (el) {
      if (el.__heroCarve) return;
      function ready() { return el.getBoundingClientRect().width > 1; }
      if (ready()) { el.__heroCarve = mount(el); return; }
      if (!('ResizeObserver' in window)) { el.__heroCarve = mount(el); return; }
      var ro = new ResizeObserver(function () {
        if (!el.__heroCarve && ready()) { ro.disconnect(); el.__heroCarve = mount(el); }
      });
      ro.observe(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
