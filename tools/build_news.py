#!/usr/bin/env python3
"""週間AI業界の最新動向ページを作る。news/data/*.json（1週1ファイル）から
news/index.html（最新週＋過去の週の一覧）と news/<週の開始日>/index.html を生成する。"""
import json, glob, os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS = os.path.join(ROOT, 'news')
CSS_V = '20261101g'
E = html.escape

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
.week-list{{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}}
.week-list li{{border-bottom:1px solid var(--line);padding:10px 0}}
</style></head>
<body><div class="wrap">
<nav class="tabs" aria-label="ページの切り替え"><a href="{up}#about">プロフィール</a><a href="{up}#samples">仕事一覧</a><a href="{up}samples/x-article/">記事</a><a href="{up}#system">仕組み</a><a href="{up}#paper">論文</a><a href="{up}news/" class="on" aria-current="page">AI動向</a></nav>
'''

def body(d):
    out = [f'<p class="lead">{E(d["lead"])}</p>']
    for it in d['items']:
        out.append(f'''<article class="news-item"><span class="tag">{E(it["category"])}</span>
<h3>{E(it["title"])}</h3>
<p>{E(it["summary"])}</p>
<p class="imp">小規模事業者にとって：{E(it["implication"])}</p>
<div class="news-meta">{E(it["date"])}　出典：<a href="{E(it["url"])}" rel="noopener">{E(it["source"])}</a></div></article>''')
    return '\n'.join(out)

NOTE = '<p class="note" style="margin-top:28px">毎週月曜に更新します。要約は出典の記事を読んだうえで当方が書いたもので、内容の正確さは各出典をご確認ください。記事の権利は各出典に帰属します。</p>'
FOOT = '<footer>© 松村貴士 / ZAZOU株式会社</footer>\n</div></body></html>\n'

def main():
    weeks = []
    for f in sorted(glob.glob(os.path.join(NEWS, 'data', '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        d['slug'] = os.path.splitext(os.path.basename(f))[0]
        weeks.append(d)
    weeks.sort(key=lambda d: d['slug'], reverse=True)
    for d in weeks:
        p = os.path.join(NEWS, d['slug']); os.makedirs(p, exist_ok=True)
        t = f'週間AI業界の最新動向（{d["week"]}）'
        s = head(t, d['lead'][:110], f'news/{d["slug"]}/', 2)
        s += f'<header class="hero"><p class="name"><a href="../">週間AI業界の最新動向</a></p><h1>{E(d["week"])}の動向</h1><p class="news-meta">更新：{E(d["updated"])}</p></header>\n<section>{body(d)}{NOTE}</section>\n' + FOOT
        open(os.path.join(p, 'index.html'), 'w', encoding='utf-8').write(s)
    latest = weeks[0]
    s = head('週間AI業界の最新動向', 'AI業界の1週間の主な動きを、出典つきで要約し、小規模事業者にとっての意味を添えて毎週更新します。', 'news/', 1)
    s += f'<header class="hero"><h1>週間AI業界の最新動向</h1><p>AI業界の1週間の主な動きを、出典つきで要約し、小規模事業者にとっての意味を添えて毎週更新します。</p></header>\n'
    s += f'<section><h2>Latest <span class="ja">／ {E(latest["week"])}</span></h2><p class="news-meta">更新：{E(latest["updated"])}</p>{body(latest)}</section>\n'
    if len(weeks) > 1:
        s += '<section><h2>Archive <span class="ja">／ 過去の週</span></h2><ul class="week-list">' + ''.join(f'<li><a href="{w["slug"]}/">{E(w["week"])}</a></li>' for w in weeks[1:]) + '</ul></section>\n'
    s += f'<section>{NOTE}</section>\n' + FOOT
    open(os.path.join(NEWS, 'index.html'), 'w', encoding='utf-8').write(s)
    print('built', len(weeks), 'weeks; latest', latest['slug'])

if __name__ == '__main__':
    main()
