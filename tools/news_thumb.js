// 写真のない号の見出し画像（1200x628 PNG）を作る。
// 使い方: node tools/news_thumb.js <出力png> <カテゴリ> <題名> <日付>
// build_news.py から呼ばれる。フォントはローカルの Noto Sans JP（/root/.fonts）。
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');

const [out, category, title, date] = process.argv.slice(2);
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = title.length > 44 ? 50 : title.length > 30 ? 56 : 64;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:N;src:url(file:///root/.fonts/NotoSansJP-Regular.ttf);font-weight:400}
@font-face{font-family:N;src:url(file:///root/.fonts/NotoSansJP-Bold.ttf);font-weight:700}
html,body{margin:0;width:1200px;height:628px}
body{font-family:N,sans-serif;background:#F8F4EA;color:#2A2622;position:relative;overflow:hidden}
.band{position:absolute;left:0;top:0;bottom:0;width:18px;background:#C46D51}
.circle{position:absolute;right:-120px;bottom:-160px;width:460px;height:460px;border-radius:50%;background:#F2ECE0}
.dot{position:absolute;right:120px;top:96px;width:22px;height:22px;border-radius:50%;background:#8A9A80}
.wrap{position:absolute;left:84px;right:150px;top:72px;bottom:64px;display:flex;flex-direction:column}
.cat{display:inline-block;align-self:flex-start;font-size:26px;font-weight:700;color:#B2543C;border:2px solid #C46D51;border-radius:999px;padding:4px 22px}
h1{font-size:${size}px;line-height:1.38;font-weight:700;margin:34px 0 0;letter-spacing:.01em}
.foot{margin-top:auto;display:flex;justify-content:space-between;font-size:26px;color:#6B635B}
.foot b{color:#2A2622}
</style></head><body><div class="band"></div><div class="circle"></div><div class="dot"></div>
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
