/*
 * Hero collage (仕事一覧タブ): old engraved plates and flat colour, on paper.
 *
 * A quiet, wide sheet of cream paper. Engraved-looking line drawings, all
 * drawn here with Canvas paths (no images, no fonts loaded): a sheet of graph
 * paper, the elevation of a Doric column with its flutes, steps and measuring
 * lines, a compass rose, the section of a shell built on the golden spiral (on
 * a slate plate, like an old X-ray), and a long surveyor's curve. Over them, a
 * few flat squares of colour (muted yellow, blue, blue-green, green, cream),
 * printed with 'multiply' so the lines show through.
 *
 * φ is the frame: the sheet is divided by golden sections, the colour blocks
 * sit on those divisions, the shell is a golden spiral (it grows by φ every
 * quarter turn), and the column's parts follow φ.
 *
 * One loop, 24 s, camera fixed: the plates appear one by one and settle on the
 * sheet → the colour squares slide in → slowly two of them trade places and the
 * small blue squares shuffle → everything lifts away, leaving the empty sheet
 * the loop began with. 30 frames a second, 720 a loop, so it closes exactly.
 *
 * Each plate is engraved once into its own small canvas when the panel is
 * sized, so a frame is only a few image draws. Nothing is built until the
 * panel is shown; it pauses off screen. With prefers-reduced-motion: one still
 * of the finished sheet.
 *
 * Usage: <div class="hero-collage" data-hero-collage></div> + this script.
 */
