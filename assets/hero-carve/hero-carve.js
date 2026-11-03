/*
 * Hero carve (仕事一覧タブ): an endless golden-ratio carving.
 *
 * Carved diamond rings, each one 1/φ the size of the ring around it, sink
 * toward a single point of light. Raised and sunken rings alternate; each
 * ring has four cut planes lit from the upper left, and the larger ones carry
 * incisions (8 per edge) and an engraved groove. A two-armed golden spiral
 * (it grows by φ every quarter turn) runs through them.
 *
 * The camera moves toward the centre forever and never arrives: it zooms by
 * φ² every 14 s, and because the picture is the same after a φ² zoom (two
 * rings in, the spiral's arms swap places), the frame at 14 s is exactly the
 * frame at 0 s. Rings are added at the edge and fade out into the dark at the
 * centre by their size, so the number of rings on screen never changes and
 * nothing appears or vanishes suddenly. There is no start and no end.
 * The light turns a little and back over 28 s (one loop of the whole).
 *
 * Seen as an old documentary print: faded sepia monochrome, drawn small and
 * enlarged (soft edges), 14 frames a second, gate weave, coarse grain, dust,
 * scratches, a weak flicker (a few percent, never a hard flash) and dark edges.
 * The grain and scratches belong to the film, not to the carving: they do
 * not zoom. All of it is chosen from the frame number, so the loop closes exactly.
 *
 * Drawn with Canvas 2D paths only (no images, no fonts). Nothing runs until the
 * panel is shown (the tab is display:none until then), and the loop pauses when
 * the panel is off screen. With prefers-reduced-motion, one still frame (with
 * the film texture, without flicker or weave).
 *
 * Usage: <div class="hero-carve" data-hero-carve></div> + this script.
 */
