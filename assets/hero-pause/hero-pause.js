/*
 * Pause button for the moving top pictures (WCAG 2.2.2): the canvas pictures (hero-art,
 * hero-flower, hero-mask, hero-video), whose scripts expose el.__heroCtl { pause, resume,
 * isPaused }, and the paper tab's SVG picture (see addPicture).
 * One small toggle per picture, with one name (アニメーションの一時停止) and aria-pressed;
 * its tooltip says what a click will do (一時停止 / 再生). A picture's label is kept, on an inner element.
 */
(function () {
  'use strict';
  function add(el) {
    if (el.querySelector('.hero-pause')) return;
    // a role="img" container hides everything inside it from screen readers, the button too:
    // move the picture's label onto an inner element so the button stays reachable
    if (el.getAttribute('role') === 'img') {
      var lab = document.createElement('span');
      lab.setAttribute('role', 'img');
      lab.setAttribute('aria-label', el.getAttribute('aria-label') || '');
      lab.style.cssText = 'position:absolute;inset:0;pointer-events:none';
      el.removeAttribute('role'); el.removeAttribute('aria-label');
      el.insertBefore(lab, el.firstChild);
    }
    var b = button(function () {
      var c = el.__heroCtl;
      if (!c) return null;
      if (c.isPaused()) c.resume(); else c.pause();
      return c.isPaused();
    });
    el.appendChild(b);
  }
  // The paper tab's picture is an SVG shown through <img>: its CSS animation cannot be reached from
  // the page. To pause it, the same SVG is shown again with every animation held at the current
  // moment (a negative delay, paused); to go on, with that delay and running. The SVG's own styles
  // stay inside the image, so nothing leaks into the page. All its animations share one period and
  // start at 0 (tools/paper_hero.py), which is what makes the held moment exact.
  function addPicture(pic) {
    if (pic.parentNode && pic.parentNode.classList.contains('hero-pause-wrap')) return;
    var img = pic.querySelector('img'), src = pic.querySelector('source');
    if (!img) return;
    var orig = { img: img.getAttribute('src'), source: src ? src.getAttribute('srcset') : null };
    var narrow = src && src.media ? window.matchMedia(src.media) : null;
    // a <button> may not sit inside <picture>: wrap it, and let the wrapper carry the tab's class
    var wrap = document.createElement('div');
    wrap.className = 'hero-pause-wrap ' + (pic.classList.contains('paper-top') ? 'paper-top' : '');
    pic.classList.remove('paper-top');
    pic.parentNode.insertBefore(wrap, pic);
    wrap.appendChild(pic);
    var started = -1, offset = 0, paused = false, url = null, cache = {};
    function begin() { if (started < 0) started = performance.now(); }
    if (img.complete && img.naturalWidth) begin(); else img.addEventListener('load', begin, { once: true });
    function moment() { return started < 0 ? offset : offset + (performance.now() - started) / 1000; }
    function show(state, at) {
      var file = narrow && narrow.matches ? orig.source : orig.img;
      var go = function (text) {
        var rule = '*{animation-delay:-' + at.toFixed(3) + 's!important' + (state === 'paused' ? ';animation-play-state:paused!important' : '') + '}';
        var svg = text.replace(/<\/svg>\s*$/, '<style>' + rule + '</style></svg>');
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        if (src) src.setAttribute('srcset', url);
        img.setAttribute('src', url);
      };
      if (cache[file]) go(cache[file]);
      else fetch(file).then(function (r) { return r.text(); }).then(function (t) { cache[file] = t; go(t); });
    }
    var b = button(function () {
      var at = moment();
      if (!paused) { paused = true; show('paused', at); offset = at; started = -1; }
      else { paused = false; offset = at; started = performance.now(); show('running', at); }
      return paused;
    });
    wrap.appendChild(b);
  }

  // one small toggle button; onToggle returns the new paused state
  function button(onToggle) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'hero-pause';
    function show(p) { b.setAttribute('aria-pressed', p ? 'true' : 'false'); b.title = p ? '再生' : '一時停止'; }
    b.setAttribute('aria-label', 'アニメーションの一時停止');
    show(false);
    b.addEventListener('click', function (ev) { ev.stopPropagation(); var p = onToggle(); if (p != null) show(p); });
    return b;
  }

  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-art],[data-hero-flower],[data-hero-mask],[data-hero-video]'), add);
    Array.prototype.forEach.call(document.querySelectorAll('picture.paper-hero'), addPicture);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
