// 使い方: node render.js <入力HTML> <出力PDF>
// 事前に /root/.fonts に Noto Sans JP（Regular・Bold）のTTFを入れて fc-cache -f しておく（README参照）
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [inp,out]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1123,height:794}});
await p.goto('file://'+path.resolve(inp),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
const ov=await p.evaluate(()=>[...document.querySelectorAll('.page')].map((pg,i)=>{const r=pg.getBoundingClientRect();const f=pg.querySelector('.foot').getBoundingClientRect();let m=0;pg.querySelectorAll('*').forEach(e=>{if(e.closest('.foot')||e.classList.contains('body'))return;const q=e.getBoundingClientRect();if(q.bottom>m)m=q.bottom});return {page:i+1,overflow:m>f.top-4}}));
console.log(JSON.stringify(ov));
await p.pdf({path:out,width:'297mm',height:'210mm',printBackground:true,preferCSSPageSize:true});
const els=await p.$$('.page');for(let i=0;i<els.length;i++)await els[i].screenshot({path:out.replace(/\.pdf$/,'')+`_p${i+1}.png`});await b.close()})();
