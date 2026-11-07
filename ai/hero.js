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
    lis.forEach(function(li){li.classList.remove('on');});
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

  /* 画面外・タブ非表示では止める */
  if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ visible=es[0].isIntersecting; }).observe(hero); }
  document.addEventListener('visibilitychange',function(){visible=!document.hidden;});

  /* 5. 動きを止めるボタン（WCAG 2.2.2） */
  if(btn){ btn.hidden=false; btn.addEventListener('click',function(){
    paused=!paused; btn.setAttribute('aria-pressed',paused); btn.querySelector('.t').textContent=paused?'動かす':'動きを止める';
    hero.classList.toggle('paused',paused);
  }); }
})();
