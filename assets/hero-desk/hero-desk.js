/* 紙と紙のあいだに墨の線を引く（紙の実際の位置から計算。外部通信なし） */
(function(){
  var box=document.querySelector('.hero-desk');if(!box)return;
  var svg=box.querySelector('.hd-line'),NS='http://www.w3.org/2000/svg';
  function draw(animate){
    var r0=box.getBoundingClientRect();if(!r0.width)return;
    svg.setAttribute('viewBox','0 0 '+r0.width+' '+r0.height);svg.textContent='';
    var s=[].slice.call(box.querySelectorAll('.hd-sheet')).filter(function(e){return e.offsetParent!==null&&getComputedStyle(e).display!=='none'});
    s.sort(function(a,b){return a.dataset.step-b.dataset.step});
    for(var i=0;i<s.length-1;i++){
      var A=s[i],B=s[i+1],p,q,c1,c2;
      /* 回転や置く動きの影響を受けない、紙の本来の位置で計算する */
      var a={left:A.offsetLeft,top:A.offsetTop,width:A.offsetWidth,height:A.offsetHeight},b={left:B.offsetLeft,top:B.offsetTop,width:B.offsetWidth,height:B.offsetHeight};a.right=a.left+a.width;b.right=b.left+b.width;
      var ax=a.left,ay=a.top,bx=b.left,by=b.top;
      if(b.left>=a.right-4){p=[ax+a.width,ay+a.height*.6];q=[bx,by+b.height*.6];var m=(q[0]-p[0])/2;c1=[p[0]+m,p[1]+18];c2=[q[0]-m,q[1]+18]}
      else if(b.right<=a.left+4){p=[ax,ay+a.height*.6];q=[bx+b.width,by+b.height*.6];var m=(p[0]-q[0])/2;c1=[p[0]-m,p[1]+18];c2=[q[0]+m,q[1]+18]}
      else{p=[ax+a.width*.5,ay+a.height];q=[bx+b.width*.5,by];var m=(q[1]-p[1])/2;c1=[p[0]+16,p[1]+m];c2=[q[0]+16,q[1]-m]}
      var d=document.createElementNS(NS,'path');d.setAttribute('d','M'+p+' C'+c1+' '+c2+' '+q);d.setAttribute('class','seg');svg.appendChild(d);
      var L=d.getTotalLength();d.style.strokeDasharray=L;d.style.strokeDashoffset=animate?L:0;d.style.animationDelay=(1.0+0.4*i)+'s';
      [p,q].forEach(function(pt,k){var c=document.createElementNS(NS,'circle');c.setAttribute('cx',pt[0]);c.setAttribute('cy',pt[1]);c.setAttribute('r',2.4);c.setAttribute('class','dot');c.style.animationDelay=(1.0+0.4*i+(k?0.6:0))+'s';if(!animate)c.style.opacity=.85;svg.appendChild(c)});
      if(!animate)d.style.animation='none';
    }
  }
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,done=false;
  function first(){if(done)return;if(!box.getBoundingClientRect().width)return;done=true;
    draw(!reduce)}
  new ResizeObserver(function(){if(done)draw(false);else first()}).observe(box);
})();