(function () {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var LOOP = 28;
  var STILL = 5; // the moment shown when motion is reduced
  var PERIOD = LOOP / 2; // one φ² zoom
  var BAND = Math.pow(PHI, -0.64); // how much of each step is carved band (the rest is a dark groove)
  // film: the picture advances at 14 frames a second (392 frames a loop, so the loop still closes exactly)
  var FPS = 14, FRAMES = LOOP * FPS;
  function hash(a, b) {
    var h = (a * 374761393 + (b || 0) * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
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
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  // old film: every colour is pressed toward a faded sepia monochrome, with lifted blacks
  function tone(c) {
    var l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    l = 20 + l * 0.86;
    return mix([l * 1.05, l * 0.98, l * 0.86], c, 0.1);
  }
  function rgba(c, a) { c = tone(c); return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  // wood shade from a brightness 0..1: dark heartwood → wood → light wood → bronze
  function shade(b) {
    b = clamp(b, 0, 1.25);
    if (b < 0.45) return mix(COL.dark, COL.wood, b / 0.45);
    if (b < 0.8) return mix(COL.wood, COL.light, (b - 0.45) / 0.35);
    return mix(COL.light, COL.bronze, clamp((b - 0.8) / 0.45, 0, 1));
  }

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var W = 1, H = 1, dpr = 1, grains = null, lastFi = -1;
    var t0 = performance.now(), raf = 0, visible = true;
    var fixedTime = opts.time;

    function resize() {
      var r = el.getBoundingClientRect();
      if (r.width < 2) return;
      // the picture is drawn small and enlarged by the browser: the softness of an old print
      dpr = r.width < 700 ? 0.8 : 0.6;
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      grains = [makeGrain(W + 24, H + 24, 7), makeGrain(W + 24, H + 24, 11), makeGrain(W + 24, H + 24, 13)];
      lastFi = -1;
      if (fixedTime != null) draw(fixedTime); else if (reduce.matches) draw(STILL, true);
    }

    // grey film grain, laid over the picture with 'overlay' (lightens and darkens)
    function makeGrain(w, h, seed) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
      for (var i = 0; i < w * h; i++) {
        seed = (seed * 16807) % 2147483647;
        var a = (seed % 1000) / 1000;
        seed = (seed * 16807) % 2147483647;
        var v = 128 + ((a + (seed % 1000) / 1000) - 1) * 150;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    function quad(P) {
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (var i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
      ctx.closePath();
    }

    function draw(time, still) {
      var T = ((time % LOOP) + LOOP) % LOOP;
      var fi = Math.floor(T * FPS + 1e-6) % FRAMES;
      T = fi / FPS;
      lastFi = fi;
      var U = W / 700, cx = W / 2, cy = H / 2;
      var asp = W / H > 1.6 ? PHI : 1 / PHI; // ring width / height: wide on a wide frame, tall on a phone
      var b0 = H * 0.5;
      // the zoom: φ² per PERIOD, so it returns to itself (two rings further in)
      var Z = Math.pow(PHI, 2 * (T % PERIOD) / PERIOD);
      var la = -2.3 + 0.35 * Math.sin(Math.PI * 2 * T / LOOP); // the light leans a little and back
      var lx = Math.cos(la), ly = Math.sin(la);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgba(COL.room, 1);
      ctx.fillRect(0, 0, W, H);
      // gate weave: the frame sits a little differently in the projector each time
      var wx = still ? 0 : (Math.sin(fi * 0.9) * 0.35 + (hash(fi, 1) - 0.5) * 0.5) * U * 1.6;
      var wy = still ? 0 : (Math.sin(fi * 0.37) * 0.5 + (hash(fi, 2) - 0.5) * 0.8) * U * 1.6;
      ctx.save();
      ctx.translate(wx, wy);

      var nL = Math.hypot(asp, 1), nx = 1 / nL, ny = asp / nL;
      for (var k = -8; k < 60; k++) {
        var s = Z * Math.pow(PHI, -k);
        var bo = b0 * s, ao = bo * asp, bi = bo * BAND, ai = ao * BAND; // the carved band; inside it, a dark groove down to the next ring
        if ((W / 2 + 4) / (ao / PHI) + (H / 2 + 4) / (bo / PHI) <= 1) continue; // still wholly outside the frame
        if (bo < 1.2) break;                                     // too small to see
        // depth: the rings dim as they sink toward the centre, and the smallest fade out
        var depth = Math.log(bo / b0) / Math.log(PHI);
        var lit = 0.22 + 0.78 * smooth(-7.5, 0.5, depth);
        var a = smooth(1.2, 6, bo);
        var sg = ((k % 2) + 2) % 2 === 0 ? 1 : -1; // raised and sunken rings alternate
        var O = [[cx, cy - bo], [cx + ao, cy], [cx, cy + bo], [cx - ao, cy]];
        var I = [[cx, cy - bi], [cx + ai, cy], [cx, cy + bi], [cx - ai, cy]];
        var N = [[-nx, -ny], [nx, -ny], [nx, ny], [-nx, ny]];
        var F = [[O[3], O[0], I[0], I[3]], [O[0], O[1], I[1], I[0]], [O[1], O[2], I[2], I[1]], [O[2], O[3], I[3], I[2]]];
        for (var f = 0; f < 4; f++) {
          var b = 0.4 + 0.27 * sg * (N[f][0] * lx + N[f][1] * ly);
          quad(F[f]);
          ctx.fillStyle = rgba(shade(b * lit), a);
          ctx.fill();
        }
        ctx.lineWidth = Math.max(0.5, U * 0.5);
        ctx.strokeStyle = rgba(COL.dark, 0.6 * a);
        quad(O); ctx.stroke();
        // larger rings: an engraved groove and the incisions along the outer edge
        var big = smooth(18 * U, 50 * U, bo) * a;
        if (big > 0.01) {
          var m = (1 + BAND) / 2;
          var M = [[cx, cy - bo * m], [cx + ao * m, cy], [cx, cy + bo * m], [cx - ao * m, cy]];
          ctx.lineWidth = Math.max(0.6, bo * 0.006);
          ctx.strokeStyle = rgba([24, 16, 12], 0.7 * big);
          quad(M); ctx.stroke();
          ctx.save(); ctx.translate(bo * 0.004, bo * 0.004);
          ctx.strokeStyle = rgba(COL.bronze, 0.22 * big * lit);
          quad(M); ctx.stroke(); ctx.restore();
          var len = (bo - bi) * 0.28;
          ctx.lineWidth = Math.max(0.6, bo * 0.005);
          ctx.strokeStyle = rgba([24, 16, 12], 0.75 * big);
          ctx.beginPath();
          for (var e = 0; e < 4; e++) {
            var p = O[e], q = O[(e + 1) % 4];
            // inward normal of this edge
            var ex = q[0] - p[0], ey = q[1] - p[1], el = Math.hypot(ex, ey), ix = -ey / el, iy = ex / el;
            if (ix * (cx - (p[0] + q[0]) / 2) + iy * (cy - (p[1] + q[1]) / 2) < 0) { ix = -ix; iy = -iy; }
            for (var j = 1; j <= 8; j++) {
              var t = j / 9, x = p[0] + ex * t, y = p[1] + ey * t;
              ctx.moveTo(x, y); ctx.lineTo(x + ix * len, y + iy * len);
            }
          }
          ctx.stroke();
        }
      }

      // the two-armed golden spiral (φ per quarter turn), drawn with the rings' proportions
      var rMax = Math.hypot(W, H), r0 = b0 * Z;
      ctx.lineWidth = Math.max(0.6, U * 0.8);
      for (var arm = 0; arm < 2; arm++) {
        var th0 = Math.PI / 2 * Math.log(1.5 / r0) / Math.log(PHI), th1 = Math.PI / 2 * Math.log(rMax / r0) / Math.log(PHI);
        var steps = 220;
        ctx.beginPath();
        for (var i = 0; i <= steps; i++) {
          var th = th0 + (th1 - th0) * i / steps, r = r0 * Math.pow(PHI, 2 * th / Math.PI), ang = th + arm * Math.PI;
          var X = cx + Math.cos(ang) * r * asp, Y = cy + Math.sin(ang) * r;
          if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        var sgr = ctx.createRadialGradient(cx, cy, 0, cx, cy, b0 * 1.2);
        sgr.addColorStop(0, rgba(COL.line, 0)); sgr.addColorStop(0.5, rgba(COL.line, 0.18)); sgr.addColorStop(1, rgba(COL.line, 0.34));
        ctx.strokeStyle = sgr;
        ctx.stroke();
      }

      // the point it moves toward and never reaches
      var pr = Math.max(1.6, 2.4 * U), pulse = 0.85 + 0.15 * Math.sin(Math.PI * 2 * T / LOOP);
      var pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, pr * 7);
      pg.addColorStop(0, rgba(COL.bronze, 0.5 * pulse)); pg.addColorStop(1, rgba(COL.bronze, 0));
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, pr * 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(COL.bronze, 0.95);
      ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
      film(fi, still);
    }

    // the print and the projector: grain, dust, scratches, a weak flicker and dark edges.
    // Everything is chosen from the frame number, so frame 392 is frame 0 again.
    function film(fi, still) {
      var i, x, y, U = W / 700;
      // exposure: a weak, uneven breathing (a few percent; never a hard flash)
      if (!still) {
        var e = (hash(fi, 3) - 0.5) * 0.05 + Math.sin(fi * 0.21) * 0.015;
        ctx.fillStyle = e > 0 ? 'rgba(235,225,205,' + e.toFixed(3) + ')' : 'rgba(0,0,0,' + (-e * 1.4).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      // scratches along the length of the film, each lasting a few frames
      for (var k = 0; k < 3; k++) {
        var win = Math.floor(fi / 6) + k * 131;
        if (hash(win, k + 20) > 0.3) continue;
        x = W * (0.08 + 0.84 * hash(win, k + 30)) + Math.sin(fi * 1.3 + k) * 0.8 * U;
        var y0 = H * hash(win, k + 40) * 0.5, y1 = H * (0.55 + 0.45 * hash(win, k + 50));
        var dark = hash(win, k + 60) < 0.3;
        ctx.strokeStyle = dark ? 'rgba(10,8,6,0.35)' : 'rgba(232,222,200,' + (0.12 + 0.12 * hash(fi, k + 70)).toFixed(3) + ')';
        ctx.lineWidth = Math.max(0.6, U * (0.6 + hash(win, k + 80)));
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (hash(win, k + 90) - 0.5) * 3 * U, y1); ctx.stroke();
      }
      // dust: a few dark specks and, now and then, a hair; a different handful every frame
      var nd = Math.floor(hash(fi, 4) * 5) - 1;
      for (i = 0; i < nd; i++) {
        x = W * hash(fi, 100 + i); y = H * hash(fi, 200 + i);
        ctx.fillStyle = hash(fi, 300 + i) < 0.8 ? 'rgba(12,10,8,0.6)' : 'rgba(235,225,205,0.4)';
        ctx.beginPath(); ctx.arc(x, y, U * (0.5 + 1.8 * hash(fi, 400 + i)), 0, Math.PI * 2); ctx.fill();
      }
      if (hash(fi, 5) < 0.06) {
        x = W * hash(fi, 6); y = H * hash(fi, 7);
        ctx.strokeStyle = 'rgba(12,10,8,0.5)'; ctx.lineWidth = Math.max(0.6, U * 0.7);
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 8 * U, y - 6 * U, x + 4 * U, y + 10 * U, x + 14 * U * hash(fi, 8), y + 12 * U); ctx.stroke();
      }
      // grain
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.42;
      ctx.drawImage(grains[fi % 3], -Math.floor(hash(fi, 9) * 24), -Math.floor(hash(fi, 10) * 24));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // dark, slightly uneven edges of the frame
      var cx = W * (0.5 + (hash(Math.floor(fi / 20), 11) - 0.5) * 0.03), cy = H * 0.48;
      var v = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.3, cx, cy, Math.max(W, H) * 0.7);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0.3)'); v.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      var eg = ctx.createLinearGradient(0, 0, 0, H);
      eg.addColorStop(0, 'rgba(0,0,0,0.35)'); eg.addColorStop(0.07, 'rgba(0,0,0,0)');
      eg.addColorStop(0.93, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = eg; ctx.fillRect(0, 0, W, H);
    }

    function frame(now) {
      raf = 0;
      if (!visible || reduce.matches || fixedTime != null) return;
      var t = (now - t0) / 1000;
      // draw only when the film moves on to its next frame
      if ((Math.floor((((t % LOOP) + LOOP) % LOOP) * FPS + 1e-6) % FRAMES) !== lastFi) draw(t);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !reduce.matches && fixedTime == null) raf = requestAnimationFrame(frame); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) draw(STILL, true); else { lastFi = -1; start(); } });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);
    resize();
    start();
    return { draw: draw, setTime: function (t, still) { fixedTime = t; draw(t, still); }, loop: LOOP };
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
