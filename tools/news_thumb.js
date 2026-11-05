// 写真のない号の見出し画像（1200x628 PNG）を作る。
// 使い方: node tools/news_thumb.js <出力png> <カテゴリ> <題名> <日付>
// build_news.py から呼ばれる。フォントはローカルの Noto Sans JP（/root/.fonts）。
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');

const [out, category, title, date] = process.argv.slice(2);
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = title.length > 44 ? 50 : title.length > 30 ? 56 : 64;

// 毎回ちがう見た目にする（11/5 松村さん「サムネ毎回変えて」）。題名から色と飾りを決める（同じ題名なら同じ絵）。
let h = 0; for (const c of title + date) h = (h * 31 + c.codePointAt(0)) >>> 0;
const PAL = [
  { bg: '#F8F4EA', fg: '#2A2622', ac: '#C46D51', soft: '#F2ECE0', sub: '#6B635B', pt: '#8A9A80' },
  { bg: '#EEF3F7', fg: '#1E2A36', ac: '#2F6FA8', soft: '#DDE7F0', sub: '#5A6878', pt: '#E0A23A' },
  { bg: '#F1F5EE', fg: '#22301F', ac: '#3E7D4F', soft: '#E1EBDC', sub: '#5E6B58', pt: '#C9774A' },
  { bg: '#1D2230', fg: '#F2F2F0', ac: '#F2B544', soft: '#283044', sub: '#AEB4C2', pt: '#6FC3B2' },
  { bg: '#F7EFF2', fg: '#33232A', ac: '#A8476B', soft: '#EEDDE4', sub: '#715E66', pt: '#5B8FB0' },
  { bg: '#FFFFFF', fg: '#1A1A1A', ac: '#1F6F5C', soft: '#EEF5F2', sub: '#666666', pt: '#E07A1F' },
  { bg: '#F3F0FA', fg: '#251F38', ac: '#5B4BB7', soft: '#E4DFF4', sub: '#655E7A', pt: '#E28B6B' },
  { bg: '#122B2A', fg: '#EFF5F2', ac: '#7FD1B9', soft: '#1B3A38', sub: '#A6C2BC', pt: '#F0C86A' },
];
const c = PAL[h % PAL.length];
const DECO = [
  `<div style="position:absolute;left:0;top:0;bottom:0;width:18px;background:${c.ac}"></div><div style="position:absolute;right:-120px;bottom:-160px;width:460px;height:460px;border-radius:50%;background:${c.soft}"></div><div style="position:absolute;right:120px;top:96px;width:22px;height:22px;border-radius:50%;background:${c.pt}"></div>`,
  `<div style="position:absolute;left:0;right:0;top:0;height:16px;background:${c.ac}"></div><div style="position:absolute;right:-80px;top:-80px;width:360px;height:360px;border-radius:50%;border:40px solid ${c.soft}"></div>`,
  `<div style="position:absolute;right:0;top:0;bottom:0;width:300px;background:${c.soft};transform:skewX(-12deg);transform-origin:top;right:-90px"></div><div style="position:absolute;right:70px;bottom:70px;width:60px;height:60px;background:${c.pt}"></div>`,
  `<div style="position:absolute;inset:0;background-image:radial-gradient(${c.soft} 3px,transparent 3px);background-size:36px 36px"></div><div style="position:absolute;left:0;bottom:0;width:100%;height:14px;background:${c.ac}"></div>`,
  `<div style="position:absolute;right:-40px;bottom:-40px;width:260px;height:260px;border-radius:50%;background:${c.soft}"></div><div style="position:absolute;right:170px;bottom:150px;width:90px;height:90px;border-radius:50%;background:${c.pt};opacity:.55"></div><div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:${c.ac}"></div>`,
  `<div style="position:absolute;right:-60px;bottom:-60px;width:520px;height:520px;background:repeating-linear-gradient(45deg,${c.soft} 0 18px,transparent 18px 40px)"></div><div style="position:absolute;left:84px;top:44px;width:80px;height:8px;background:${c.ac}"></div>`,
];
const deco = DECO[Math.floor(h / PAL.length) % DECO.length];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:N;src:url(file:///root/.fonts/NotoSansJP-Regular.ttf);font-weight:400}
@font-face{font-family:N;src:url(file:///root/.fonts/NotoSansJP-Bold.ttf);font-weight:700}
html,body{margin:0;width:1200px;height:628px}
body{font-family:N,sans-serif;background:${c.bg};color:${c.fg};position:relative;overflow:hidden}
.wrap{position:absolute;left:84px;right:150px;top:72px;bottom:64px;display:flex;flex-direction:column}
.cat{display:inline-block;align-self:flex-start;font-size:26px;font-weight:700;color:${c.ac};background:${c.bg};border:2px solid ${c.ac};border-radius:999px;padding:4px 22px}
h1{font-size:${size}px;line-height:1.38;font-weight:700;margin:34px 0 0;letter-spacing:.01em}
.foot{margin-top:auto;display:flex;justify-content:space-between;font-size:26px;color:${c.sub}}
.foot b{color:${c.fg}}
</style></head><body>${deco}
<div class="wrap"><span class="cat">${esc(category)}</span><h1>${esc(title)}</h1>
<div class="foot"><span><b>統括AI（先輩）の朝刊</b>　ZAZOU Inc.</span><span>${esc(date)}</span></div></div>
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
