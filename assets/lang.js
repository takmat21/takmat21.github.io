/* 日本語 ⇔ English の切りかえ。訳は assets/i18n-en.json（文の中身 → 英語）。訳が無い所は日本語のまま */
(function(){
  var btn=document.getElementById('lang-btn'); if(!btn) return;
  var KEY='zl-lang', dict=null, saved=[], isEn=false, jaTitle=document.title;
  var INL={A:1,B:1,SPAN:1,WBR:1,BR:1,SMALL:1,STRONG:1,EM:1,CODE:1,I:1,SUP:1,SUB:1,MARK:1,U:1,TIME:1,ABBR:1};
  var SKIP={SCRIPT:1,STYLE:1,NOSCRIPT:1,TEMPLATE:1,svg:1,SVG:1,IFRAME:1};
  var JA=/[぀-ヿ一-鿿]/;
  function key(s){ return s.replace(/\s+/g,' ').trim(); }
  function isUnit(el){ if(!JA.test(el.textContent)) return false; if(el.querySelector('[data-tab],button,input,iframe,img,svg,picture')) return false; var c=el.getElementsByTagName('*'); for(var i=0;i<c.length;i++) if(!INL[c[i].tagName]) return false; return true; }
  function walk(el){ if(SKIP[el.tagName]||el.id==='lang-btn') return;
    if(isUnit(el)){ var en=dict[key(el.textContent)]; if(en){ saved.push([el,el.innerHTML,null]); el.innerHTML=en; el.setAttribute('lang','en'); } return; }
    for(var i=0;i<el.children.length;i++) walk(el.children[i]);
    for(var n=el.firstChild;n;n=n.nextSibling) if(n.nodeType===3&&JA.test(n.nodeValue)){ var e2=dict[key(n.nodeValue)]; if(e2){ saved.push([n,null,n.nodeValue]); n.nodeValue=n.nodeValue.replace(/\S[\s\S]*\S|\S/,e2.replace(/<[^>]+>/g,'')); } } }
  function toEn(){ if(isEn) return; isEn=true; walk(document.body); document.documentElement.lang='en'; if(dict.__title) document.title=dict.__title; btn.textContent='日本語'; btn.setAttribute('aria-label','日本語に切りかえる'); document.body.classList.add('lang-en'); }
  function toJa(){ if(!isEn) return; isEn=false; for(var i=saved.length-1;i>=0;i--){ var s=saved[i]; if(s[1]!==null){ s[0].innerHTML=s[1]; s[0].removeAttribute('lang'); } else s[0].nodeValue=s[2]; } saved=[]; document.documentElement.lang='ja'; document.title=jaTitle; btn.textContent='English'; btn.setAttribute('aria-label','Switch to English'); document.body.classList.remove('lang-en'); }
  function load(cb){ if(dict) return cb(); fetch('assets/i18n-en.json?v=20261114b').then(function(r){ return r.json(); }).then(function(j){ dict=j; cb(); }).catch(function(){ btn.textContent='English'; }); }
  function store(v){ try{ localStorage.setItem(KEY,v); }catch(e){} }
  btn.addEventListener('click',function(){ if(isEn){ toJa(); store('ja'); } else { btn.textContent='…'; load(function(){ toEn(); store('en'); }); } });
  var want=null; try{ want=localStorage.getItem(KEY); }catch(e){} var q=/[?&]lang=(en|ja)/.exec(location.search); if(q) want=q[1];
  if(want==='en') load(toEn);
})();
