/*
 * Hero art: 「調べて、確かめて、仕組みにする」
 * Scattered ink fragments are linked by fine threads, gather into one
 * hand-drawn form, rest, then loosen back. 16 s seamless loop on Canvas 2D.
 *
 * Usage: <div class="hero-art" data-hero-art></div> + this script.
 * Or: HeroArt.mount(element, { seed: 7 })
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var LOOP_MS = 16000;
  var STILL_PHASE = 0.70; // frame used for prefers-reduced-motion

  var COLORS = {
    paper: [242, 236, 224],
    ink: '42, 38, 34',
    vermilion: '178, 84, 60',
    sage: '138, 154, 128'
  };

  // ---------- small helpers ----------
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise1(rand) {
    var v = new Float32Array(256);
    for (var i = 0; i < 256; i++) v[i] = rand();
    return function (x) {
      var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      return v[i & 255] + (v[(i + 1) & 255] - v[i & 255]) * u;
    };
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ---------- scene (unit space, roughly [-1, 1]) ----------
  function buildScene(seed) {
    var rand = rng(seed);
    var M = 960;
    var cx = 0.02, cy = 0.0, R = 0.56;
    var ph = [rand() * TAU, rand() * TAU, rand() * TAU];
    var X = new Float32Array(M), Y = new Float32Array(M);
    for (var k = 0; k < M; k++) {
      var th = (k / M) * TAU;
      var r = R * (1 + 0.14 * Math.cos(2 * th + ph[0]) + 0.075 * Math.sin(3 * th + ph[1]) + 0.03 * Math.cos(5 * th + ph[2]));
      X[k] = cx + r * Math.cos(th) * 1.04;
      Y[k] = cy + r * Math.sin(th) * 0.96;
    }

    // fragments: pieces of the final contour
    var N = 11, frags = [];
    for (var i = 0; i < N; i++) {
      var c = (i + 0.5 + (rand() - 0.5) * 0.35) / N;
      var len = 0.04 + rand() * 0.07;
      var mid = Math.round(c * M) % M;
      frags.push({ c: c, a: c - len / 2, b: c + len / 2, hx: X[mid], hy: Y[mid],
        rot: (rand() - 0.5) * 2.6, depth: 0.4 + rand() * 0.9, phase: rand() * TAU,
        bendIn: (rand() - 0.5) * 0.9, bendOut: (rand() - 0.5) * 0.9 });
    }

    // scattered layout: spread with breathing room, stable for this seed
    var placed = [];
    for (i = 0; i < N; i++) {
      var best = null, bestScore = -1;
      for (var t = 0; t < 400; t++) {
        var px = (rand() * 2 - 1) * 0.86, py = (rand() * 2 - 1) * 0.80;
        var dmin = 9;
        for (var j = 0; j < placed.length; j++) {
          var dx = px - placed[j][0], dy = py - placed[j][1];
          dmin = Math.min(dmin, Math.sqrt(dx * dx + dy * dy));
        }
        var dc = Math.sqrt(px * px + py * py);
        var score = Math.min(dmin, 0.42) - Math.abs(dc - 0.58) * 0.35;
        if (score > bestScore) { bestScore = score; best = [px, py]; }
      }
      placed.push(best);
      frags[i].sx = best[0];
      frags[i].sy = best[1];
    }

    // relations: minimum spanning tree over scattered positions + a few short extras
    var edges = [], inTree = [0], used = {};
    function key(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
    function dist(a, b) { var dx = frags[a].sx - frags[b].sx, dy = frags[a].sy - frags[b].sy; return Math.sqrt(dx * dx + dy * dy); }
    while (inTree.length < N) {
      var bA = -1, bB = -1, bd = 9;
      for (i = 0; i < inTree.length; i++) for (j = 0; j < N; j++) {
        if (inTree.indexOf(j) >= 0) continue;
        var d = dist(inTree[i], j);
        if (d < bd) { bd = d; bA = inTree[i]; bB = j; }
      }
      inTree.push(bB); edges.push({ a: bA, b: bB }); used[key(bA, bB)] = 1;
    }
    var extra = [];
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) if (!used[key(i, j)]) extra.push([dist(i, j), i, j]);
    extra.sort(function (p, q) { return p[0] - q[0]; });
    for (i = 0; i < 2 && i < extra.length; i++) edges.push({ a: extra[i][1], b: extra[i][2] });

    // the inquiry starts at the vermilion fragment and spreads through the threads
    var start = Math.floor(rand() * N);
    var depth = new Array(N).fill(-1); depth[start] = 0;
    var queue = [start], order = [start];
    while (queue.length) {
      var n = queue.shift();
      edges.forEach(function (e) {
        var o = e.a === n ? e.b : e.b === n ? e.a : -1;
        if (o >= 0 && depth[o] < 0) { depth[o] = depth[n] + 1; queue.push(o); order.push(o); }
      });
    }
    edges.forEach(function (e) {
      if (depth[e.b] < depth[e.a]) { var s = e.a; e.a = e.b; e.b = s; }
      e.t0 = 0.06 + depth[e.a] * 0.034 + rand() * 0.012;
      e.bend = (rand() - 0.5) * 0.5;
      var dx = frags[e.a].hx - frags[e.b].hx, dy = frags[e.a].hy - frags[e.b].hy;
      e.chordLen = Math.sqrt(dx * dx + dy * dy);
    });
    // keep the three longest relations as the inner structure of the form
    edges.slice().sort(function (p, q) { return q.chordLen - p.chordLen; })
      .slice(0, 3).forEach(function (e) { e.chord = true; });

    order.forEach(function (fi, o) {
      frags[fi].dockStart = 0.24 + o * 0.014;
      frags[fi].dockEnd = frags[fi].dockStart + 0.17;
    });

    // contour order of fragments (by position along the loop)
    var byC = frags.map(function (f, idx) { return idx; }).sort(function (p, q) { return frags[p].c - frags[q].c; });
    var gaps = [];
    for (i = 0; i < N; i++) {
      var f0 = byC[i], f1 = byC[(i + 1) % N];
      var a0 = frags[f0].b, b0 = frags[f1].a;
      if (b0 < a0) b0 += 1;
      gaps.push({ f0: f0, f1: f1, a: a0, b: b0, fillStart: Math.max(frags[f0].dockEnd, frags[f1].dockEnd) });
    }
    // unravel sweeps around the loop starting next to the vermilion fragment
    var vPos = byC.indexOf(start);
    gaps.forEach(function (g, gi) {
      var sweep = (gi - vPos + N) % N;
      g.retract = 0.76 + sweep * 0.005;
    });
    frags.forEach(function (f, fi) {
      var gl = gaps.filter(function (g) { return g.f0 === fi || g.f1 === fi; });
      f.undockStart = Math.max(gl[0].retract, gl[1].retract) + 0.04;
      f.undockEnd = f.undockStart + 0.13;
    });

    // ink specks: tiny marks that stay apart
    var specks = [];
    for (i = 0; i < 16; i++) {
      var ang = rand() * TAU, rr = 0.62 + rand() * 0.34;
      specks.push({ x: Math.cos(ang) * rr * 1.05, y: Math.sin(ang) * rr * 0.92, r: 0.0025 + rand() * 0.004, a: 0.18 + rand() * 0.25 });
    }

    return { M: M, X: X, Y: Y, frags: frags, edges: edges, gaps: gaps, specks: specks,
      vermilion: start, noise: noise1(rand), noise2: noise1(rand), noise3: noise1(rand) };
  }

  // ---------- state at phase p in [0, 1) ----------
  function dockAmount(f, p) {
    if (p >= f.undockStart) return 1 - ease(smooth(f.undockStart, f.undockEnd, p));
    return ease(smooth(f.dockStart, f.dockEnd, p));
  }
  function gapAmount(g, p) {
    return smooth(g.fillStart, g.fillStart + 0.06, p) * (1 - smooth(g.retract, g.retract + 0.04, p));
  }
  function fragmentPose(sc, f, p, mx, my, ax) {
    var d = dockAmount(f, p);
    // on a wide canvas the loose fragments spread sideways; the gathered form keeps its shape
    var sx = f.sx * ax, sy = f.sy;
    var gathering = p < f.undockStart;
    var bend = gathering ? f.bendIn : f.bendOut;
    // curved travel: quadratic path from scattered spot to home
    var ex = f.hx - sx, ey = f.hy - sy;
    var cxp = (sx + f.hx) / 2 - ey * bend, cyp = (sy + f.hy) / 2 + ex * bend;
    var u = 1 - d;
    var x = u * u * sx + 2 * u * d * cxp + d * d * f.hx;
    var y = u * u * sy + 2 * u * d * cyp + d * d * f.hy;
    // breathing while loose (integer frequencies keep the loop seamless)
    var loose = 1 - d;
    x += 0.007 * Math.sin(TAU * p * 2 + f.phase) * loose;
    y += 0.007 * Math.cos(TAU * p * 3 + f.phase) * loose;
    x += mx * 0.014 * f.depth * loose + mx * 0.004 * d;
    y += my * 0.014 * f.depth * loose + my * 0.004 * d;
    return { x: x, y: y, rot: f.rot * (1 - d), d: d };
  }

  // ---------- drawing ----------
  function brush(ctx, pts, svals, w0, rgb, alpha, sc, taperA, taperB, seedOff) {
    var n = pts.length / 2;
    if (n < 2) return;
    var L = new Float32Array(n * 2), Rr = new Float32Array(n * 2);
    var acc = 0, lens = new Float32Array(n);
    for (var i = 1; i < n; i++) {
      acc += Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
      lens[i] = acc;
    }
    var taperLen = w0 * 7;
    for (i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      var tx = pts[i1 * 2] - pts[i0 * 2], ty = pts[i1 * 2 + 1] - pts[i0 * 2 + 1];
      var tl = Math.hypot(tx, ty) || 1;
      var nx = -ty / tl, ny = tx / tl;
      var s = svals[i] + seedOff;
      var w = w0 * (0.45 + 0.95 * sc.noise(s * 38)) * (0.7 + 0.6 * sc.noise2(s * 6));
      if (taperA) w *= smooth(0, taperLen, lens[i]) * 0.85 + 0.15;
      if (taperB) w *= smooth(0, taperLen, acc - lens[i]) * 0.85 + 0.15;
      var jl = (sc.noise3(s * 260) - 0.5) * w0 * 0.5;
      var jr = (sc.noise3(s * 260 + 50) - 0.5) * w0 * 0.5;
      L[i * 2] = pts[i * 2] + nx * (w / 2 + jl); L[i * 2 + 1] = pts[i * 2 + 1] + ny * (w / 2 + jl);
      Rr[i * 2] = pts[i * 2] - nx * (w / 2 + jr); Rr[i * 2 + 1] = pts[i * 2 + 1] - ny * (w / 2 + jr);
    }
    ctx.beginPath();
    ctx.moveTo(L[0], L[1]);
    for (i = 1; i < n; i++) ctx.lineTo(L[i * 2], L[i * 2 + 1]);
    for (i = n - 1; i >= 0; i--) ctx.lineTo(Rr[i * 2], Rr[i * 2 + 1]);
    ctx.closePath();
    // a faint bleed under the stroke, then the stroke itself
    ctx.fillStyle = 'rgba(' + rgb + ',' + (alpha * 0.10) + ')';
    ctx.lineWidth = w0 * 0.9;
    ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.08) + ')';
    ctx.stroke();
    ctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')';
    ctx.fill();
    // dry-brush streaks: broken thin lines along the edge
    ctx.lineWidth = Math.max(0.5, w0 * 0.18);
    ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.35) + ')';
    ctx.beginPath();
    var on = false;
    for (i = 0; i < n; i++) {
      var sv = svals[i] + seedOff;
      var vis = sc.noise2(sv * 90) > 0.58;
      var ox = (L[i * 2] - pts[i * 2]) * 1.35, oy = (L[i * 2 + 1] - pts[i * 2 + 1]) * 1.35;
      if (vis) {
        if (!on) ctx.moveTo(pts[i * 2] + ox, pts[i * 2 + 1] + oy); else ctx.lineTo(pts[i * 2] + ox, pts[i * 2 + 1] + oy);
      }
      on = vis;
    }
    ctx.stroke();
  }

  function contourSlice(sc, a, b, tf) {
    // points along the contour between s=a and s=b (b may exceed 1), transformed by tf
    var M = sc.M, pts = [], sv = [];
    var k0 = Math.ceil(a * M), k1 = Math.floor(b * M);
    function push(s) {
      var f = s * M, k = Math.floor(f), t = f - k;
      var i0 = ((k % M) + M) % M, i1 = (i0 + 1) % M;
      var x = lerp(sc.X[i0], sc.X[i1], t), y = lerp(sc.Y[i0], sc.Y[i1], t);
      var q = tf(x, y);
      pts.push(q[0], q[1]); sv.push(((s % 1) + 1) % 1);
    }
    push(a);
    for (var k = k0; k <= k1; k++) push(k / M);
    push(b);
    return { pts: pts, sv: sv };
  }

  function makePaper(w, h, dpr, seed) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    var base = COLORS.paper;
    var img = g.createImageData(w, h), data = img.data;
    var rand = rng(seed * 31 + 7);
    for (var i = 0; i < w * h; i++) {
      var n = (rand() - 0.5) * 9 + (rand() < 0.004 ? -10 : 0);
      data[i * 4] = base[0] + n; data[i * 4 + 1] = base[1] + n; data[i * 4 + 2] = base[2] + n - 1; data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // fibres
    g.lineCap = 'round';
    for (i = 0; i < Math.round(w * h / 9000); i++) {
      var x = rand() * w, y = rand() * h, a = rand() * TAU, l = (6 + rand() * 22) * dpr;
      g.strokeStyle = 'rgba(120,104,80,' + (0.025 + rand() * 0.04) + ')';
      g.lineWidth = (0.4 + rand() * 0.6) * dpr;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    // soft uneven tone, like handmade sheet
    for (i = 0; i < 7; i++) {
      var gx = rand() * w, gy = rand() * h, gr = (0.25 + rand() * 0.4) * Math.max(w, h);
      var grd = g.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grd.addColorStop(0, 'rgba(150,130,100,' + (0.02 + rand() * 0.02) + ')');
      grd.addColorStop(1, 'rgba(150,130,100,0)');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
    }
    return c;
  }

  function makeWash(sc, w, h, S, cx, cy, seed) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    var rand = rng(seed * 13 + 3);
    var offX = 0.018 * S, offY = 0.022 * S;
    for (var pass = 0; pass < 4; pass++) {
      g.beginPath();
      var sh = 0.93 + pass * 0.012;
      for (var k = 0; k < sc.M; k += 4) {
        var j = (sc.noise3(k * 0.02 + pass * 9) - 0.5) * 0.02;
        var x = cx + offX + (sc.X[k] * (sh + j)) * S, y = cy + offY + (sc.Y[k] * (sh + j)) * S;
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.fillStyle = 'rgba(' + COLORS.sage + ',' + (pass === 0 ? 0.13 : 0.045) + ')';
      g.fill();
    }
    // the wash pools on one side and fades out across the form, like a single brush load
    g.globalCompositeOperation = 'destination-in';
    var px = cx + 0.26 * S, py = cy + 0.30 * S;
    var grd = g.createRadialGradient(px, py, 0.05 * S, px, py, 0.95 * S);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(0.35, 'rgba(0,0,0,0.7)');
    grd.addColorStop(0.7, 'rgba(0,0,0,0.15)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    // pigment granulation
    var img = g.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] === 0) continue;
      d[i * 4 + 3] = Math.max(0, d[i * 4 + 3] * (0.55 + rand() * 0.75));
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var seed = opts.seed || parseInt(el.getAttribute('data-seed') || '19', 10);
    var sc = buildScene(seed);
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var W = 0, H = 0, dpr = 1, S = 1, CX = 0, CY = 0, AX = 1, paper = null, wash = null;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var visible = true, raf = 0, t0 = performance.now();
    var fixedPhase = opts.phase;

    function resize() {
      var r = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      S = Math.min(W, H) * 0.44; CX = W / 2; CY = H / 2;
      AX = clamp((W / H) * 0.92, 1, 3);
      paper = makePaper(W, H, dpr, seed);
      wash = makeWash(sc, W, H, S, CX, CY, seed);
      if (reduce.matches || fixedPhase != null) draw(fixedPhase != null ? fixedPhase : STILL_PHASE);
    }

    function draw(p) {
      var mx = mouse.x, my = mouse.y;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(paper, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      function tp(x, y) { return [CX + x * S, CY + y * S]; }

      // specks
      sc.specks.forEach(function (s) {
        ctx.fillStyle = 'rgba(' + COLORS.ink + ',' + s.a + ')';
        ctx.beginPath(); ctx.arc(CX + s.x * AX * S, CY + s.y * S, s.r * S, 0, TAU); ctx.fill();
      });

      // sage wash
      var wa = smooth(0.58, 0.68, p) * (1 - smooth(0.78, 0.86, p));
      if (wa > 0.001) {
        ctx.globalAlpha = wa;
        ctx.drawImage(wash, mx * 0.004 * S, my * 0.004 * S);
        ctx.globalAlpha = 1;
      }

      var poses = sc.frags.map(function (f) { return fragmentPose(sc, f, p, mx, my, AX); });
      function fragCenter(i) { return tp(poses[i].x, poses[i].y); }

      // threads
      sc.edges.forEach(function (e, ei) {
        var grow = ease(smooth(e.t0, e.t0 + 0.09, p));
        if (grow <= 0) return;
        var fade = e.chord ? (1 - smooth(0.77, 0.84, p)) : (1 - smooth(0.44, 0.56, p));
        if (fade <= 0) return;
        var A = fragCenter(e.a), B = fragCenter(e.b);
        var dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var bend = e.chord ? e.bend * 0.45 : e.bend;
        var qx = (A[0] + B[0]) / 2 + nx * bend * len * 0.5, qy = (A[1] + B[1]) / 2 + ny * bend * len * 0.5;
        var steps = 40, lim = Math.max(1, Math.round(steps * grow));
        ctx.beginPath();
        for (var k = 0; k <= lim; k++) {
          var t = k / steps, u = 1 - t;
          var x = u * u * A[0] + 2 * u * t * qx + t * t * B[0];
          var y = u * u * A[1] + 2 * u * t * qy + t * t * B[1];
          var wob = (sc.noise3(ei * 7.3 + t * 5) - 0.5) * S * 0.006;
          x += nx * wob; y += ny * wob;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineWidth = Math.max(0.6, S * (e.chord ? 0.0034 : 0.0026));
        ctx.strokeStyle = 'rgba(' + COLORS.ink + ',' + (0.55 * fade) + ')';
        ctx.stroke();
      });

      // contour: docked fragments merged with filled gaps
      var lineW = S * 0.012;
      var docked = poses.map(function (q) { return q.d >= 0.999; });
      var segs = [];
      sc.gaps.forEach(function (g) {
        var amt = gapAmount(g, p);
        if (amt <= 0 || !docked[g.f0] || !docked[g.f1]) return;
        var half = (g.b - g.a) * amt / 2;
        if (amt >= 0.999) segs.push([g.a, g.b]);
        else { segs.push([g.a, g.a + half]); segs.push([g.b - half, g.b]); }
      });
      sc.frags.forEach(function (f, i) {
        if (docked[i] && i !== sc.vermilion) segs.push([f.a, f.b]);
      });
      // merge touching intervals on the loop
      segs = segs.map(function (s) { var a = ((s[0] % 1) + 1) % 1; return [a, a + (s[1] - s[0])]; })
        .sort(function (p1, q1) { return p1[0] - q1[0]; });
      var merged = [];
      segs.forEach(function (s) {
        var last = merged[merged.length - 1];
        if (last && s[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], s[1]); else merged.push([s[0], s[1]]);
      });
      if (merged.length > 1) {
        var first = merged[0], lastM = merged[merged.length - 1];
        if (lastM[1] >= first[0] + 1 - 1e-6) { lastM[1] = Math.max(lastM[1], first[1] + 1); merged.shift(); }
      }
      var shift = function (x, y) { return tp(x + mx * 0.004, y + my * 0.004); };
      merged.forEach(function (s) {
        var full = s[1] - s[0] >= 0.999;
        var sl = contourSlice(sc, s[0], full ? s[0] + 1 : s[1], shift);
        brush(ctx, sl.pts, sl.sv, lineW, COLORS.ink, 0.8, sc, !full, !full, 0);
        // misregistered second pass, like a print pulled twice
        var sl2 = contourSlice(sc, s[0], full ? s[0] + 1 : s[1], function (x, y) { return tp(x + mx * 0.004 + 0.006, y + my * 0.004 + 0.004); });
        brush(ctx, sl2.pts, sl2.sv, lineW * 0.35, COLORS.ink, 0.22, sc, !full, !full, 3.7);
      });

      // loose (or vermilion) fragments drawn on their own
      sc.frags.forEach(function (f, i) {
        if (docked[i] && i !== sc.vermilion) return;
        var q = poses[i], cr = Math.cos(q.rot), sr = Math.sin(q.rot);
        var tf = function (x, y) {
          var rx = x - f.hx, ry = y - f.hy;
          return tp(q.x + rx * cr - ry * sr, q.y + rx * sr + ry * cr);
        };
        var sl = contourSlice(sc, f.a, f.b, tf);
        var isV = i === sc.vermilion;
        brush(ctx, sl.pts, sl.sv, lineW * (isV ? 1.15 : 1), isV ? COLORS.vermilion : COLORS.ink, isV ? 0.9 : 0.86, sc, true, true, 0);
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (!visible || reduce.matches || fixedPhase != null) return;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      var p = (((now - t0) % LOOP_MS) + LOOP_MS) % LOOP_MS / LOOP_MS;
      draw(p);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && fixedPhase == null && !reduce.matches) raf = requestAnimationFrame(frame); }

    if (finePointer) {
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        mouse.tx = clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        mouse.ty = clamp(((ev.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      });
      el.addEventListener('pointerleave', function () { mouse.tx = 0; mouse.ty = 0; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    var onReduce = function () { if (reduce.matches) draw(STILL_PHASE); else start(); };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);
    resize();
    start();
    return { draw: draw, setPhase: function (p) { fixedPhase = p; draw(p); } };
  }

  window.HeroArt = { mount: mount, LOOP_MS: LOOP_MS };
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-art]'), function (el) {
      if (!el.__heroArt) el.__heroArt = mount(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
