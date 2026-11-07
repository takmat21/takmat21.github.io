/* 育つ絵（太郎）：トップの見出しの右。1つのマス（最初の1業務）から、仕組みが枝を伸ばすように育つ。
   伸びる先は「光の粒 → 点の集まり → 薄い緑 → 濃い緑」と変わり、育つにつれて視点が引いていく。
   Anthropic の記事ページの「育つ」動きの考え方を参考に、形・色・描き方は自分で作ったもの。
   アヤの「動きを止める」ボタン（.xh に paused が付く）で止まる。動きを減らす設定では育ち終わった形を描く。
   画面の外・タブ非表示でも止める。 */
(function () {
  "use strict";
  var cv = document.querySelector(".xh-art canvas"); if (!cv) return;
  var ctx = cv.getContext("2d");
  var hero = cv.closest(".xh");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seed = 20261107;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var MAX = 360;                 // 育つマスの上限
  var cells = new Map();         // "x,y" → {x,y,born,tone}
  var tips = [{ x: 0, y: 0, dx: 1, dy: 0 }];
  var t0 = 0, clock = 0, radius = 1, view = 1;
  var DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
  function key(x, y) { return x + "," + y; }
  function add(x, y) {
    var k = key(x, y); if (cells.has(k)) return false;
    var d = Math.hypot(x, y);
    cells.set(k, { x: x, y: y, born: clock, ph: rnd() * 6.28, tone: d });
    radius = Math.max(radius, d + 1);
    return true;
  }
  add(0, 0);
  // 1回の成長：先端を進める・ときどき枝分かれ・中心のほうを少し太らせる
  function grow() {
    if (cells.size >= MAX) return;
    var next = [];
    tips.forEach(function (t) {
      if (rnd() < 0.16) { var turn = rnd() < 0.5 ? 1 : -1; var nd = [-t.dy * turn, t.dx * turn]; t.dx = nd[0]; t.dy = nd[1]; }
      var nx = t.x + t.dx, ny = t.y + t.dy;
      if (add(nx, ny) || rnd() < 0.5) { t.x = nx; t.y = ny; }
      next.push(t);
      if (rnd() < 0.09 && tips.length + next.length < 12) { var b = DIRS[Math.floor(rnd() * 4)]; next.push({ x: t.x, y: t.y, dx: b[0], dy: b[1] }); }
    });
    tips = next.filter(function (t) { return Math.hypot(t.x, t.y) < 16 || rnd() < 0.4; });
    if (!tips.length) tips.push({ x: 0, y: 0, dx: DIRS[Math.floor(rnd() * 4)][0], dy: DIRS[Math.floor(rnd() * 4)][1] });
    var arr = Array.from(cells.values());
    if (rnd() < 0.45) { // 中心のほうを少しだけ太らせる
      var c = arr[Math.floor(rnd() * arr.length)];
      if (Math.hypot(c.x, c.y) < radius * 0.35) { var d2 = DIRS[Math.floor(rnd() * 4)]; add(c.x + d2[0], c.y + d2[1]); }
    }
  }
  var TONES = [[29,122,90],[63,154,118],[127,195,164],[185,220,203]];
  function tileColor(c, a) { // 中心ほど濃く、生まれて時間がたつほど濃く
    var age = Math.min(1, Math.max(0, (clock - c.born - 0.9) / 1.4));
    var far = Math.min(1, c.tone / (radius * 0.9));
    var light = TONES[3], dark = TONES[Math.min(2, Math.floor(far * 3))];
    var m = age * (1 - far * 0.35);
    return "rgba(" + Math.round(light[0] + (dark[0] - light[0]) * m) + "," + Math.round(light[1] + (dark[1] - light[1]) * m) + "," + Math.round(light[2] + (dark[2] - light[2]) * m) + "," + a + ")";
  }
  var size = 0, dpr = 1;
  function resize() { var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); size = r.width; }
  function rr(x, y, w, k) { ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + w, k); ctx.arcTo(x + w, y + w, x, y + w, k); ctx.arcTo(x, y + w, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath(); }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    var want = size / (2 * radius + 3);           // 育つほど視点を引く
    view += (Math.min(size / 9, want) - view) * (reduce ? 1 : 0.025);
    var cell = view, s = cell * 0.8, cx = size / 2, cy = size / 2;
    cells.forEach(function (c) {
      var age = clock - c.born;
      var x = cx + c.x * cell - s / 2, y = cy + c.y * cell - s / 2;
      if (age < 0.45) {                              // 光の粒
        var k = age / 0.45, L = s * (0.25 + 0.3 * k);
        ctx.strokeStyle = tileColor(c, 0.9); ctx.lineWidth = Math.max(1, cell * 0.05); ctx.lineCap = "round";
        for (var q = 0; q < 8; q++) { var an = c.ph + q * Math.PI / 4, l = q % 2 ? L * 0.6 : L; ctx.beginPath(); ctx.moveTo(x + s / 2 + Math.cos(an) * s * 0.06, y + s / 2 + Math.sin(an) * s * 0.06); ctx.lineTo(x + s / 2 + Math.cos(an) * l, y + s / 2 + Math.sin(an) * l); ctx.stroke(); }
      } else if (age < 0.9) {                        // 点の集まり
        ctx.fillStyle = tileColor(c, 0.85); var g = 5, u = s / g;
        for (var i = 0; i < g; i++) for (var j = 0; j < g; j++) if ((i * 7 + j * 3 + Math.floor(c.ph * 10) + Math.floor(age * 20)) % 3) ctx.fillRect(x + i * u + u * 0.15, y + j * u + u * 0.15, u * 0.7, u * 0.7);
      } else {                                       // マス
        var a = Math.min(1, (age - 0.9) / 0.3);
        var sh = reduce ? 0 : Math.sin(clock * 0.8 + c.ph) * 0.05;
        ctx.fillStyle = tileColor(c, a * (0.95 + sh)); rr(x, y, s, s * 0.2); ctx.fill();
      }
    });
  }
  var last = 0, acc = 0, running = true, visible = true;
  function loop(now) {
    if (!running) return;
    if (!last) last = now;
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (visible && !(hero && hero.classList.contains("paused"))) {
      clock += dt; acc += dt;
      var step = cells.size < 30 ? 0.42 : cells.size < 120 ? 0.2 : 0.12;      // 最初はゆっくり、育つと少し速く
      while (acc > step) { grow(); acc -= step; }
      draw();
    }
    requestAnimationFrame(loop);
  }
  resize();
  window.addEventListener("resize", function () { resize(); draw(); });
  if (reduce) { for (var i = 0; i < 600; i++) { grow(); clock += 0.12; } clock += 5; draw(); }
  else requestAnimationFrame(loop);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; last = 0; }).observe(cv);
  document.addEventListener("visibilitychange", function () { var was = running; running = !document.hidden; last = 0; if (running && !was && !reduce) requestAnimationFrame(loop); });
})();
