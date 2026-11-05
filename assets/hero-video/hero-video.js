/*
 * Hero video (動画タブ): the moment a film is born.
 *
 * On cream paper, in ink and a little gold: a sheet of script is read line by
 * line (a gold underline runs along each line); what is read leaves the page
 * as a sound wave; the wave settles into frames on a strip of film; the film
 * runs into a screen, where its pictures play one after another (a sun on the
 * horizon, a golden spiral, hills under a moon, a boat at sea, birds, a sprout:
 * small, quiet scenes drawn with a few lines).
 *
 * φ places it: the script sheet and the screen are golden rectangles, the
 * horizon in each picture sits on the golden line, the film frames are 1 : φ.
 *
 * It is one continuous flow, not a build-up and a reset: in 24 s the script is
 * read through once, the strip moves on exactly six frames, the six pictures
 * each play once and the wave completes whole cycles, so the frame at 24 s is
 * the frame at 0 s and the loop has no seam. The camera never moves. 30 frames
 * a second (720 a loop).
 *
 * Canvas 2D only (no images, no fonts). Nothing is built until the panel is
 * shown (its tab starts hidden); it pauses off screen. With
 * prefers-reduced-motion: one still frame.
 *
 * Usage: <div class="hero-video video-top" data-hero-video></div> + this script.
 */
