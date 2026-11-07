/* 自社の仕組みの流れ図：画面に入ったら手順が順に灯り、つなぎが流れる（3回で止まる）。reduced-motion では何もしない */
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window)) return;
  var flows=document.querySelectorAll('.flow'); if(!flows.length) return;
  document.documentElement.classList.add('flow-js');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('lit');io.unobserve(e.target);}});},{threshold:.35});
  [].forEach.call(flows,function(f){[].forEach.call(f.children,function(li,i){li.style.setProperty('--i',i);});io.observe(f);});
})();
