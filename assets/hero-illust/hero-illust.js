/*
 * Hero illustration: "A curious mind turning scattered information into clarity."
 * Ink lines start from scattered points, gather through a knot over a terracotta
 * plane, and resolve into an ordered fan. Over a 14 s loop a few lines let go,
 * bend and reconnect to new places while the paper planes tilt and settle; then
 * everything resolves again. Frame 0 is the resolved composition.
 *
 * Vector: everything is SVG. HeroIllust.svgString(phase) returns a standalone
 * SVG for any moment (hero-illust.svg is phase 0, used for reduced motion).
 *
 * Usage: <div class="hero-illust" data-hero-illust></div> + this script.
 */
(function (root) {
  'use strict';

  var VW = 1000, VH = 900;
  var LOOP_MS = 14000;
  var C = { bg: '#F5F2EA', ink: '#252A27', terra: '#C46D51', sage: '#7D9180', paper: '#ECE6D8', paperShade: '#E2DACA' };

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
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function f(v) { return (Math.round(v * 10) / 10).toString(); }

  var rand = rng(23);
  var noiseTab = [];
  for (var q = 0; q < 512; q++) noiseTab.push(rand());
  function noise(x) {
    var i = Math.floor(x), t = x - i, u = t * t * (3 - 2 * t);
    return lerp(noiseTab[i & 511], noiseTab[(i + 1) & 511], u) - 0.5;
  }

  // ---------- the scene ----------
  // authored on a wider layout, then drawn at 80 % around the centre so the edges stay open
  var SCALE = 0.8, OX = 520, OY = 455;
  function S(x, y) { return [OX + (x - 500) * SCALE, OY + (y - 450) * SCALE]; }
  function SP(pt) { return S(pt[0], pt[1]); }
  // Ink lines: two cubic segments, P0 C1 C2 P3 | (C4 mirrors C2) C5 P6.
  // "a" is the resolved state, "b" the moment of searching.
  var KNOT = [600, 452]; // authored coordinates; S() maps them
  var N = 9;
  var lines = [];
  var ends = [];
  for (var i = 0; i < N; i++) ends.push([862 + (i % 2) * 10, 318 + i * 34 + (i > 4 ? 8 : 0)]);
  for (i = 0; i < N; i++) {
    var sx = 110 + rand() * 260, sy = 150 + i * 62 + (rand() - 0.5) * 40;
    var k = i - (N - 1) / 2;
    var p3 = [KNOT[0] + k * 2.5, KNOT[1] + k * 6.5];
    var a = {
      p0: [sx, sy],
      c1: [sx + 120 + rand() * 60, sy + (rand() - 0.5) * 70],
      c2: [p3[0] - 110, p3[1] - k * 5 + (rand() - 0.5) * 16],
      p3: p3,
      c5: [ends[i][0] - 70, ends[i][1] + (rand() - 0.5) * 10],
      p6: ends[i]
    };
    // searching: the start sweeps wider, the knot loosens, some ends move to a new slot
    var swapTo = { 2: 5, 5: 2, 7: 8, 8: 7 }[i];
    var endB = swapTo != null ? ends[swapTo] : ends[i];
    var b = {
      p0: [sx + (rand() - 0.5) * 30, sy + (rand() - 0.5) * 30],
      c1: [sx + 90 + rand() * 120, sy + (rand() < 0.5 ? -1 : 1) * (60 + rand() * 70)],
      c2: [p3[0] - 140, p3[1] + k * 9 + (rand() - 0.5) * 50],
      p3: [p3[0] + (rand() - 0.5) * 30, p3[1] + k * 13],
      c5: [endB[0] - 110, endB[1] + (rand() - 0.5) * 60],
      p6: endB
    };
    [a, b].forEach(function (o) { for (var key in o) o[key] = SP(o[key]); });
    lines.push({
      a: a, b: b, swap: swapTo != null,
      color: i === 4 ? C.terra : C.ink,
      width: i === 4 ? 2.2 : 1.35 + rand() * 0.6,
      seed: rand() * 100,
      lag: Math.abs(k) * 0.012 + rand() * 0.01
    });
  }

  // paper planes: irregular quadrilaterals, rotated about their own centres
  var planes = [
    { id: 'shade', pts: [[-190, -150], [176, -166], [196, 140], [-172, 158]], cx: 586, cy: 486, rot: -0.09, tilt: 0.035, fill: C.paperShade, stroke: null, lag: 0.05 },
    { id: 'sheet', pts: [[-190, -150], [176, -166], [196, 140], [-172, 158]], cx: 570, cy: 468, rot: -0.105, tilt: 0.05, fill: C.paper, stroke: C.ink, lag: 0.03 },
    { id: 'terra', pts: [[-78, -58], [70, -72], [86, 46], [-6, 74], [-84, 40]], cx: 642, cy: 424, rot: 0.14, tilt: -0.075, fill: C.terra, stroke: null, lag: 0 },
    { id: 'chip', pts: [[-14, -9], [17, -12], [12, 8], [-9, 13]], cx: 772, cy: 664, rot: 0.5, tilt: 0.12, fill: C.ink, stroke: null, lag: 0.07 }
  ];
  planes.forEach(function (pl) {
    var c = S(pl.cx, pl.cy); pl.cx = c[0]; pl.cy = c[1];
    pl.pts = pl.pts.map(function (q) { return [q[0] * SCALE, q[1] * SCALE]; });
  });
  // a sage seed and a sage arc
  var sc0 = S(438, 618);
  var sage = { cx: sc0[0], cy: sc0[1], r: 24 * SCALE };

  // scattered marks near the line starts: fragments of information
  var marks = [];
  for (i = 0; i < 7; i++) {
    var mp = S(90 + rand() * 300, 120 + rand() * 640);
    marks.push({ x: mp[0], y: mp[1], a: rand() * Math.PI, l: (7 + rand() * 9) * SCALE });
  }

  // ---------- timeline ----------
  function searchAmount(p, lag) {
    // 0..1: resolved -> searching -> resolved, with a hold in between
    var up = ease(smooth(0.14 + lag, 0.36 + lag, p));
    var down = ease(smooth(0.6 + lag, 0.84 + lag, p));
    return up * (1 - down);
  }
  function settle(p, lag) {
    // planes follow the lines a little later and settle softly
    var up = ease(smooth(0.2 + lag, 0.44 + lag, p));
    var down = 1 - Math.pow(1 - smooth(0.64 + lag, 0.9 + lag, p), 3);
    return up * (1 - down);
  }
  function visibleFraction(line, p) {
    if (!line.swap) return 1;
    // the end lets go, then reaches its new slot; later it returns the same way
    var out1 = smooth(0.12, 0.22, p) * (1 - smooth(0.3, 0.42, p));
    var out2 = smooth(0.58, 0.66, p) * (1 - smooth(0.74, 0.86, p));
    return 1 - 0.5 * Math.max(out1, out2);
  }

  function lerpPt(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
  function cubic(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }

  function linePoints(line, p, mouse) {
    var m = searchAmount(p, line.lag);
    var A = line.a, B = line.b;
    var p0 = lerpPt(A.p0, B.p0, m), c1 = lerpPt(A.c1, B.c1, m), c2 = lerpPt(A.c2, B.c2, m), p3 = lerpPt(A.p3, B.p3, m);
    var c5 = lerpPt(A.c5, B.c5, m), p6 = lerpPt(A.p6, B.p6, m);
    var c4 = [2 * p3[0] - c2[0], 2 * p3[1] - c2[1]];
    var pts = [], n = 44;
    for (var s = 0; s <= 2 * n; s++) {
      var seg = s <= n ? 0 : 1, t = seg === 0 ? s / n : (s - n) / n;
      var q = seg === 0 ? cubic(p0, c1, c2, p3, t) : cubic(p3, c4, c5, p6, t);
      pts.push(q);
    }
    // hand-drawn waver: a slow sideways drift along the line
    var out = [];
    for (s = 0; s < pts.length; s++) {
      var a0 = pts[Math.max(0, s - 1)], a1 = pts[Math.min(pts.length - 1, s + 1)];
      var dx = a1[0] - a0[0], dy = a1[1] - a0[1], dl = Math.hypot(dx, dy) || 1;
      var w = noise(line.seed + s * 0.11) * 3.2 + noise(line.seed * 3 + s * 0.6) * 0.8;
      var x = pts[s][0] - dy / dl * w, y = pts[s][1] + dx / dl * w;
      if (mouse && mouse.amt > 0.001) {
        var mx = mouse.x - x, my = mouse.y - y, d2 = mx * mx + my * my;
        var pull = Math.exp(-d2 / (2 * 130 * 130)) * 0.075 * mouse.amt;
        x += mx * pull; y += my * pull;
      }
      out.push([x, y]);
    }
    return out;
  }
  function pathD(pts, frac) {
    var last = Math.max(1, Math.round((pts.length - 1) * frac));
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var s = 1; s <= last; s++) d += 'L' + f(pts[s][0]) + ' ' + f(pts[s][1]);
    return d;
  }
  function polyD(pl, rot) {
    var c = Math.cos(rot), s = Math.sin(rot);
    return pl.pts.map(function (q, k) {
      return (k ? 'L' : 'M') + f(pl.cx + q[0] * c - q[1] * s) + ' ' + f(pl.cy + q[0] * s + q[1] * c);
    }).join('') + 'Z';
  }

  // state of everything at phase p
  function frame(p, mouse) {
    return {
      planes: planes.map(function (pl) { return polyD(pl, pl.rot + pl.tilt * settle(p, pl.lag)); }),
      lines: lines.map(function (ln) {
        var pts = linePoints(ln, p, mouse);
        return { d: pathD(pts, visibleFraction(ln, p)), color: ln.color, width: ln.width, start: pts[0] };
      }),
      sageR: sage.r * (1 + 0.08 * settle(p, 0.08))
    };
  }

  // ---------- SVG markup ----------
  function svgString(p, opts) {
    opts = opts || {};
    var F = frame(p || 0, null);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + VW + ' ' + VH + '"' +
      (opts.attrs || '') + ' role="img" aria-label="Scattered ink lines gathering through a terracotta plane into an ordered fan">';
    if (opts.background !== false) s += '<rect width="' + VW + '" height="' + VH + '" fill="' + C.bg + '"/>';
    function planePath(k) {
      var pl = planes[k];
      return '<path data-plane="' + k + '" d="' + F.planes[k] + '" fill="' + pl.fill + '"' +
        (pl.stroke ? ' stroke="' + pl.stroke + '" stroke-opacity="0.55" stroke-width="1.1" stroke-linejoin="round"' : '') + '/>';
    }
    function lineGroup(under) {
      var g = '<g class="' + (under ? 'lines-under' : 'lines-over') + '" fill="none" stroke-linecap="round" stroke-linejoin="round">';
      F.lines.forEach(function (ln, k) {
        if ((k % 2 === 1) !== under) return;
        // a faint second pass slightly off register, then the line itself
        g += '<path data-ghost="' + k + '" d="' + ln.d + '" stroke="' + ln.color + '" stroke-width="0.6" stroke-opacity="0.3" transform="translate(1.6 1.3)"/>';
        g += '<path data-line="' + k + '" d="' + ln.d + '" stroke="' + ln.color + '" stroke-width="' + f(ln.width) + '"/>';
        g += '<circle data-dot="' + k + '" cx="' + f(ln.start[0]) + '" cy="' + f(ln.start[1]) + '" r="' + (k === 4 ? 3.6 : 2.6) + '" fill="' + ln.color + '" stroke="none"/>';
      });
      return g + '</g>';
    }
    // paper sheet, then the lines that pass under the terracotta plane, the plane, and the lines over it
    s += planePath(0) + planePath(1);
    s += '<g id="sage"><circle data-sage cx="' + f(sage.cx) + '" cy="' + f(sage.cy) + '" r="' + f(F.sageR) + '" fill="' + C.sage + '"/>' +
      '<path d="M' + f(sage.cx + 37) + ' ' + f(sage.cy + 5) + 'q 27 21 56 5" fill="none" stroke="' + C.sage + '" stroke-width="1.4" stroke-linecap="round"/></g>';
    s += '<g id="marks" stroke="' + C.ink + '" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.7">';
    marks.forEach(function (m) {
      s += '<path d="M' + f(m.x) + ' ' + f(m.y) + 'l' + f(Math.cos(m.a) * m.l) + ' ' + f(Math.sin(m.a) * m.l) + '"/>';
    });
    s += '</g>';
    s += lineGroup(true) + planePath(2) + lineGroup(false) + planePath(3);
    s += '</svg>';
    return s;
  }

  var GRAIN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + VW + ' ' + VH + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<filter id="hi-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/>' +
    '<feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0.09 0"/></filter>' +
    '<rect width="100%" height="100%" filter="url(#hi-grain)"/></svg>';

  // ---------- runtime ----------
  function mount(el) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    el.innerHTML = '<div class="hero-illust__art">' + svgString(0, { background: false, attrs: ' preserveAspectRatio="xMidYMid meet"' }) +
      '</div><div class="hero-illust__grain">' + GRAIN + '</div>';
    var svg = el.querySelector('.hero-illust__art svg');
    // index by number: the lines sit in two layers, so document order is not line order
    function byIndex(attr) {
      var out = [];
      Array.prototype.forEach.call(svg.querySelectorAll('[' + attr + ']'), function (n) { out[+n.getAttribute(attr)] = n; });
      return out;
    }
    var planeEls = byIndex('data-plane');
    var lineEls = byIndex('data-line');
    var ghostEls = byIndex('data-ghost');
    var dotEls = byIndex('data-dot');
    var sageEl = svg.querySelector('[data-sage]');
    var mouse = { x: 0, y: 0, amt: 0, target: 0 };
    var t0 = performance.now(), raf = 0, visible = true;

    function render(p) {
      var F = frame(p, mouse);
      for (var k = 0; k < planeEls.length; k++) planeEls[k].setAttribute('d', F.planes[k]);
      for (k = 0; k < lineEls.length; k++) {
        lineEls[k].setAttribute('d', F.lines[k].d);
        ghostEls[k].setAttribute('d', F.lines[k].d);
        dotEls[k].setAttribute('cx', f(F.lines[k].start[0]));
        dotEls[k].setAttribute('cy', f(F.lines[k].start[1]));
      }
      sageEl.setAttribute('r', f(F.sageR));
    }
    function tick(now) {
      raf = 0;
      if (!visible || reduce.matches) return;
      mouse.amt += (mouse.target - mouse.amt) * 0.06;
      render((((now - t0) % LOOP_MS) + LOOP_MS) % LOOP_MS / LOOP_MS);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf && !reduce.matches) raf = requestAnimationFrame(tick); }

    if (window.matchMedia('(pointer: fine)').matches) {
      el.addEventListener('pointermove', function (ev) {
        var r = svg.getBoundingClientRect();
        var sc = Math.min(r.width / VW, r.height / VH);
        var ox = r.left + (r.width - VW * sc) / 2, oy = r.top + (r.height - VH * sc) / 2;
        mouse.x = (ev.clientX - ox) / sc; mouse.y = (ev.clientY - oy) / sc; mouse.target = 1;
      });
      el.addEventListener('pointerleave', function () { mouse.target = 0; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) render(0); else start(); });
    start();
    return { render: render, setPhase: function (p) { reduce = { matches: true }; render(p); } };
  }

  root.HeroIllust = { mount: mount, svgString: svgString, LOOP_MS: LOOP_MS };
  if (typeof document !== 'undefined') {
    var auto = function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-hero-illust]'), function (el) {
        if (!el.__heroIllust) el.__heroIllust = mount(el);
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  }
})(typeof window !== 'undefined' ? window : globalThis);
