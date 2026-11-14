// 写真のない号の見出し画像（1200x628 PNG）を作る。
// 使い方: node tools/news_thumb.js <出力png> <カテゴリ> <題名> <日付>
// build_news.py から呼ばれる。フォントはローカルの Noto Sans JP（/root/.fonts）。
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');

const [out, category, title, date, bg] = process.argv.slice(2);
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = title.length > 44 ? 50 : title.length > 30 ? 56 : 64;

// 号ごとに見た目を変える（11/5 松村さん「毎回変えて」「もっと美しく」）。題名から配色と構図を決める（同じ題名なら同じ絵）。
let h = 0; for (const ch of title + date) h = (h * 31 + ch.codePointAt(0)) >>> 0;
const PAL = [
  { bg: '#F6F1E7', fg: '#2B2520', ac: '#B8553A', g1: '#E9C9A8', sub: '#7A6E62' },
  { bg: '#0F1B2D', fg: '#F4F1EA', ac: '#E8B04B', g1: '#24466F', sub: '#9FB0C6' },
  { bg: '#EEF2EC', fg: '#1F2B22', ac: '#2E6B4E', g1: '#C3D9C6', sub: '#617064' },
  { bg: '#F4EEF0', fg: '#2E2226', ac: '#9C3D5C', g1: '#E6C3CF', sub: '#7A6870' },
  { bg: '#101615', fg: '#ECF3EF', ac: '#6FD3B0', g1: '#1B4C42', sub: '#9DB5AC' },
  { bg: '#F2F0F8', fg: '#221E33', ac: '#5546B0', g1: '#D3CDEE', sub: '#6C6684' },
  { bg: '#FBF8F2', fg: '#1C1C1C', ac: '#1F6F5C', g1: '#D2E6DE', sub: '#6B6B6B' },
  { bg: '#1E1A17', fg: '#F5EEE6', ac: '#E07A4F', g1: '#55331F', sub: '#B8A99B' },
];
const c = PAL[h % PAL.length];
const L = Math.floor(h / PAL.length) % 5;
const svgRings = `<svg width="760" height="760" viewBox="0 0 760 760" style="position:absolute;right:-250px;top:-160px">${[60,120,180,240,300,360].map(r=>`<circle cx="380" cy="380" r="${r}" fill="none" stroke="${c.ac}" stroke-opacity="${(0.55-r/900).toFixed(2)}" stroke-width="1.5"/>`).join('')}<circle cx="380" cy="380" r="12" fill="${c.ac}"/></svg>`;
const svgWaves = `<svg width="1200" height="300" viewBox="0 0 1200 300" style="position:absolute;left:0;bottom:0">${[0,1,2,3,4,5,6].map(i=>`<path d="M0 ${150+i*22} C 300 ${60+i*22}, 600 ${260+i*22}, 1200 ${110+i*22}" fill="none" stroke="${c.ac}" stroke-opacity="${(0.12+i*0.06).toFixed(2)}" stroke-width="2"/>`).join('')}</svg>`;
const svgGrid = `<svg width="400" height="628" viewBox="0 0 400 628" style="position:absolute;right:0;top:0">${Array.from({length:7},(_,i)=>Array.from({length:11},(_,j)=>{const big=((i*7+j*3+h)%6===0);return `<circle cx="${40+i*56}" cy="${34+j*56}" r="${big?7:2.5}" fill="${c.ac}" fill-opacity="${big?0.85:0.3}"/>`}).join('')).join('')}</svg>`;
const LAYOUT = [
  { deco: svgRings, wrap: 'left:88px;right:320px;top:78px;bottom:66px', k: 0.9 },
  { deco: `<div style="position:absolute;inset:0;background:radial-gradient(circle at 88% 12%, ${c.g1} 0, transparent 50%),radial-gradient(circle at 0% 100%, ${c.g1} 0, transparent 42%)"></div><div style="position:absolute;inset:28px;border:1.5px solid ${c.ac};opacity:.4;border-radius:4px"></div>`, wrap: 'left:96px;right:120px;top:84px;bottom:74px', k: 1 },
  { deco: `<div style="position:absolute;left:0;top:0;bottom:0;width:250px;background:linear-gradient(165deg, ${c.ac}, ${c.g1})"></div>`, wrap: 'left:310px;right:90px;top:84px;bottom:70px', side: true, k: 0.9 },
  { deco: svgWaves, wrap: 'left:88px;right:110px;top:76px;bottom:250px', k: 0.95 },
  { deco: svgGrid, wrap: 'left:88px;right:450px;top:78px;bottom:66px', k: 0.85 },
];
// 写真つき（tools/news_photo.py が置いた bg.jpg があるとき）：写真を全面に敷き、下を暗くして題名をのせる
const photo = bg && fs.existsSync(bg) ? 'data:image/jpeg;base64,' + fs.readFileSync(bg).toString('base64') : '';
if (photo) { c.bg = '#0E1216'; c.fg = '#FFFFFF'; c.sub = '#D9DEE5'; if (['#B8553A','#2E6B4E','#9C3D5C','#5546B0','#1F6F5C'].includes(c.ac)) c.ac = '#FFD166'; }
const lay = photo ? { deco: `<img src="${photo}" style="position:absolute;inset:0;width:1200px;height:628px;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,18,.50) 0%,rgba(8,12,18,.66) 45%,rgba(8,12,18,.90) 100%)"></div><div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:${c.ac}"></div>`, wrap: 'left:80px;right:80px;top:70px;bottom:60px', k: 0.95 } : LAYOUT[L];
const sz = Math.round(size * lay.k);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:N;src:url(file:///root/.fonts/NotoSansJP-Regular.ttf);font-weight:400}
@font-face{font-family:N;src:url(file:///root/.fonts/NotoSansJP-Bold.ttf);font-weight:700}
html,body{margin:0;width:1200px;height:628px}
body{font-family:N,sans-serif;background:${c.bg};color:${c.fg};position:relative;overflow:hidden}
.wrap{position:absolute;${lay.wrap};display:flex;flex-direction:column}
.cat{align-self:flex-start;font-size:22px;font-weight:700;letter-spacing:.18em;color:${c.ac};display:flex;align-items:center;gap:14px}
.cat:before{content:"";width:44px;height:3px;background:${c.ac};border-radius:2px}
h1{font-size:${sz}px;line-height:1.45;font-weight:700;margin:28px 0 0;letter-spacing:.02em;font-feature-settings:"palt"${photo ? ';text-shadow:0 2px 14px rgba(0,0,0,.75)' : ''}}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:baseline;font-size:22px;color:${c.sub};letter-spacing:.06em}
.foot b{color:${c.fg};font-weight:700}
.side{position:absolute;left:0;top:0;bottom:0;width:250px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:84px 0 70px 44px;box-sizing:border-box}
.side .k{font-size:24px;font-weight:700;letter-spacing:.2em}
.side .d{font-size:22px;letter-spacing:.06em;opacity:.9}
</style></head><body>${lay.deco}
${lay.side ? `<div class="side"><span class="k">${esc(category)}</span><span class="d">${esc(date)}</span></div>` : ''}
<div class="wrap">${lay.side ? '' : `<span class="cat">${esc(category)}</span>`}<h1>${esc(title)}</h1>
<div class="foot"><span><b>統括AI（先輩）の朝刊</b>　ZAZOU Inc.</span>${lay.side ? '' : `<span>${esc(date)}</span>`}</div></div>
</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 628 } });
  const tmp = path.join(os.tmpdir(), 'news_thumb_' + process.pid + '.html');
  fs.writeFileSync(tmp, html);
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, type: 'png' });
  await b.close();
  fs.unlinkSync(tmp);
})();