(function () {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var LOOP = 24, FPS = 30, FRAMES = LOOP * FPS, STILL = 9.5;
  var NSCENE = 6, NLINES = 8;
  var TAU = Math.PI * 2;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  var INK = function (a) { return 'rgba(46,40,34,' + a + ')'; };
  var GOLD = function (a) { return 'rgba(190,150,70,' + a + ')'; };
  var CREAM = 'rgb(248,243,230)';
  var STRIP = 'rgb(112,98,82)';

  // ---------- layouts, in sheet units (wide 1200×400, phone 400×500) ----------
  function layoutFor(wide) {
    if (wide) {
      return {
        UW: 1200, UH: 400, dir: 1,
        sheet: { x: 200, y: 200, w: 156, h: 156 * PHI, tilt: -0.05 },
        wave: [[312, 200], [596, 200]], waveAmp: 52,
        strip: { x0: 604, x1: 908, y: 200, h: 84, fw: 50 * PHI, fh: 50, gap: 12 },
        links: [],
        screen: { x: 920, y: 200 - 136 / 2, w: 220, h: 220 / PHI }
      };
    }
    return {
      UW: 400, UH: 500, dir: -1,
      sheet: { x: 92, y: 124, w: 112, h: 112 * PHI, tilt: -0.05 },
      wave: [[160, 124], [384, 124]], waveAmp: 34,
      strip: { x0: 8, x1: 392, y: 262, h: 72, fw: 42 * PHI, fh: 42, gap: 10 },
      // from the end of the wave down to the strip, and from the strip down to the screen
      links: [[[384, 124], [404, 180], [392, 226]], [[8, 298], [16, 336], [70, 350]]],
      screen: { x: 70, y: 318, w: 260, h: 260 / PHI }
    };
  }

  // ---------- the small pictures (drawn into a box x,y,w,h) ----------
  function scene(g, i, x, y, w, h, s) {
    var hz = y + h / PHI, lw = Math.max(0.7, s * 1.1);
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = CREAM; g.fillRect(x, y, w, h);
    g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = INK(0.75);
    if (i === 0) { // sun on the horizon
      g.fillStyle = GOLD(0.9); g.beginPath(); g.arc(x + w / PHI, hz, h * 0.2, Math.PI, 0); g.fill();
      g.beginPath(); g.moveTo(x, hz); g.lineTo(x + w, hz); g.stroke();
      g.strokeStyle = INK(0.35); g.beginPath(); g.moveTo(x + w * 0.12, hz + h * 0.12); g.lineTo(x + w * 0.42, hz + h * 0.12);
      g.moveTo(x + w * 0.5, hz + h * 0.22); g.lineTo(x + w * 0.9, hz + h * 0.22); g.stroke();
    } else if (i === 1) { // a golden spiral in its squares
      var u = Math.min(w / PHI, h) * 0.86, sx = x + (w - u * PHI) / 2, sy = y + (h - u) / 2;
      var X = sx, Y = sy, ww = u * PHI, hh = u;
      g.strokeStyle = INK(0.3); g.strokeRect(X, Y, ww, hh);
      g.strokeStyle = GOLD(0.95);
      for (var k = 0; k < 7; k++) {
        var d = k % 4, q;
        if (d === 0) { q = hh; g.beginPath(); g.arc(X + q, Y + q, q, Math.PI, Math.PI * 1.5); g.stroke(); X += q; ww -= q; }
        else if (d === 1) { q = ww; g.beginPath(); g.arc(X, Y + q, q, Math.PI * 1.5, TAU); g.stroke(); Y += q; hh -= q; }
        else if (d === 2) { q = hh; g.beginPath(); g.arc(X + ww - q, Y, q, 0, Math.PI / 2); g.stroke(); ww -= q; }
        else { q = ww; g.beginPath(); g.arc(X + q, Y + hh - q, q, Math.PI / 2, Math.PI); g.stroke(); hh -= q; }
      }
    } else if (i === 2) { // hills under a moon
      g.fillStyle = GOLD(0.85); g.beginPath(); g.arc(x + w * 0.72, y + h * 0.28, h * 0.1, 0, TAU); g.fill();
      g.fillStyle = 'rgba(46,40,34,0.12)';
      g.beginPath(); g.moveTo(x, y + h); g.quadraticCurveTo(x + w * 0.3, hz - h * 0.3, x + w * 0.62, y + h); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x + w * 0.38, y + h); g.quadraticCurveTo(x + w * 0.7, hz - h * 0.12, x + w, y + h * 0.92); g.stroke();
    } else if (i === 3) { // a boat at sea
      for (k = 0; k < 3; k++) {
        var yy = hz + k * h * 0.11;
        g.strokeStyle = INK(0.6 - k * 0.15);
        g.beginPath();
        for (var j = 0; j <= 12; j++) { var xx = x + w * j / 12; g.lineTo(xx, yy + Math.sin(j * 1.3 + k) * h * 0.02); }
        g.stroke();
      }
      g.strokeStyle = INK(0.8);
      var bx = x + w / PHI / PHI + w * 0.1, by = hz - h * 0.02;
      g.beginPath(); g.moveTo(bx - w * 0.1, by); g.lineTo(bx + w * 0.1, by); g.lineTo(bx + w * 0.07, by + h * 0.06); g.lineTo(bx - w * 0.07, by + h * 0.06); g.closePath(); g.stroke();
      g.fillStyle = GOLD(0.9); g.beginPath(); g.moveTo(bx, by - h * 0.32); g.lineTo(bx, by - h * 0.02); g.lineTo(bx + w * 0.1, by - h * 0.04); g.closePath(); g.fill();
    } else if (i === 4) { // birds
      g.fillStyle = GOLD(0.8); g.beginPath(); g.arc(x + w * 0.24, y + h * 0.34, h * 0.08, 0, TAU); g.fill();
      [[0.5, 0.36, 1], [0.64, 0.28, 0.8], [0.74, 0.44, 0.65]].forEach(function (b) {
        var cx = x + w * b[0], cy = y + h * b[1], r = h * 0.1 * b[2];
        g.beginPath(); g.moveTo(cx - r, cy - r * 0.4); g.quadraticCurveTo(cx - r * 0.4, cy - r * 0.6, cx, cy);
        g.quadraticCurveTo(cx + r * 0.4, cy - r * 0.6, cx + r, cy - r * 0.4); g.stroke();
      });
      g.strokeStyle = INK(0.35); g.beginPath(); g.moveTo(x, hz + h * 0.08); g.lineTo(x + w, hz + h * 0.08); g.stroke();
    } else { // a sprout
      g.beginPath(); g.moveTo(x + w * 0.2, hz + h * 0.12); g.lineTo(x + w * 0.8, hz + h * 0.12); g.stroke();
      var cx2 = x + w / 2, base = hz + h * 0.12;
      g.beginPath(); g.moveTo(cx2, base); g.quadraticCurveTo(cx2 - w * 0.02, base - h * 0.2, cx2, base - h * 0.34); g.stroke();
      g.fillStyle = 'rgba(132,160,112,0.85)';
      g.beginPath(); g.moveTo(cx2, base - h * 0.26); g.quadraticCurveTo(cx2 - w * 0.12, base - h * 0.42, cx2 - w * 0.16, base - h * 0.3); g.quadraticCurveTo(cx2 - w * 0.08, base - h * 0.22, cx2, base - h * 0.26); g.fill();
      g.beginPath(); g.moveTo(cx2, base - h * 0.3); g.quadraticCurveTo(cx2 + w * 0.12, base - h * 0.48, cx2 + w * 0.18, base - h * 0.36); g.quadraticCurveTo(cx2 + w * 0.08, base - h * 0.26, cx2, base - h * 0.3); g.fill();
      g.fillStyle = GOLD(0.9); g.beginPath(); g.arc(cx2, base + h * 0.06, h * 0.035, 0, TAU); g.fill();
    }
    g.restore();
  }

  function drawPaper(g, W, H, k) {
    g.fillStyle = 'rgb(241,234,216)'; g.fillRect(0, 0, W, H);
    var r = rnd(23);
    for (var i = 0; i < 6; i++) {
      var x = r() * W, y = r() * H, rr = (0.25 + r() * 0.4) * Math.max(W, H);
      var gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(200,176,128,' + (0.03 + r() * 0.04).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(200,176,128,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    var img = g.getImageData(0, 0, W, H), d = img.data;
    for (i = 0; i < d.length; i += 4) { var n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
    g.putImageData(img, 0, 0);
    var v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(170,140,100,0)'); v.addColorStop(1, 'rgba(170,140,100,0.12)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // the script: a title, then lines of text (only lines, nothing legible); returns each line's span
  function scriptLines(S) {
    var r = rnd(5), out = [], top = -S.h / 2 + S.h * 0.14, step = (S.h * 0.72) / NLINES;
    for (var i = 0; i < NLINES; i++) {
      var y = top + i * step + (i ? step * 0.3 : 0);
      var x0 = -S.w / 2 + S.w * (i === 0 ? 0.14 : 0.12), len = S.w * (i === 0 ? 0.5 : 0.62 + r() * 0.14);
      if (i % 3 === 2) len *= 0.7;
      out.push({ x0: x0, x1: x0 + len, y: y, title: i === 0 });
    }
    return out;
  }

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var W = 1, H = 1, k = 1, L = null, paper = null, lines = null, lastFi = -1;
    var t0 = performance.now(), raf = 0, visible = true;
    var fixedTime = opts.time;

    function resize() {
      var r = el.getBoundingClientRect();
      if (r.width < 2) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      L = layoutFor(r.width / r.height > 1.6);
      k = W / L.UW;
      lines = scriptLines(L.sheet);
      // the paper and the script sheet (without the reading marks) are drawn once
      paper = document.createElement('canvas'); paper.width = W; paper.height = H;
      var g = paper.getContext('2d');
      drawPaper(g, W, H, k);
      g.save(); g.scale(k, k); drawSheet(g); g.restore();
      lastFi = -1;
      if (fixedTime != null) draw(fixedTime); else if (reduce.matches) draw(STILL);
    }

    function drawSheet(g) {
      var S = L.sheet;
      g.save(); g.translate(S.x, S.y); g.rotate(S.tilt);
      g.fillStyle = 'rgba(46,40,34,0.1)'; g.fillRect(-S.w / 2 + 5, -S.h / 2 + 6, S.w, S.h);
      g.fillStyle = CREAM; g.fillRect(-S.w / 2, -S.h / 2, S.w, S.h);
      g.strokeStyle = INK(0.55); g.lineWidth = 0.9; g.strokeRect(-S.w / 2, -S.h / 2, S.w, S.h);
      // a margin rule, and the lines of the script
      g.strokeStyle = 'rgba(190,150,70,0.45)'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(-S.w / 2 + S.w * 0.08, -S.h / 2 + 8); g.lineTo(-S.w / 2 + S.w * 0.08, S.h / 2 - 8); g.stroke();
      lines.forEach(function (ln) {
        g.strokeStyle = INK(ln.title ? 0.85 : 0.5); g.lineWidth = ln.title ? 3.2 : 1.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(ln.x0, ln.y); g.lineTo(ln.x1, ln.y); g.stroke();
      });
      g.restore();
    }

    function S2C(S, x, y) { // a point on the (tilted) sheet, to sheet units on the canvas
      var c = Math.cos(S.tilt), s = Math.sin(S.tilt);
      return [S.x + x * c - y * s, S.y + x * s + y * c];
    }

    // the voice: how strongly the line now being read speaks (periodic over the loop)
    function voice(T) {
      var p = (T / LOOP) * NLINES, i = Math.floor(p) % NLINES, f = p - Math.floor(p);
      return { i: i, f: f, level: smooth(0.04, 0.2, f) * (1 - smooth(0.82, 0.97, f)) * (i === 0 ? 1.15 : 0.85 + 0.2 * Math.sin(i * 2.1)) };
    }

    function draw(time) {
      var T = ((time % LOOP) + LOOP) % LOOP;
      var fi = Math.floor(T * FPS + 1e-6) % FRAMES;
      T = fi / FPS;
      lastFi = fi;
      var ph = T / LOOP; // 0..1 through the loop
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.drawImage(paper, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      // reading: a gold underline runs along the current line
      var S = L.sheet, v = voice(T), ln = lines[v.i];
      var rp = smooth(0.06, 0.88, v.f), fade = 1 - smooth(0.88, 1, v.f);
      ctx.save(); ctx.translate(S.x, S.y); ctx.rotate(S.tilt);
      ctx.strokeStyle = GOLD(0.85 * fade); ctx.lineWidth = ln.title ? 2.2 : 1.6;
      ctx.beginPath(); ctx.moveTo(ln.x0, ln.y + (ln.title ? 5 : 3.5)); ctx.lineTo(lerp(ln.x0, ln.x1, rp), ln.y + (ln.title ? 5 : 3.5)); ctx.stroke();
      ctx.restore();
      // a gold dot carries the read word from the line's end to the start of the wave
      var end = S2C(S, lerp(ln.x0, ln.x1, rp), ln.y), w0 = L.wave[0];
      var dq = smooth(0.15, 0.95, v.f);
      var dx = lerp(end[0], w0[0], 0.25 + 0.75 * dq), dy = lerp(end[1], w0[1], dq);
      ctx.fillStyle = GOLD(0.9 * v.level);
      ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, TAU); ctx.fill();

      // the sound wave: bars that travel away from the page (whole cycles per loop)
      var a = L.wave[0], b = L.wave[1], N = 64, len = b[0] - a[0];
      for (var i = 0; i <= N; i++) {
        var s = i / N, x = lerp(a[0], b[0], s), y = lerp(a[1], b[1], s);
        // the sound of a moment ago is further along: sample the voice at an earlier time
        var vv = voice(((T - s * 2.4) % LOOP + LOOP) % LOOP).level;
        var shape = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.9 + 1.7 * Math.sin(i * 0.37)) * Math.cos(TAU * (ph * 48) - i * 0.55));
        var env = Math.sin(Math.PI * Math.min(1, s * 1.15)) * (0.2 + 0.8 * vv);
        var amp = Math.max(1.2, L.waveAmp * env * shape);
        // the end of the wave begins to square off into frames
        var q = smooth(0.72, 1, s);
        var col = q > 0.5 ? GOLD(0.55 + 0.4 * q) : INK(0.55);
        ctx.strokeStyle = col; ctx.lineWidth = lerp(1.6, 1.1, q);
        ctx.beginPath(); ctx.moveTo(x, y - amp); ctx.lineTo(x, y + amp); ctx.stroke();
      }
      // a thin centre line
      ctx.strokeStyle = INK(0.25); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();

      // links (phone): dotted gold threads that carry the flow on to the next row
      L.links.forEach(function (Lk) {
        ctx.save();
        ctx.strokeStyle = GOLD(0.7); ctx.lineWidth = 1.2; ctx.setLineDash([2, 5]);
        ctx.lineDashOffset = -ph * 7 * 12; // whole dash periods per loop
        ctx.beginPath(); ctx.moveTo(Lk[0][0], Lk[0][1]); ctx.quadraticCurveTo(Lk[1][0], Lk[1][1], Lk[2][0], Lk[2][1]); ctx.stroke();
        ctx.restore();
      });

      // the film: moves on exactly NSCENE frames per loop
      var F = L.strip, pitch = F.fw + F.gap, off = ph * NSCENE * pitch;
      ctx.save();
      ctx.beginPath(); ctx.rect(F.x0, F.y - F.h / 2 - 1, F.x1 - F.x0, F.h + 2); ctx.clip();
      ctx.fillStyle = STRIP; ctx.fillRect(F.x0, F.y - F.h / 2, F.x1 - F.x0, F.h);
      // sprocket holes
      var hp = pitch / 4, hoff = off % hp;
      ctx.fillStyle = 'rgb(236,228,210)';
      for (var hx = F.x0 - hp + (L.dir > 0 ? hoff : hp - hoff); hx < F.x1 + hp; hx += hp) {
        ctx.fillRect(hx, F.y - F.h / 2 + 4, hp * 0.45, (F.h - F.fh) / 2 - 8);
        ctx.fillRect(hx, F.y + F.fh / 2 + 4, hp * 0.45, (F.h - F.fh) / 2 - 8);
      }
      // frames: frame n shows picture n mod NSCENE
      var startN = Math.floor(-off / pitch) - 1;
      for (var n = startN; n < startN + Math.ceil((F.x1 - F.x0) / pitch) + 3; n++) {
        var fx = L.dir > 0 ? F.x0 + n * pitch + off : F.x1 - (n * pitch + off) - F.fw;
        if (fx > F.x1 || fx + F.fw < F.x0) continue;
        var idx = ((-n % NSCENE) + NSCENE) % NSCENE;
        scene(ctx, idx, fx, F.y - F.fh / 2, F.fw, F.fh, 0.9);
        ctx.strokeStyle = 'rgba(46,40,34,0.5)'; ctx.lineWidth = 0.6; ctx.strokeRect(fx, F.y - F.fh / 2, F.fw, F.fh);
      }
      ctx.restore();

      // the screen: the picture now playing, crossfading to the next as each frame arrives
      var C = L.screen;
      ctx.fillStyle = 'rgba(46,40,34,0.1)'; ctx.fillRect(C.x + 6, C.y + 7, C.w, C.h);
      // the frame that has just left the strip (toward the screen) is the one playing
      var e = (F.x1 - F.x0 - off) / pitch, nStar = Math.ceil(e - 1e-9), fr = nStar - e;
      var cur = ((-nStar % NSCENE) + NSCENE) % NSCENE, prev = (cur + NSCENE - 1) % NSCENE;
      var cf = smooth(0, 0.14, fr);
      if (cf < 0.998) scene(ctx, prev, C.x, C.y, C.w, C.h, 1.6);
      if (cf > 0.002) { ctx.globalAlpha = cf; scene(ctx, cur, C.x, C.y, C.w, C.h, 1.6); ctx.globalAlpha = 1; }
      ctx.strokeStyle = INK(0.7); ctx.lineWidth = 1.2; ctx.strokeRect(C.x, C.y, C.w, C.h);
      // a gold progress line under the screen
      ctx.strokeStyle = INK(0.2); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(C.x, C.y + C.h + 10); ctx.lineTo(C.x + C.w, C.y + C.h + 10); ctx.stroke();
      ctx.strokeStyle = GOLD(0.9); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(C.x, C.y + C.h + 10); ctx.lineTo(C.x + C.w * fr, C.y + C.h + 10); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) draw(STILL); else { lastFi = -1; start(); } });
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
    return { draw: draw, setTime: function (t) { fixedTime = t; draw(t); }, loop: LOOP };
  }

  window.HeroVideo = { mount: mount };
  // nothing is built until the panel is actually shown (its tab starts hidden)
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-video]'), function (el) {
      if (el.__heroVideo) return;
      function ready() { return el.getBoundingClientRect().width > 1; }
      if (ready() || !('ResizeObserver' in window)) { el.__heroVideo = mount(el); return; }
      var ro = new ResizeObserver(function () {
        if (!el.__heroVideo && ready()) { ro.disconnect(); el.__heroVideo = mount(el); }
      });
      ro.observe(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
