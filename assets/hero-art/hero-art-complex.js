/*
 * Hero art (complex): 「調べて、確かめて、仕組みにする」
 * Many ink fragments are linked by spreading threads. Some links are let go
 * and their fragments drift aside; the rest gather into one form with an inner
 * structure of two lines that divide it into three chambers. 20 s seamless loop.
 *
 * Usage: <div class="hero-art" data-hero-art-complex></div> + this script.
 * Or: HeroArtComplex.mount(element, { seed: 8 })
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var LOOP_MS = 20000;
  var STILL_PHASE = 0.74;

  var COLORS = {
    paper: [242, 236, 224],
    ink: '42, 38, 34',
    vermilion: '178, 84, 60',
    sage: '138, 154, 128'
  };

  // ---------- helpers ----------
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

  // ---------- paths ----------
  function samplePath(M, closed, fn) {
    var X = new Float32Array(M), Y = new Float32Array(M);
    for (var k = 0; k < M; k++) {
      var q = fn(closed ? k / M : k / (M - 1));
      X[k] = q[0]; Y[k] = q[1];
    }
    return { X: X, Y: Y, M: M, closed: closed };
  }
  function pathPoint(P, s) {
    var f, k, t, i0, i1;
    if (P.closed) {
      f = s * P.M; k = Math.floor(f); t = f - k;
      i0 = ((k % P.M) + P.M) % P.M; i1 = (i0 + 1) % P.M;
    } else {
      s = clamp(s, 0, 1); f = s * (P.M - 1); k = Math.min(Math.floor(f), P.M - 2); t = f - k;
      i0 = k; i1 = k + 1;
    }
    return [lerp(P.X[i0], P.X[i1], t), lerp(P.Y[i0], P.Y[i1], t)];
  }
  function cubic(p0, p1, p2, p3) {
    return function (t) {
      var u = 1 - t;
      return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
              u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
    };
  }

  // ---------- scene ----------
  function buildScene(seed) {
    var rand = rng(seed);
    var ph = [rand() * TAU, rand() * TAU, rand() * TAU];
    var R = 0.6;
    var outer = samplePath(1200, true, function (s) {
      var th = s * TAU;
      var r = R * (1 + 0.14 * Math.cos(2 * th + ph[0]) + 0.07 * Math.sin(3 * th + ph[1]) + 0.03 * Math.cos(5 * th + ph[2]));
      return [0.02 + r * Math.cos(th) * 1.12, r * Math.sin(th) * 0.92];
    });
    // inner structure: one line across the form, a second branching from the contour into the first
    var sA0 = 0.06 + rand() * 0.04, sA1 = sA0 + 0.42 + rand() * 0.06;
    var a0 = pathPoint(outer, sA0), a1 = pathPoint(outer, sA1);
    var mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2;
    var dx = a1[0] - a0[0], dy = a1[1] - a0[1];
    var bow = 0.16 + rand() * 0.06;
    var lineA = samplePath(320, false, cubic(a0,
      [lerp(a0[0], mx, 0.6) - dy * bow, lerp(a0[1], my, 0.6) + dx * bow],
      [lerp(a1[0], mx, 0.6) + dy * bow * 0.6, lerp(a1[1], my, 0.6) - dx * bow * 0.6], a1));
    var tJoin = 0.5 + (rand() - 0.5) * 0.12;
    var sB0 = sA1 + 0.18 + rand() * 0.06;
    var b0 = pathPoint(outer, sB0), b1 = pathPoint(lineA, tJoin);
    // the second line meets the first along its direction, like a vein joining a midrib
    var tq0 = pathPoint(lineA, tJoin - 0.02), tq1 = pathPoint(lineA, tJoin + 0.02);
    var tdx = tq1[0] - tq0[0], tdy = tq1[1] - tq0[1], tlen = Math.hypot(tdx, tdy) || 1;
    tdx /= tlen; tdy /= tlen;
    var toB0 = (b0[0] - b1[0]) * tdx + (b0[1] - b1[1]) * tdy;
    var dir = toB0 > 0 ? 1 : -1;
    var lineB = samplePath(240, false, cubic(b0,
      [lerp(b0[0], b1[0], 0.3) + (rand() - 0.5) * 0.08, lerp(b0[1], b1[1], 0.3) + (rand() - 0.5) * 0.08],
      [b1[0] + tdx * dir * 0.22, b1[1] + tdy * dir * 0.22], b1));
    var paths = [outer, lineA, lineB];

    // fragments that belong to the final form
    var frags = [];
    function addPieces(pi, count, lenMin, lenMax, coverEnds) {
      for (var i = 0; i < count; i++) {
        var c = (i + 0.5 + (rand() - 0.5) * 0.3) / count;
        var len = lenMin + rand() * (lenMax - lenMin);
        var a = c - len / 2, b = c + len / 2;
        if (coverEnds && i === 0) a = 0;
        if (coverEnds && i === count - 1) b = 1;
        var h = pathPoint(paths[pi], (a + b) / 2);
        frags.push({ path: pi, a: a, b: b, hx: h[0], hy: h[1], real: true });
      }
    }
    addPieces(0, 16, 0.026, 0.05, false);
    addPieces(1, 4, 0.12, 0.17, true);
    addPieces(2, 3, 0.14, 0.2, true);
    var nReal = frags.length;
    // fragments that are looked at, then let go
    for (var d = 0; d < 14; d++) {
      var rr = 0.12 + rand() * 0.3, sweep = 0.05 + rand() * 0.09, a0d = rand() * TAU;
      var pts = [];
      for (var k = 0; k <= 16; k++) {
        var an = a0d + (k / 16 - 0.5) * sweep / rr;
        pts.push(Math.cos(an) * rr, Math.sin(an) * rr);
      }
      var cxd = Math.cos(a0d) * rr, cyd = Math.sin(a0d) * rr;
      for (k = 0; k < pts.length; k += 2) { pts[k] -= cxd; pts[k + 1] -= cyd; }
      frags.push({ real: false, local: pts, seedS: rand() * 10 });
    }
    var N = frags.length;
    frags.forEach(function (f) {
      f.rot = (rand() - 0.5) * 2.8; f.depth = 0.4 + rand() * 0.9; f.phase = rand() * TAU;
      f.bendIn = (rand() - 0.5) * 0.9; f.bendOut = (rand() - 0.5) * 0.9;
    });

    // scattered layout over the whole field
    var placed = [];
    for (var i = 0; i < N; i++) {
      var best = null, bestScore = -9;
      for (var t = 0; t < 300; t++) {
        var px = (rand() * 2 - 1) * 0.94, py = (rand() * 2 - 1) * 0.84;
        var dmin = 9;
        for (var j = 0; j < placed.length; j++) {
          var ddx = px - placed[j][0], ddy = py - placed[j][1];
          dmin = Math.min(dmin, Math.sqrt(ddx * ddx + ddy * ddy));
        }
        var score = Math.min(dmin, 0.3) - Math.abs(Math.sqrt(px * px + py * py) - 0.6) * 0.12;
        if (score > bestScore) { bestScore = score; best = [px, py]; }
      }
      placed.push(best);
      frags[i].sx = best[0]; frags[i].sy = best[1];
    }

    // threads: spanning tree plus a few short extras
    var edges = [], inTree = [0], used = {};
    function key(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
    function dist(a, b) { var ex = frags[a].sx - frags[b].sx, ey = frags[a].sy - frags[b].sy; return Math.sqrt(ex * ex + ey * ey); }
    var inSet = new Array(N).fill(false); inSet[0] = true;
    while (inTree.length < N) {
      var bA = -1, bB = -1, bd = 9;
      for (i = 0; i < inTree.length; i++) for (j = 0; j < N; j++) {
        if (inSet[j]) continue;
        var dd = dist(inTree[i], j);
        if (dd < bd) { bd = dd; bA = inTree[i]; bB = j; }
      }
      inTree.push(bB); inSet[bB] = true; edges.push({ a: bA, b: bB }); used[key(bA, bB)] = 1;
    }
    var extra = [];
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) if (!used[key(i, j)]) extra.push([dist(i, j), i, j]);
    extra.sort(function (p, q) { return p[0] - q[0]; });
    for (i = 0; i < 5 && i < extra.length; i++) edges.push({ a: extra[i][1], b: extra[i][2] });

    // the inquiry spreads from one contour fragment
    var origin = Math.floor(rand() * 16);
    var depth = new Array(N).fill(-1); depth[origin] = 0;
    var queue = [origin], order = [origin];
    while (queue.length) {
      var n = queue.shift();
      edges.forEach(function (e) {
        var o = e.a === n ? e.b : e.b === n ? e.a : -1;
        if (o >= 0 && depth[o] < 0) { depth[o] = depth[n] + 1; queue.push(o); order.push(o); }
      });
    }
    var maxDepth = Math.max.apply(null, depth);
    var step = 0.24 / Math.max(1, maxDepth);
    edges.forEach(function (e) {
      if (depth[e.b] < depth[e.a]) { var sw = e.a; e.a = e.b; e.b = sw; }
      e.t0 = 0.04 + depth[e.a] * step + rand() * 0.01;
      e.bend = (rand() - 0.5) * 0.5;
      e.rejected = !frags[e.a].real || !frags[e.b].real;
      e.rejectAt = 0.34 + rand() * 0.06;
      if (!e.rejected && frags[e.a].path === 0 && frags[e.b].path === 0) {
        var hx = frags[e.a].hx - frags[e.b].hx, hy = frags[e.a].hy - frags[e.b].hy;
        e.chordLen = Math.sqrt(hx * hx + hy * hy);
      } else e.chordLen = 0;
    });
    edges.slice().sort(function (p, q) { return q.chordLen - p.chordLen; })
      .slice(0, 2).forEach(function (e) { if (e.chordLen > 0) e.chord = true; });

    var realOrder = order.filter(function (fi) { return frags[fi].real; });
    realOrder.forEach(function (fi, o) {
      frags[fi].dockStart = 0.3 + o * 0.006;
      frags[fi].dockEnd = frags[fi].dockStart + 0.16;
    });

    // gaps along each path
    var gaps = [];
    paths.forEach(function (P, pi) {
      var idx = [];
      for (var q = 0; q < nReal; q++) if (frags[q].path === pi) idx.push(q);
      idx.sort(function (p1, q1) { return frags[p1].a - frags[q1].a; });
      var cnt = P.closed ? idx.length : idx.length - 1;
      for (var g = 0; g < cnt; g++) {
        var f0 = idx[g], f1 = idx[(g + 1) % idx.length];
        var ga = frags[f0].b, gb = frags[f1].a;
        if (P.closed && gb < ga) gb += 1;
        gaps.push({ path: pi, f0: f0, f1: f1, a: ga, b: gb, order: g,
          fillStart: Math.max(frags[f0].dockEnd, frags[f1].dockEnd) + (pi === 0 ? 0 : 0.03) });
      }
    });
    var originPos = 0;
    gaps.forEach(function (g) { if (g.path === 0 && (g.f0 === origin || g.f1 === origin) && !originPos) originPos = g.order; });
    gaps.forEach(function (g) {
      if (g.path === 0) g.retract = 0.785 + ((g.order - originPos + 16) % 16) * 0.004;
      else g.retract = 0.77 + g.order * 0.004 + (g.path - 1) * 0.006;
    });
    for (i = 0; i < nReal; i++) {
      var gl = gaps.filter(function (g) { return g.f0 === i || g.f1 === i; });
      var last = 0;
      gl.forEach(function (g) { last = Math.max(last, g.retract + 0.04); });
      frags[i].undockStart = last + 0.01;
      frags[i].undockEnd = frags[i].undockStart + 0.13;
    }

    // chamber for the wash: the upper side of line A, closed by the contour
    var cell = [];
    var steps = 160;
    for (i = 0; i <= steps; i++) cell.push(pathPoint(outer, lerp(sA1, sA0 + 1, i / steps)));
    for (i = 0; i <= steps; i++) cell.push(pathPoint(lineA, i / steps));

    var specks = [];
    for (i = 0; i < 22; i++) {
      var ang = rand() * TAU, rad = 0.7 + rand() * 0.3;
      specks.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad * 0.92, r: 0.002 + rand() * 0.0035, a: 0.15 + rand() * 0.25 });
    }

    return { paths: paths, frags: frags, nReal: nReal, edges: edges, gaps: gaps, specks: specks, cell: cell,
      origin: origin, join: b1, noise: noise1(rand), noise2: noise1(rand), noise3: noise1(rand) };
  }

  // ---------- state ----------
  function dockAmount(f, p) {
    if (p >= f.undockStart) return 1 - ease(smooth(f.undockStart, f.undockEnd, p));
    return ease(smooth(f.dockStart, f.dockEnd, p));
  }
  function gapAmount(g, p) {
    return smooth(g.fillStart, g.fillStart + 0.06, p) * (1 - smooth(g.retract, g.retract + 0.04, p));
  }
  function setAside(p) { return smooth(0.36, 0.5, p) * (1 - smooth(0.86, 0.98, p)); }

  function pose(f, p, mx, my, ax) {
    var sx = f.sx * ax, sy = f.sy, x, y, d = 0;
    if (f.real) {
      d = dockAmount(f, p);
      var bend = p < f.undockStart ? f.bendIn : f.bendOut;
      var ex = f.hx - sx, ey = f.hy - sy;
      var cxp = (sx + f.hx) / 2 - ey * bend, cyp = (sy + f.hy) / 2 + ex * bend;
      var u = 1 - d;
      x = u * u * sx + 2 * u * d * cxp + d * d * f.hx;
      y = u * u * sy + 2 * u * d * cyp + d * d * f.hy;
    } else {
      // let go: drift a little outward
      var a = setAside(p), len = Math.sqrt(sx * sx + sy * sy) || 1;
      x = sx + (sx / len) * 0.07 * a;
      y = sy + (sy / len) * 0.05 * a;
    }
    var loose = 1 - d;
    x += 0.007 * Math.sin(TAU * p * 2 + f.phase) * loose + mx * 0.014 * f.depth * loose + mx * 0.004 * d;
    y += 0.007 * Math.cos(TAU * p * 3 + f.phase) * loose + my * 0.014 * f.depth * loose + my * 0.004 * d;
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
    ctx.lineWidth = w0 * 0.9;
    ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.08) + ')';
    ctx.stroke();
    ctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')';
    ctx.fill();
    ctx.lineWidth = Math.max(0.5, w0 * 0.18);
    ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.35) + ')';
    ctx.beginPath();
    var on = false;
    for (i = 0; i < n; i++) {
      var vis = sc.noise2((svals[i] + seedOff) * 90) > 0.58;
      var ox = (L[i * 2] - pts[i * 2]) * 1.35, oy = (L[i * 2 + 1] - pts[i * 2 + 1]) * 1.35;
      if (vis) { if (!on) ctx.moveTo(pts[i * 2] + ox, pts[i * 2 + 1] + oy); else ctx.lineTo(pts[i * 2] + ox, pts[i * 2 + 1] + oy); }
      on = vis;
    }
    ctx.stroke();
  }

  function slice(P, a, b, tf, sOff) {
    var M = P.closed ? P.M : P.M - 1, pts = [], sv = [];
    if (!P.closed) { a = clamp(a, 0, 1); b = clamp(b, 0, 1); }
    function push(s) {
      var q = pathPoint(P, s), r = tf(q[0], q[1]);
      pts.push(r[0], r[1]); sv.push((((s % 1) + 1) % 1) + sOff);
    }
    push(a);
    for (var k = Math.ceil(a * M); k <= Math.floor(b * M); k++) push(k / M);
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
    g.lineCap = 'round';
    for (i = 0; i < Math.round(w * h / 9000); i++) {
      var x = rand() * w, y = rand() * h, a = rand() * TAU, l = (6 + rand() * 22) * dpr;
      g.strokeStyle = 'rgba(120,104,80,' + (0.025 + rand() * 0.04) + ')';
      g.lineWidth = (0.4 + rand() * 0.6) * dpr;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
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
    var offX = 0.014 * S, offY = 0.018 * S;
    var mxp = 0, myp = 0;
    sc.cell.forEach(function (q) { mxp += q[0]; myp += q[1]; });
    mxp /= sc.cell.length; myp /= sc.cell.length;
    for (var pass = 0; pass < 4; pass++) {
      g.beginPath();
      var sh = 0.95 + pass * 0.01;
      sc.cell.forEach(function (q, k) {
        var x = cx + offX + (mxp + (q[0] - mxp) * sh) * S, y = cy + offY + (myp + (q[1] - myp) * sh) * S;
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.closePath();
      g.fillStyle = 'rgba(' + COLORS.sage + ',' + (pass === 0 ? 0.15 : 0.05) + ')';
      g.fill();
    }
    g.globalCompositeOperation = 'destination-in';
    var px = cx + mxp * S, py = cy + myp * S;
    var grd = g.createRadialGradient(px, py, 0.04 * S, px, py, 0.7 * S);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(0.45, 'rgba(0,0,0,0.7)');
    grd.addColorStop(1, 'rgba(0,0,0,0.05)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    var img = g.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] === 0) continue;
      d[i * 4 + 3] = Math.max(0, d[i * 4 + 3] * (0.55 + rand() * 0.75));
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function mergeIntervals(segs, closed) {
    segs = segs.map(function (s) {
      if (!closed) return [s[0], s[1]];
      var a = ((s[0] % 1) + 1) % 1; return [a, a + (s[1] - s[0])];
    }).sort(function (p, q) { return p[0] - q[0]; });
    var out = [];
    segs.forEach(function (s) {
      var last = out[out.length - 1];
      if (last && s[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], s[1]); else out.push([s[0], s[1]]);
    });
    if (closed && out.length > 1) {
      var first = out[0], lastM = out[out.length - 1];
      if (lastM[1] >= first[0] + 1 - 1e-6) { lastM[1] = Math.max(lastM[1], first[1] + 1); out.shift(); }
    }
    return out;
  }

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var seed = opts.seed || parseInt(el.getAttribute('data-seed') || '8', 10);
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
      var lineW = S * 0.011;

      sc.specks.forEach(function (s) {
        ctx.fillStyle = 'rgba(' + COLORS.ink + ',' + s.a + ')';
        ctx.beginPath(); ctx.arc(CX + s.x * AX * S, CY + s.y * S, s.r * S, 0, TAU); ctx.fill();
      });

      var wa = smooth(0.62, 0.71, p) * (1 - smooth(0.8, 0.88, p));
      if (wa > 0.001) {
        ctx.globalAlpha = wa;
        ctx.drawImage(wash, mx * 0.004 * S, my * 0.004 * S);
        ctx.globalAlpha = 1;
      }

      var poses = sc.frags.map(function (f) { return pose(f, p, mx, my, AX); });
      var aside = setAside(p);

      // threads
      sc.edges.forEach(function (e, ei) {
        var grow = ease(smooth(e.t0, e.t0 + 0.07, p));
        if (grow <= 0) return;
        var fade, from = 0;
        if (e.rejected) {
          // the link is let go: it withdraws back toward where it started
          var r = ease(smooth(e.rejectAt, e.rejectAt + 0.06, p));
          from = 0; grow = grow * (1 - r);
          fade = 1 - r * 0.6;
        } else fade = e.chord ? (1 - smooth(0.78, 0.84, p)) : (1 - smooth(0.5, 0.6, p));
        if (fade <= 0 || grow <= 0) return;
        var A = tp(poses[e.a].x, poses[e.a].y), B = tp(poses[e.b].x, poses[e.b].y);
        var dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var bend = e.chord ? e.bend * 0.45 : e.bend;
        var qx = (A[0] + B[0]) / 2 + nx * bend * len * 0.5, qy = (A[1] + B[1]) / 2 + ny * bend * len * 0.5;
        var steps = 40, lim = Math.max(1, Math.round(steps * grow));
        ctx.beginPath();
        for (var k = from; k <= lim; k++) {
          var t = k / steps, u = 1 - t;
          var x = u * u * A[0] + 2 * u * t * qx + t * t * B[0];
          var y = u * u * A[1] + 2 * u * t * qy + t * t * B[1];
          var wob = (sc.noise3(ei * 7.3 + t * 5) - 0.5) * S * 0.006;
          x += nx * wob; y += ny * wob;
          if (k === from) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineWidth = Math.max(0.6, S * (e.chord ? 0.0032 : 0.0024));
        ctx.strokeStyle = 'rgba(' + COLORS.ink + ',' + (0.5 * fade) + ')';
        ctx.stroke();
      });

      // the form: merged docked pieces and filled gaps, per path
      var docked = poses.map(function (q, i) { return sc.frags[i].real && q.d >= 0.999; });
      var shift = function (x, y) { return tp(x + mx * 0.004, y + my * 0.004); };
      sc.paths.forEach(function (P, pi) {
        var segs = [];
        sc.gaps.forEach(function (g) {
          if (g.path !== pi) return;
          var amt = gapAmount(g, p);
          if (amt <= 0 || !docked[g.f0] || !docked[g.f1]) return;
          var half = (g.b - g.a) * amt / 2;
          if (amt >= 0.999) segs.push([g.a, g.b]);
          else { segs.push([g.a, g.a + half]); segs.push([g.b - half, g.b]); }
        });
        for (var i = 0; i < sc.nReal; i++) {
          var f = sc.frags[i];
          if (f.path === pi && docked[i] && i !== sc.origin) segs.push([f.a, f.b]);
        }
        var w = pi === 0 ? lineW : lineW * 0.72;
        mergeIntervals(segs, P.closed).forEach(function (s) {
          var full = P.closed && s[1] - s[0] >= 0.999;
          var openEndA = !(!P.closed && s[0] <= 1e-6), openEndB = !(!P.closed && s[1] >= 1 - 1e-6);
          var sl = slice(P, s[0], full ? s[0] + 1 : s[1], shift, pi * 3.1);
          brush(ctx, sl.pts, sl.sv, w, COLORS.ink, 0.8, sc, !full && openEndA, !full && openEndB, 0);
          var sl2 = slice(P, s[0], full ? s[0] + 1 : s[1], function (x, y) { return tp(x + mx * 0.004 + 0.006, y + my * 0.004 + 0.004); }, pi * 3.1);
          brush(ctx, sl2.pts, sl2.sv, w * 0.35, COLORS.ink, 0.2, sc, !full && openEndA, !full && openEndB, 3.7);
        });
      });

      // loose pieces
      sc.frags.forEach(function (f, i) {
        if (docked[i] && i !== sc.origin) return;
        var q = poses[i], cr = Math.cos(q.rot), sr = Math.sin(q.rot);
        if (f.real) {
          var tf = function (x, y) {
            var rx = x - f.hx, ry = y - f.hy;
            return tp(q.x + rx * cr - ry * sr, q.y + rx * sr + ry * cr);
          };
          var sl = slice(sc.paths[f.path], f.a, f.b, tf, f.path * 3.1);
          var isO = i === sc.origin;
          var w = (f.path === 0 ? lineW : lineW * 0.72) * (isO ? 1.15 : 1);
          brush(ctx, sl.pts, sl.sv, w, isO ? COLORS.vermilion : COLORS.ink, isO ? 0.9 : 0.82, sc, true, true, 0);
        } else {
          var pts = [], sv = [];
          for (var k = 0; k < f.local.length; k += 2) {
            var lx = f.local[k], ly = f.local[k + 1];
            var r = tp(q.x + lx * cr - ly * sr, q.y + lx * sr + ly * cr);
            pts.push(r[0], r[1]); sv.push(f.seedS + k * 0.01);
          }
          brush(ctx, pts, sv, lineW * 0.85, COLORS.ink, 0.82 * (1 - aside * 0.72), sc, true, true, 0);
        }
      });

      // a vermilion mark where the inner lines meet
      var ma = smooth(0.66, 0.7, p) * (1 - smooth(0.77, 0.8, p));
      if (ma > 0.001) {
        var J = shift(sc.join[0], sc.join[1]), rr = S * 0.026 * (0.6 + 0.4 * ma);
        ctx.fillStyle = 'rgba(' + COLORS.vermilion + ',' + (0.85 * ma) + ')';
        ctx.beginPath();
        for (var k2 = 0; k2 <= 24; k2++) {
          var an = k2 / 24 * TAU, wr = rr * (0.86 + 0.28 * sc.noise3(k2 * 0.7 + 11));
          var px2 = J[0] + Math.cos(an) * wr, py2 = J[1] + Math.sin(an) * wr;
          if (k2 === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.fill();
      }
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

  window.HeroArtComplex = { mount: mount, LOOP_MS: LOOP_MS };
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-art-complex]'), function (el) {
      if (!el.__heroArt) el.__heroArt = mount(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
