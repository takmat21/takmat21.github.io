#!/usr/bin/env python3
"""週間AI業界の最新動向ページを作る。news/data/*.json（1週1ファイル）から
news/index.html（最新週＋過去の週の一覧）と news/<週の開始日>/index.html を生成する。"""
import json, glob, os, html, re, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS = os.path.join(ROOT, 'news')
CSS_V = '20261101g'
E = html.escape

def og_image(url):
    """記事ページの og:image（SNSで共有したときに出るサムネイル）のURLを取る。取れなければ空。"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        t = urllib.request.urlopen(req, timeout=15).read(400000).decode('utf-8', 'ignore')
    except Exception:
        return ''
    for pat in (r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)'):
        m = re.search(pat, t, re.I)
        if m:
            u = html.unescape(m.group(1))
            if u.startswith('//'): u = 'https:' + u
            return u if u.startswith('http') else ''
    return ''

def fill_images(d, path):
    """サムネイルのURLが未取得の記事だけ取りに行き、JSONに保存する（次回からは取りに行かない）。"""
    changed = False
    for it in d['items']:
        if 'image' not in it:
            it['image'] = og_image(it['url']); changed = True
        for r in it.get('reaction_sources') or []:
            if 'image' not in r:
                r['image'] = og_image(r['url']); changed = True
    if changed:
        json.dump({k: v for k, v in d.items() if k != 'slug'}, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

def head(title, desc, url, depth):
    up = '../' * depth
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(title)}｜松村貴士</title>
<link rel="icon" href="{up}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{up}assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:title" content="{E(title)}｜松村貴士">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="https://takmat21.github.io/{url}">
<meta property="og:image" content="https://takmat21.github.io/assets/ogp.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="description" content="{E(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{up}assets/style.css?v={CSS_V}">
<style>
.news-item{{border-top:1px solid var(--line);padding:20px 0}}
.news-item h3{{font-size:17px;line-height:1.6;margin:6px 0 8px}}
.news-item p{{margin:0 0 8px;font-size:15px}}
.news-item .imp{{color:var(--sub);font-size:14px;border-left:3px solid var(--accent);padding-left:10px}}
.news-meta{{font-family:var(--mono);font-size:12px;color:var(--faint)}}
.news-meta a{{color:var(--faint)}}
.links{{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:12px 0 4px}}
.lk{{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:6px;overflow:hidden;text-decoration:none;color:inherit;background:var(--bg)}}
.lk:hover{{border-color:var(--accent)}}
.lk img{{width:100%;aspect-ratio:1.91/1;object-fit:cover;display:block;background:var(--soft)}}
.lk .ph{{width:100%;aspect-ratio:1.91/1;background:var(--soft);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;color:var(--faint)}}
.lk span{{padding:8px 10px;font-size:13px;line-height:1.5}}
.lk small{{display:block;color:var(--faint);font-size:12px}}
.week-list{{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}}
.week-list li{{border-bottom:1px solid var(--line);padding:10px 0}}
</style></head>
<body><div class="wrap">
<nav class="tabs" aria-label="ページの切り替え"><a href="{up}#about">プロフィール</a><a href="{up}#samples">仕事一覧</a><a href="{up}samples/x-article/">記事</a><a href="{up}#system">仕組み</a><a href="{up}#paper">論文</a><a href="{up}news/" class="on" aria-current="page">AI動向</a></nav>
'''

def body(d):
    out = [f'<p class="lead">{E(d["lead"])}</p>']
    for it in d['items']:
        parts = [f'<article class="news-item"><span class="tag">{E(it["category"])}</span>', f'<h3>{E(it["title"])}</h3>']
        if it.get('announcement'):
            parts.append(f'<p><strong>発表・発言：</strong>{E(it["announcement"])}</p>')
        if it.get('reaction'):
            parts.append(f'<p><strong>反応：</strong>{E(it["reaction"])}</p>')
        if it.get('summary'):
            parts.append(f'<p>{E(it["summary"])}</p>')
        parts.append(f'<p class="imp">小規模事業者にとって：{E(it["implication"])}</p>')
        links = [{'source': it['source'], 'url': it['url'], 'image': it.get('image', ''), 'note': '公式・一次情報'}] + list(it.get('reaction_sources') or [])
        cards = []
        for r in links:
            img = f'<img src="{E(r["image"])}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<div class=ph>{E(r["source"])}</div>\'">' if r.get('image') else f'<div class="ph">{E(r["source"])}</div>'
            cards.append(f'<a class="lk" href="{E(r["url"])}" target="_blank" rel="noopener">{img}<span>{E(r["source"])}<small>{E(r.get("note",""))}</small></span></a>')
        parts.append('<div class="links">' + ''.join(cards) + '</div>')
        parts.append(f'<div class="news-meta">{E(it["date"])}</div></article>')
        out.append('\n'.join(parts))
    return '\n'.join(out)

NOTE = '<p class="note" style="margin-top:28px">毎週月曜に更新します。要約は出典の記事を読んだうえで当方が書いたもので、内容の正確さは各出典をご確認ください。記事の権利は各出典に帰属します。</p>'
FOOT = '<footer>© 松村貴士 / ZAZOU株式会社</footer>\n</div></body></html>\n'

def main():
    weeks = []
    for f in sorted(glob.glob(os.path.join(NEWS, 'data', '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        d['slug'] = os.path.splitext(os.path.basename(f))[0]
        fill_images(d, f)
        weeks.append(d)
    weeks.sort(key=lambda d: d['slug'], reverse=True)
    for d in weeks:
        p = os.path.join(NEWS, d['slug']); os.makedirs(p, exist_ok=True)
        t = f'週間AI業界の最新動向（{d["week"]}）'
        s = head(t, d['lead'][:110], f'news/{d["slug"]}/', 2)
        s += f'<header class="hero"><p class="name"><a href="../">週間AI業界の最新動向</a></p><h1>{E(d["week"])}の動向</h1><p class="news-meta">更新：{E(d["updated"])}　発行：ZAZOU Inc.</p></header>\n<section>{body(d)}{NOTE}</section>\n' + FOOT
        open(os.path.join(p, 'index.html'), 'w', encoding='utf-8').write(s)
    latest = weeks[0]
    s = head('週間AI業界の最新動向', 'AI業界でその週に話題になったトピックを、公式の発表・発言とその反応に分けて出典つきでまとめ、小規模事業者にとっての意味を添えて毎週更新します。', 'news/', 1)
    s += f'<header class="hero"><h1>週間AI業界の最新動向</h1><p>AI業界でその週に話題になったトピックを、公式の発表・発言とその反応に分けて出典つきでまとめ、小規模事業者にとっての意味を添えて毎週更新します。</p></header>\n'
    s += f'<section><h2>Latest <span class="ja">／ {E(latest["week"])}</span></h2><p class="news-meta">更新：{E(latest["updated"])}　発行：ZAZOU Inc.</p>{body(latest)}</section>\n'
    if len(weeks) > 1:
        s += '<section><h2>Archive <span class="ja">／ 過去の週</span></h2><ul class="week-list">' + ''.join(f'<li><a href="{w["slug"]}/">{E(w["week"])}</a></li>' for w in weeks[1:]) + '</ul></section>\n'
    s += f'<section>{NOTE}</section>\n' + FOOT
    open(os.path.join(NEWS, 'index.html'), 'w', encoding='utf-8').write(s)
    print('built', len(weeks), 'weeks; latest', latest['slug'])

if __name__ == '__main__':
    main()
