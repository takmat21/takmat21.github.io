/*
 * Pause button for the moving top pictures (hero-art, hero-flower, hero-mask, hero-video).
 * Each picture's script exposes el.__heroCtl { pause, resume, isPaused } once it is running;
 * this adds one small button per picture: a toggle with one name (アニメーションの一時停止)
 * and aria-pressed; its tooltip says what a click will do (一時停止 / 再生). The picture's label is kept, on an inner element.
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
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'hero-pause';
    function show(p) {
      b.setAttribute('aria-pressed', p ? 'true' : 'false');
      b.title = p ? '再生' : '一時停止';
    }
    // one fixed name; aria-pressed tells whether it is paused
    b.setAttribute('aria-label', 'アニメーションの一時停止');
    show(false);
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var c = el.__heroCtl;
      if (!c) return;
      if (c.isPaused()) c.resume(); else c.pause();
      show(c.isPaused());
    });
    el.appendChild(b);
  }
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hero-art],[data-hero-flower],[data-hero-mask],[data-hero-video]'), add);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