(function () {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var LOOP = 24, FPS = 30, FRAMES = LOOP * FPS, STILL = 16;
  var TAU = Math.PI * 2;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  var INK = 'rgba(64,52,42,';
  var PAPER = [239, 231, 212];
  var COLORS = {
    yellow: 'rgb(222,192,104)',
    blue: 'rgb(150,176,198)',
    teal: 'rgb(118,166,160)',
    green: 'rgb(132,160,112)',
    pale: 'rgb(184,206,214)',
    cream: 'rgb(246,239,222)'
  };

  // ---------- layouts, in sheet units (wide 1200×400, phone 400×500) ----------
  function layoutFor(wide) {
    if (wide) {
      var gx = 1200 / PHI; // 741.6: the golden section of the sheet
      return {
        UW: 1200, UH: 400,
        grid: { x: 96, y: 44, w: 420, h: 312 },
        column: { x: 232, y: 52, h: 296 },
        compass: { x: 560, y: 206, r: 118 },
        shell: { x: gx + 14, y: 70, s: 260 },
        curve: [[70, 340], [420, 420], [760, -40], [1140, 96]],
        rects: [
          // name, colour, positions (sheet units) it moves between, and how
          { c: 'cream', mode: 'over', a: [560, 82, 128, 250], b: [560, 82, 128, 250] },
          { c: 'yellow', a: [430, 206, 130, 120], b: [430, 166, 130, 120] },
          { c: 'blue', a: [gx + 290, 36, 112, 112], b: [gx + 290, 214, 112, 112] },
          { c: 'teal', a: [gx + 290, 214, 112, 112], b: [gx + 290, 36, 112, 112] },
          { c: 'green', a: [gx - 40, 330, 330, 22], b: [gx - 10, 330, 330, 22] },
          { c: 'pale', a: [60, 60, 34, 34], b: [94, 60, 34, 34] },
          { c: 'pale', a: [94, 94, 34, 34], b: [60, 94, 34, 34] },
          { c: 'blue', a: [60, 128, 34, 34], b: [60, 128, 34, 34] }
        ]
      };
    }
    return {
      UW: 400, UH: 500,
      grid: { x: 24, y: 36, w: 220, h: 300 },
      column: { x: 92, y: 44, h: 286 },
      compass: { x: 286, y: 132, r: 92 },
      shell: { x: 176, y: 290, s: 184 },
      curve: [[10, 470], [120, 360], [260, 520], [396, 300]],
      rects: [
        { c: 'cream', mode: 'over', a: [286, 40, 100, 184], b: [286, 40, 100, 184] },
        { c: 'yellow', a: [190, 132, 96, 92], b: [190, 102, 96, 92] },
        { c: 'blue', a: [30, 346, 96, 96], b: [30, 404, 96, 46] },
        { c: 'teal', a: [306, 250, 70, 70], b: [306, 410, 70, 60] },
        { c: 'green', a: [150, 478, 220, 12], b: [170, 478, 220, 12] },
        { c: 'pale', a: [250, 250, 26, 26], b: [276, 250, 26, 26] },
        { c: 'pale', a: [276, 276, 26, 26], b: [250, 276, 26, 26] }
      ]
    };
  }

  // ---------- engraving helpers (draw in sheet units; the context is already scaled) ----------
  function line(g, x0, y0, x1, y1, a, w) {
    g.strokeStyle = INK + a + ')'; g.lineWidth = w || 0.8;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  function hatch(g, x, y, w, h, step, ang, a) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.strokeStyle = INK + a + ')'; g.lineWidth = 0.5;
    var d = Math.hypot(w, h), c = Math.cos(ang), s = Math.sin(ang);
    g.beginPath();
    for (var k = -d; k < d; k += step) {
      var cx = x + w / 2 + k * -s, cy = y + h / 2 + k * c;
      g.moveTo(cx - c * d, cy - s * d); g.lineTo(cx + c * d, cy + s * d);
    }
    g.stroke(); g.restore();
  }

  function drawGrid(g, G) {
    for (var x = 0; x <= G.w + 0.1; x += 8) line(g, x, 0, x, G.h, x % 40 === 0 ? 0.28 : 0.11, x % 40 === 0 ? 0.7 : 0.45);
    for (var y = 0; y <= G.h + 0.1; y += 8) line(g, 0, y, G.w, y, y % 40 === 0 ? 0.28 : 0.11, y % 40 === 0 ? 0.7 : 0.45);
    g.strokeStyle = INK + '0.5)'; g.lineWidth = 1; g.strokeRect(0, 0, G.w, G.h);
  }

  // a Doric column: steps, shaft with entasis and flutes, necking, echinus, abacus; heights by φ
  function drawColumn(g, h) {
    var k, t, x, y;
    var steps = h / (PHI * PHI * PHI * PHI * PHI);      // three steps, together 1/φ⁵ of the height
    var cap = h / (PHI * PHI * PHI * PHI);              // capital 1/φ⁴
    var shaftH = h - steps - cap;
    var r0 = h / (PHI * PHI * PHI * PHI) * 0.62, r1 = r0 * 0.78;
    var top = 0, capB = cap, shaftB = cap + shaftH;
    // steps
    for (var i = 0; i < 3; i++) {
      var sw = r0 * (1.5 + (2 - i) * 0.22), sy = shaftB + i * steps / 3;
      g.strokeStyle = INK + '0.75)'; g.lineWidth = 0.9;
      g.strokeRect(-sw, sy, sw * 2, steps / 3);
      hatch(g, -sw, sy + steps / 3 * 0.55, sw * 2, steps / 3 * 0.45, 2.2, 0, 0.35);
    }
    // shaft outline with entasis
    function rad(t) { return lerp(r0, r1, t) + Math.sin(t * Math.PI) * r0 * 0.04; }
    g.strokeStyle = INK + '0.8)'; g.lineWidth = 1;
    [-1, 1].forEach(function (sd) {
      g.beginPath();
      for (k = 0; k <= 40; k++) { t = k / 40; y = shaftB - t * shaftH; x = sd * rad(t); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    });
    // flutes: lines that follow the taper, crowding toward the edges (a round shaft seen flat)
    for (var f = -7; f <= 7; f++) {
      var u = Math.sin(f / 8 * Math.PI / 2);
      g.beginPath();
      for (k = 0; k <= 20; k++) { t = k / 20; y = shaftB - t * shaftH; x = u * rad(t); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      g.strokeStyle = INK + (0.22 + 0.2 * Math.abs(u)) + ')'; g.lineWidth = 0.55; g.stroke();
    }
    // shading on the right: fine hatching
    g.save(); g.beginPath();
    for (k = 0; k <= 20; k++) { t = k / 20; g.lineTo(rad(t), shaftB - t * shaftH); }
    for (k = 20; k >= 0; k--) { t = k / 20; g.lineTo(rad(t) * 0.45, shaftB - t * shaftH); }
    g.closePath(); g.clip();
    hatch(g, 0, capB, r0 * 1.2, shaftH, 2.4, Math.PI / 2, 0.32);
    g.restore();
    // necking, echinus and abacus
    var ny = capB;
    line(g, -r1, ny, r1, ny, 0.7, 0.8); line(g, -r1, ny - 3, r1, ny - 3, 0.5, 0.6);
    var abH = cap / PHI / PHI, eH = cap - abH - 3;
    g.beginPath(); g.moveTo(-r1, ny - 3);
    g.quadraticCurveTo(-r1 * 1.55, ny - 3 - eH * 0.3, -r1 * 1.42, ny - 3 - eH);
    g.lineTo(r1 * 1.42, ny - 3 - eH);
    g.quadraticCurveTo(r1 * 1.55, ny - 3 - eH * 0.3, r1, ny - 3);
    g.strokeStyle = INK + '0.8)'; g.lineWidth = 0.9; g.stroke();
    hatch(g, r1 * 0.3, ny - 3 - eH, r1 * 1.2, eH, 2.2, Math.PI / 2, 0.3);
    g.strokeRect(-r1 * 1.5, top, r1 * 3, abH);
    hatch(g, -r1 * 1.5, top + abH * 0.55, r1 * 3, abH * 0.45, 2, 0, 0.3);
    // measuring lines on the left, with ticks at the golden divisions
    var mx = -r0 * 2.3;
    line(g, mx, 0, mx, h, 0.5, 0.6);
    [0, cap, shaftB, h, cap + shaftH / PHI].forEach(function (yy) { line(g, mx - 4, yy, mx + 4, yy, 0.6, 0.6); });
    line(g, mx, cap + shaftH / PHI, -r0 * 1.1, cap + shaftH / PHI, 0.25, 0.5);
  }

  function drawCompass(g, r) {
    g.strokeStyle = INK + '0.75)'; g.lineWidth = 1;
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.lineWidth = 0.6; g.beginPath(); g.arc(0, 0, r * 0.93, 0, TAU); g.stroke();
    g.beginPath(); g.arc(0, 0, r / PHI, 0, TAU); g.stroke();
    for (var i = 0; i < 64; i++) {
      var a = i / 64 * TAU, L = i % 8 === 0 ? 0.12 : i % 4 === 0 ? 0.08 : 0.045;
      line(g, Math.cos(a) * r * 0.93, Math.sin(a) * r * 0.93, Math.cos(a) * r * (0.93 - L), Math.sin(a) * r * (0.93 - L), 0.6, 0.6);
    }
    // a sixteen-point star: each point split into a plain half and a hatched half
    for (i = 0; i < 16; i++) {
      var ang = i / 16 * TAU - Math.PI / 2, len = i % 4 === 0 ? r * 0.86 : i % 2 === 0 ? r * 0.62 : r * 0.42, wd = r * (i % 4 === 0 ? 0.09 : 0.06);
      var tip = [Math.cos(ang) * len, Math.sin(ang) * len];
      var l = [Math.cos(ang - Math.PI / 2) * wd, Math.sin(ang - Math.PI / 2) * wd], rr = [-l[0], -l[1]];
      g.beginPath(); g.moveTo(0, 0); g.lineTo(l[0], l[1]); g.lineTo(tip[0], tip[1]); g.closePath();
      g.fillStyle = 'rgba(246,239,222,1)'; g.fill(); g.strokeStyle = INK + '0.75)'; g.lineWidth = 0.7; g.stroke();
      g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(rr[0], rr[1]); g.lineTo(tip[0], tip[1]); g.closePath();
      g.fillStyle = 'rgba(246,239,222,1)'; g.fill(); g.stroke(); g.clip();
      hatch(g, -r, -r, r * 2, r * 2, 1.8, ang + 0.3, 0.45); g.restore();
    }
    g.beginPath(); g.arc(0, 0, r * 0.05, 0, TAU); g.fillStyle = INK + '0.8)'; g.fill();
    // the four cardinal letters, in the browser's own serif (no font is downloaded)
    g.fillStyle = INK + '0.75)';
    g.font = 'italic ' + Math.round(r * 0.13) + 'px Georgia, "Times New Roman", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(function (d) { g.fillText(d[0], d[1] * r * 1.1, d[2] * r * 1.1); });
  }

  // the shell: a golden spiral (×φ each quarter turn) with its chambers, pale lines on a slate plate
  function drawShell(g, s) {
    g.fillStyle = 'rgb(96,112,120)';
    g.fillRect(0, 0, s, s);
    var cx = s * 0.42, cy = s * 0.56;
    var b = Math.log(PHI) / (Math.PI / 2);
    var A = s * 0.46 / Math.exp(b * 4 * Math.PI);  // the outer whorl ends at 0.46 of the plate
    function P(th) { var r = A * Math.exp(b * th); return [cx + Math.cos(th) * r, cy + Math.sin(th) * r]; }
    // soft glow inside the shell
    var gl = g.createRadialGradient(cx, cy, 0, cx, cy, s * 0.46);
    gl.addColorStop(0, 'rgba(230,226,212,0.28)'); gl.addColorStop(1, 'rgba(230,226,212,0)');
    g.fillStyle = gl; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(236,232,218,0.85)'; g.lineWidth = 1.1;
    g.beginPath();
    for (var th = 0.6; th <= 4 * Math.PI; th += 0.04) { var p = P(th); if (th === 0.6) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }
    g.stroke();
    // the opening of the shell: from the end of the outer whorl back to the whorl inside it
    var e0 = P(4 * Math.PI), e1 = P(2 * Math.PI);
    g.beginPath(); g.moveTo(e0[0], e0[1]); g.quadraticCurveTo((e0[0] + e1[0]) / 2 + s * 0.03, (e0[1] + e1[1]) / 2, e1[0], e1[1]); g.stroke();
    // inner wall: the previous whorl, one turn back
    g.lineWidth = 0.7; g.beginPath();
    for (th = 0.6 + TAU; th <= 4 * Math.PI + TAU; th += 0.04) { p = P(th - TAU); if (th < 0.65 + TAU) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }
    // chambers: curved walls from each whorl to the one inside it
    g.stroke();
    g.lineWidth = 0.7;
    for (th = 1.4; th <= 4 * Math.PI - 0.2; th += 0.42) {
      var o = P(th), q = P(th - TAU + 0.35);
      var mx = (o[0] + q[0]) / 2 + (cx - (o[0] + q[0]) / 2) * 0.18, my = (o[1] + q[1]) / 2 + (cy - (o[1] + q[1]) / 2) * 0.18;
      g.strokeStyle = 'rgba(236,232,218,' + (0.35 + 0.35 * th / (4 * Math.PI)) + ')';
      g.beginPath(); g.moveTo(o[0], o[1]); g.quadraticCurveTo(mx, my, q[0], q[1]); g.stroke();
    }
    // the plate's thin frame and a scale bar
    g.strokeStyle = 'rgba(236,232,218,0.5)'; g.lineWidth = 0.6;
    g.strokeRect(6, 6, s - 12, s - 12);
    for (var i = 0; i <= 5; i++) { var x = 14 + i * s / PHI / PHI / 5; g.beginPath(); g.moveTo(x, s - 14); g.lineTo(x, s - (i % 5 ? 18 : 22)); g.stroke(); }
    g.beginPath(); g.moveTo(14, s - 14); g.lineTo(14 + s / PHI / PHI, s - 14); g.stroke();
  }

  function drawPaper(g, W, H, k) {
    g.fillStyle = 'rgb(' + PAPER.join(',') + ')';
    g.fillRect(0, 0, W, H);
    var r = rnd(11);
    // a few large, faint clouds of age
    for (var i = 0; i < 7; i++) {
      var x = r() * W, y = r() * H, rr = (0.2 + r() * 0.4) * Math.max(W, H);
      var gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(196,170,120,' + (0.04 + r() * 0.05).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(196,170,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    // foxing: small soft brown spots
    for (i = 0; i < 26; i++) {
      x = r() * W; y = r() * H; rr = (0.6 + r() * 2.4) * k;
      g.fillStyle = 'rgba(150,110,70,' + (0.06 + r() * 0.12).toFixed(3) + ')';
      g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
    }
    // fine grain
    var img = g.getImageData(0, 0, W, H), d = img.data;
    for (i = 0; i < d.length; i += 4) { var n = (r() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
    g.putImageData(img, 0, 0);
    // slightly darker edges
    var v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(170,140,100,0)'); v.addColorStop(1, 'rgba(170,140,100,0.16)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // ---------- instance ----------
  function mount(el, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var W = 1, H = 1, k = 1, L = null, plates = null, paper = null, lastFi = -1;
    var t0 = performance.now() - 2500, raf = 0, visible = true;
    var fixedTime = opts.time;

    // engrave one plate into its own canvas: fn draws in sheet units at (ox, oy)
    function plate(x, y, w, h, ox, oy, fn) {
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w * k)); c.height = Math.max(1, Math.ceil(h * k));
      var g = c.getContext('2d');
      g.scale(k, k); g.translate(ox, oy); g.lineCap = 'round'; g.lineJoin = 'round';
      fn(g);
      return { c: c, x: x, y: y, w: w, h: h };
    }

    function resize() {
      var r = el.getBoundingClientRect();
      if (r.width < 2) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      L = layoutFor(r.width / r.height > 1.6);
      k = W / L.UW;
      paper = document.createElement('canvas'); paper.width = W; paper.height = H;
      drawPaper(paper.getContext('2d'), W, H, k);
      var G = L.grid, C = L.column, M = L.compass, S = L.shell;
      var colW = C.h / (PHI * PHI * PHI) * 1.15;
      plates = {
        grid: plate(G.x, G.y, G.w + 2, G.h + 2, 1, 1, function (g) { drawGrid(g, G); }),
        column: plate(C.x - colW, C.y, colW * 2, C.h + 2, colW, 1, function (g) { drawColumn(g, C.h); }),
        compass: plate(M.x - M.r * 1.25, M.y - M.r * 1.25, M.r * 2.5, M.r * 2.5, M.r * 1.25, M.r * 1.25, function (g) { drawCompass(g, M.r); }),
        shell: plate(S.x, S.y, S.s, S.s, 0, 0, function (g) { drawShell(g, S.s); })
      };
      lastFi = -1;
      if (fixedTime != null) draw(fixedTime); else if (reduce.matches) draw(STILL);
    }

    // a plate, shown through a wipe (dir: 'up' from the bottom, 'right' from the left) or a fade
    function show(p, a, wipe, dir) {
      if (a <= 0.002 && wipe <= 0.002) return;
      ctx.save();
      ctx.globalAlpha = a;
      var x = p.x * k, y = p.y * k, w = p.c.width, h = p.c.height;
      if (wipe < 1) {
        ctx.beginPath();
        if (dir === 'up') ctx.rect(x, y + h * (1 - wipe), w, h * wipe + 1);
        else ctx.rect(x, y, w * wipe + 1, h);
        ctx.clip();
      }
      ctx.drawImage(p.c, x, y);
      ctx.restore();
    }

    function curve(T) {
      var p = smooth(8.8, 12.2, T), out = smooth(20.2, 21.8, T);
      if (p <= 0.002 || out >= 0.998) return;
      var C = L.curve, n = 80, m = Math.floor(n * p);
      ctx.save();
      ctx.globalAlpha = 1 - out;
      ctx.strokeStyle = INK + '0.55)'; ctx.lineWidth = Math.max(0.6, 0.8 * k);
      ctx.setLineDash([6 * k, 4 * k]);
      ctx.beginPath();
      function B(t) {
        var u = 1 - t;
        return [(u * u * u * C[0][0] + 3 * u * u * t * C[1][0] + 3 * u * t * t * C[2][0] + t * t * t * C[3][0]) * k,
                (u * u * u * C[0][1] + 3 * u * u * t * C[1][1] + 3 * u * t * t * C[2][1] + t * t * t * C[3][1]) * k];
      }
      for (var i = 0; i <= m; i++) { var q = B(i / n); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.stroke();
      ctx.setLineDash([]);
      // survey marks at the golden points of the curve
      [1 / (PHI * PHI), 1 / PHI].forEach(function (t) {
        if (t > p) return;
        var q = B(t), s = 5 * k;
        ctx.beginPath(); ctx.moveTo(q[0] - s, q[1]); ctx.lineTo(q[0] + s, q[1]); ctx.moveTo(q[0], q[1] - s); ctx.lineTo(q[0], q[1] + s); ctx.stroke();
        ctx.beginPath(); ctx.arc(q[0], q[1], s * 0.6, 0, TAU); ctx.stroke();
      });
      ctx.restore();
    }

    function draw(time) {
      var T = ((time % LOOP) + LOOP) % LOOP;
      var fi = Math.floor(T * FPS + 1e-6) % FRAMES;
      T = fi / FPS;
      lastFi = fi;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(paper, 0, 0);

      // the plates arrive one by one, and leave together at the end
      var gone = 1 - smooth(20.4, 22.6, T);
      show(plates.grid, smooth(0.8, 2.6, T) * gone, 1, 'right');
      show(plates.column, gone, smooth(2.2, 5.2, T), 'up');
      show(plates.compass, smooth(4.6, 6.6, T) * gone, 1);
      show(plates.shell, smooth(6.4, 8.4, T) * gone, 1);
      curve(T);

      // colour squares: slide in, trade places slowly, slide out
      var move = smooth(13.4, 17.6, T);
      L.rects.forEach(function (R, i) {
        var tin = 9.6 + i * 0.42, tout = 19.6 + (L.rects.length - 1 - i) * 0.18;
        var a = smooth(tin, tin + 1.2, T) * (1 - smooth(tout, tout + 1.4, T));
        if (a <= 0.002) return;
        var slide = (1 - smooth(tin, tin + 1.6, T)) * 40 + smooth(tout, tout + 1.6, T) * 40;
        var x = lerp(R.a[0], R.b[0], move), y = lerp(R.a[1], R.b[1], move), w = lerp(R.a[2], R.b[2], move), h = lerp(R.a[3], R.b[3], move);
        var dx = (i % 2 ? 1 : -1) * slide, dy = (i % 3 === 0 ? -1 : 0) * slide * 0.4;
        ctx.globalAlpha = a * (R.mode === 'over' ? 0.92 : 0.86);
        ctx.globalCompositeOperation = R.mode === 'over' ? 'source-over' : 'multiply';
        ctx.fillStyle = COLORS[R.c];
        ctx.fillRect((x + dx) * k, (y + dy) * k, w * k, h * k);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (!visible || reduce.matches || fixedTime != null) return;
      var t = (now - t0) / 1000;
      if ((Math.floor((((t % LOOP) + LOOP) % LOOP) * FPS + 1e-6) % FRAMES) !== lastFi) draw(t);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !reduce.matches && fixedTime == null) raf = requestAnimationFrame(frame); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) draw(STILL); else { lastFi = -1; start(); } });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);
    resize();
    start();
    return { draw: draw, setTime: function (t) { fixedTime = t; draw(t); }, loop: LOOP };
  }

  window.HeroCollage = { mount: mount };
  // nothing is built until the panel is actually shown (its tab starts hidden)
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-collage]'), function (el) {
      if (el.__heroCollage) return;
      function ready() { return el.getBoundingClientRect().width > 1; }
      if (ready() || !('ResizeObserver' in window)) { el.__heroCollage = mount(el); return; }
      var ro = new ResizeObserver(function () {
        if (!el.__heroCollage && ready()) { ro.disconnect(); el.__heroCollage = mount(el); }
      });
      ro.observe(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
