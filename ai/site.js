/* ZAZOU AI Works 共通の動き（太郎）
   - スマホのメニュー開閉
   - スクロールでふわっと出る（JS が無ければ最初から見える。動きを減らす設定では動かさない）
   - 「AIに相談」チャット（ai/chat.js）を読み込む */
(function () {
  "use strict";
  var base = (document.currentScript && document.currentScript.src || "").replace(/site\.js(\?.*)?$/, "");
  document.documentElement.classList.add("js");

  // メニュー
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("gnav");
  if (btn && nav) {
    var close = function () { btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("nav-open"); };
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
      if (open) { var a = nav.querySelector("a"); if (a) a.focus(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { close(); btn.focus(); } });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    window.matchMedia("(min-width:961px)").addEventListener("change", close);
  }

  // ヘッダー：少しスクロールしたら縮めて地を濃くする
  var hd = document.querySelector(".hd");
  if (hd) {
    var onScroll = function () { hd.classList.toggle("scrolled", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // スクロールで出る
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".sec-h, .grid > *, .fit > li, .steps > li, .plans > *, .scope > *, .rules > li, .qa > div, .contact > *, .case, .rep, .co, .tw");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el, i) {
      if (el.closest(".xh, .flow, .org")) return; // ヒーローと流れ図はアヤの hero.js・parts.js が動かす
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return; // 最初の画面にあるものはそのまま見せる
      el.classList.add("rv");
      el.style.transitionDelay = (Math.min(i % 4, 3) * 80) + "ms";
      io.observe(el);
    });
  }

  // チャット
  var s = document.createElement("script");
  s.src = base + "chat.js?v=1";
  s.defer = true;
  s.dataset.base = base;
  document.head.appendChild(s);
})();
