// スクロールで札をゆっくり出す（transform と opacity だけ）。動きを減らす設定のときは何もしない。
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function(e){ io.observe(e); });
})();
// 「代表の経歴」へのリンクで折りたたみを開く
(function(){
  function oc(){ if (location.hash === '#profile') { var d = document.getElementById('profile'); if (d) { d.open = true; d.scrollIntoView(); } } }
  addEventListener('hashchange', oc); oc();
})();
