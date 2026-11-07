/* 「AIに相談」段階1：選択式の案内（太郎）。AIは使わない。外部への送信・記録はしない。
   質問と答えは ai/chat.json。段階2（本物のAI）では answer() を差し替える。 */
(function () {
  "use strict";
  var me = document.currentScript;
  var base = (me && me.dataset.base) || "";
  var css = document.createElement("link");
  css.rel = "stylesheet"; css.href = base + "chat.css?v=2";
  document.head.appendChild(css);

  var data = null, panel, log, opener, lastFocus;
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var href = function (h) { return /^(mailto:|tel:|https?:)/.test(h) ? h : base + h; };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bubble(who, lines) {
    var b = el("div", "zc-msg zc-" + who);
    (Array.isArray(lines) ? lines : [lines]).forEach(function (t) { b.appendChild(el("p", null, t)); });
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function choices(list) {
    var old = log.querySelector(".zc-choices"); if (old) old.remove();
    var box = el("div", "zc-choices");
    list.forEach(function (c) {
      var x;
      if (c.href) { x = el("a", "zc-choice" + (c.primary ? " zc-primary" : ""), c.label); x.href = href(c.href); }
      else { x = el("button", "zc-choice", c.label); x.type = "button"; x.addEventListener("click", c.onClick); }
      box.appendChild(x);
    });
    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
    return box;
  }

  // 段階2で本物のAIに替えるときは、ここを差し替える（今は JSON の答えをそのまま返す）
  function answer(topic) { return Promise.resolve(topic.a); }

  function menu(first) {
    var list = data.topics.map(function (t) {
      return { label: t.q, onClick: function () { ask(t); } };
    });
    list.push({ label: "相談を申し込む", onClick: closing });
    var box = choices(list);
    if (first) { var f = box.querySelector("button, a"); if (f) f.focus(); }
  }

  function ask(t) {
    bubble("you", t.q);
    answer(t).then(function (lines) {
      bubble("bot", lines);
      var next = [];
      if (t.link) next.push({ label: t.link.label, href: t.link.href });
      next.push({ label: "ほかの質問を見る", onClick: function () { menu(false); } });
      next.push({ label: "相談を申し込む", onClick: closing });
      var box = choices(next); var f = box.querySelector("button, a"); if (f) f.focus();
    });
  }

  function closing() {
    bubble("bot", data.closing);
    var box = choices(data.actions.concat([{ label: "ほかの質問を見る", onClick: function () { menu(false); } }]));
    var f = box.querySelector("a, button"); if (f) f.focus();
  }

  function build() {
    opener = el("button", "zc-open");
    opener.type = "button";
    opener.setAttribute("aria-haspopup", "dialog");
    opener.setAttribute("aria-controls", "zc-panel");
    opener.setAttribute("aria-expanded", "false");
    opener.appendChild(el("span", "zc-dot")); opener.appendChild(el("span", null, "AIに相談"));
    opener.addEventListener("click", open);

    panel = el("div", "zc-panel");
    panel.id = "zc-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "zc-title");
    panel.hidden = true;
    var head = el("div", "zc-head");
    var title = el("p", "zc-title"); title.id = "zc-title";
    title.appendChild(el("span", "zc-dot")); title.appendChild(document.createTextNode(data.title));
    var x = el("button", "zc-close"); x.type = "button"; x.setAttribute("aria-label", "閉じる"); x.textContent = "×";
    x.addEventListener("click", close);
    head.appendChild(title); head.appendChild(x);
    log = el("div", "zc-log"); log.setAttribute("aria-live", "polite");
    log.appendChild(el("p", "zc-disc", data.disclaimer));
    panel.appendChild(head); panel.appendChild(log);
    document.body.appendChild(panel); document.body.appendChild(opener);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  function open() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    if (!reduce) { panel.classList.remove("zc-in"); void panel.offsetWidth; panel.classList.add("zc-in"); }
    opener.setAttribute("aria-expanded", "true");
    document.body.classList.add("zc-opened");
    if (!log.querySelector(".zc-msg")) { bubble("bot", data.greeting); menu(true); }
    else { var f = log.querySelector(".zc-choices button, .zc-choices a"); if (f) f.focus(); }
  }

  function close() {
    panel.hidden = true;
    opener.setAttribute("aria-expanded", "false");
    document.body.classList.remove("zc-opened");
    opener.focus();
  }

  fetch(base + "chat.json?v=1").then(function (r) { return r.json(); }).then(function (j) { data = j; build(); })
    .catch(function () { /* 読めなければボタンを出さない（ページはそのまま使える） */ });
})();
