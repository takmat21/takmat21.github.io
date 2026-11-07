/* ZAZOU AI Works ヒーローの動き（アヤ）。reduced-motion では何もしない。外部ライブラリなし */
(function(){
  var hero=document.querySelector('.xh'); if(!hero) return;
  var rm=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(rm.matches) return;
  hero.classList.add('js-motion');
  var paused=false, visible=true;
  var btn=hero.querySelector('.xh-pause');

  /* 1. 数字のカウントアップ（1回だけ） */
  [].forEach.call(hero.querySelectorAll('.cnt'),function(el,i){
    var to=+el.dataset.to, t0=null, dur=1100, delay=500+i*120;
    function fmt(n){return n.toLocaleString('ja-JP');}
    el.textContent=fmt(0);
    setTimeout(function(){requestAnimationFrame(function step(ts){
      if(!t0)t0=ts; var k=Math.min(1,(ts-t0)/dur); k=1-Math.pow(1-k,3);
      el.textContent=fmt(Math.round(to*k)); if(k<1) requestAnimationFrame(step);
    });},delay);
  });

  /* 2. 流れパネル：例の業務を入れ替えながら、手順が順に灯る */
  var JOBS=[
    {job:'問い合わせメールへの返信',steps:[['h','人','手順を決める','設定済み'],['a','AI','返信を下書き','完了'],['a','AI','別のAIが点検','事実・誤字・抜け'],['h','人','確かめて送る','確認待ち']]},
    {job:'打ち合わせの議事録',steps:[['h','人','打ち合わせを録音','録音済み'],['a','AI','文字起こし','完了'],['a','AI','議事録にまとめる','決定・やること'],['h','人','確かめて残す','確認待ち']]},
    {job:'送り状のCSV作成',steps:[['t','自動','注文データを取り出す','完了'],['t','自動','B2クラウドの形式に変換','完了'],['t','自動','CSVを作成','Shift_JIS'],['h','人','確かめて発行に使う','確認待ち']]}
  ];
  var panel=hero.querySelector('.xh-panel'), list=panel&&panel.querySelector('.xp-steps'), jobEl=panel&&panel.querySelector('.xp-job');
  var bar=panel&&panel.querySelector('.xp-bar i');
  var ji=0, timers=[];
  function clear(){timers.forEach(clearTimeout);timers=[];}
  function render(j){
    var d=JOBS[j];
    jobEl.innerHTML='<span>例</span>'+d.job;
    list.innerHTML=d.steps.map(function(s,i){
      return '<li class="s'+(i+1)+'"><span class="who '+(s[0]==='a'?'a':s[0]==='t'?'t':'h')+'">'+s[1]+'</span><b>'+s[2]+'</b><span class="st'+(i===3?' wait':'')+'">'+s[3]+'</span></li>';
    }).join('');
  }
  function play(){
    if(!list) return; clear();
    panel.classList.remove('swap'); 
    var lis=list.querySelectorAll('li');
    if(bar) bar.style.transform='scaleX(0)';
    lis.forEach(function(li,i){
      timers.push(setTimeout(function(){li.classList.add('on'); if(bar) bar.style.transform='scaleX('+((i+1)/lis.length*0.92)+')';},400+i*650));
    });
    timers.push(setTimeout(next,400+lis.length*650+2600));
  }
  function next(){
    if(paused||!visible){timers.push(setTimeout(next,600));return;}
    panel.classList.add('swap');
    timers.push(setTimeout(function(){ji=(ji+1)%JOBS.length;render(ji);play();},380));
  }
  if(list){ panel.classList.add('loop'); play(); }

  /* 3. 背景：方眼の線をたどって光が流れる（PCだけ） */
  var big=window.matchMedia('(min-width: 961px) and (pointer: fine)');
  var cv=null, ctx=null, dots=[], W=0, H=0, G=48, dpr=1, raf=0;
  function setup(){
    if(!big.matches||cv) return;
    cv=document.createElement('canvas'); cv.className='xh-cv'; cv.setAttribute('aria-hidden','true');
    hero.insertBefore(cv,hero.firstChild.nextSibling); ctx=cv.getContext('2d');
    size(); for(var i=0;i<16;i++) dots.push(mk());
    loop();
  }
  function size(){ if(!cv)return; dpr=Math.min(2,window.devicePixelRatio||1); W=hero.clientWidth; H=hero.clientHeight; cv.width=W*dpr; cv.height=H*dpr; cv.style.width=W+'px'; cv.style.height=H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); }
  function mk(){ var h=Math.random()<.5; return {x:Math.floor(Math.random()*W/G)*G,y:Math.floor(Math.random()*H*0.75/G)*G,dx:h?(Math.random()<.5?1:-1):0,dy:h?0:(Math.random()<.5?1:-1),v:.6+Math.random()*1.1,len:60+Math.random()*90,life:0,max:240+Math.random()*320}; }
  function step(d){
    d.x+=d.dx*d.v; d.y+=d.dy*d.v; d.life++;
    if(Math.abs(d.x%G)<d.v&&Math.abs(d.y%G)<d.v&&Math.random()<.18){ var h=d.dx!==0; d.dx=h?0:(Math.random()<.5?1:-1); d.dy=h?(Math.random()<.5?1:-1):0; d.x=Math.round(d.x/G)*G; d.y=Math.round(d.y/G)*G; }
    if(d.life>d.max||d.x<-G||d.x>W+G||d.y<-G||d.y>H*0.8) Object.assign(d,mk());
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    dots.forEach(function(d){
      step(d);
      var a=Math.min(1,d.life/40)*Math.min(1,(d.max-d.life)/60);
      var tx=d.x-d.dx*d.len, ty=d.y-d.dy*d.len;
      var g=ctx.createLinearGradient(tx,ty,d.x,d.y); g.addColorStop(0,'rgba(47,211,160,0)'); g.addColorStop(1,'rgba(47,211,160,'+(.55*a)+')');
      ctx.strokeStyle=g; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(tx+.5,ty+.5); ctx.lineTo(d.x+.5,d.y+.5); ctx.stroke();
      ctx.fillStyle='rgba(166,245,220,'+(.9*a)+')'; ctx.beginPath(); ctx.arc(d.x+.5,d.y+.5,1.8,0,6.283); ctx.fill();
    });
  }
  function loop(){ cancelAnimationFrame(raf); if(paused||!visible||document.hidden||!cv) return; draw(); raf=requestAnimationFrame(loop); }
  setup();
  big.addEventListener&&big.addEventListener('change',function(){ if(big.matches) setup(); else if(cv){cancelAnimationFrame(raf);cv.remove();cv=null;dots=[];} });
  var rt; window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(size,150);});

  /* 4. マウスに付いてくる光（PCだけ） */
  var glow=hero.querySelector('.xh-glow'), gx=0, gy=0, tx=0, ty=0, graf=0;
  if(glow&&big.matches){
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect(); tx=e.clientX-r.left; ty=e.clientY-r.top; if(!graf) graf=requestAnimationFrame(follow); hero.classList.add('glow-on');});
    hero.addEventListener('pointerleave',function(){hero.classList.remove('glow-on');});
  }
  function follow(){ gx+=(tx-gx)*.12; gy+=(ty-gy)*.12; glow.style.transform='translate3d('+(gx-300)+'px,'+(gy-300)+'px,0)'; graf=(Math.abs(tx-gx)+Math.abs(ty-gy)>.5)?requestAnimationFrame(follow):0; }

  /* 画面外・タブ非表示では止める */
  if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ visible=es[0].isIntersecting; hero.classList.toggle('offscreen',!visible); loop(); }).observe(hero); }
  document.addEventListener('visibilitychange',loop);

  /* 5. 動きを止めるボタン（WCAG 2.2.2） */
  if(btn){ btn.hidden=false; btn.addEventListener('click',function(){
    paused=!paused; btn.setAttribute('aria-pressed',paused); btn.querySelector('.t').textContent=paused?'動かす':'動きを止める';
    hero.classList.toggle('paused',paused); if(!paused){loop();}
  }); }
})();
