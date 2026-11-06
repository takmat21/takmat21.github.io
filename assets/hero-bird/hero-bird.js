/* Photo assets + JavaScript. No video, dependencies, tracking or network requests. */
(function(){
  'use strict';
  document.querySelectorAll('[data-hero-bird]').forEach(function(el){
    var actor=el.querySelector('.bird-actor'), wing=el.querySelector('.bird-flight');
    if(!actor||!wing)return;
    var reduce=matchMedia('(prefers-reduced-motion: reduce)');
    var visible=false,frame=0,last=0,time=0;
    var loop=16000;
    function ease(t){return 1-Math.pow(1-t,3)}
    function paint(ms){
      var t=ms%loop,x=0,y=0,rot=0,s=1,flying=false;
      // Enter from the right, slow down above the branch, and settle onto it.
      if(t<2400){
        var p=t/2400,e=ease(p);flying=true;
        x=340*(1-e);y=-115*(1-e)-32*Math.sin(Math.PI*p);
        rot=-12*(1-p);s=.86+.14*e;
      }else if(t<2750){
        var p=(t-2400)/350;flying=p<.55;
        y=3*Math.sin(p*Math.PI);rot=2*Math.sin(p*Math.PI);
      }else if(t<12000){
        var p=t-2750;
        y=.3*Math.sin(p/650);rot=.6*Math.sin(p/1900);
      }else if(t<14200){
        var p=(t-12000)/2200;flying=true;
        x=-600*p*p;y=-180*p-30*Math.sin(Math.PI*p);rot=-13*p;s=1-.14*p;
      }else{x=-650;y=-190}
      actor.classList.toggle('is-flying',flying);
      actor.style.transform='translate('+x+'%,'+y+'%) rotate('+rot+'deg) scale('+s+')';
      actor.style.opacity=t>14200?'0':'1';
      // Stylized feather stroke between the open-wing poses. The motion is a
      // lightweight photo animation, not continuous photographic video.
      wing.style.transform='scaleY('+(0.83+0.17*Math.cos(t/34))+') rotate('+(2*Math.sin(t/34))+'deg)';
    }
    function tick(now){frame=0;if(!visible||document.hidden||reduce.matches)return;
      if(last)time+=Math.min(now-last,80);last=now;paint(time);frame=requestAnimationFrame(tick);
    }
    function sync(){cancelAnimationFrame(frame);frame=0;last=0;
      if(reduce.matches){actor.classList.remove('is-flying');actor.style.transform='none';actor.style.opacity='1';return}
      if(visible&&!document.hidden)frame=requestAnimationFrame(tick);
    }
    var observer=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync()},{threshold:0.01});
    observer.observe(el);document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);
    el.addEventListener('bird-replay',function(){time=0;last=0;sync()});sync();
  });
})();
