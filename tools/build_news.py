#!/usr/bin/env python3
"""統括AI（先輩）の朝刊ページを作る。news/data/*.json（1週1ファイル）から
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
.news-hero{{display:block;margin:32px 0 0}}
.news-hero img{{display:block;width:100%;height:auto;border-radius:8px}}
.news-hero+header.hero{{padding-top:32px}}
@media (max-width:640px){{.news-hero{{margin-top:16px}}}}
</style></head>
<body><div class="wrap">
<nav class="tabs" aria-label="ページの切り替え"><a href="{up}#about">プロフィール</a><a href="{up}#samples">仕事一覧</a><a href="{up}#system">仕組み</a><a href="{up}#paper">論文</a><a href="{up}news/" class="on" aria-current="page">朝刊</a></nav>
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

NOTE = '<p class="note" style="margin-top:28px">要約は元の記事を読んだうえで統括AI（先輩）が書いたもので、内容の正確さは各出典をご確認ください。記事の権利は各出典に帰属します。</p>'
FOOT = '<footer>© 松村貴士 / ZAZOU株式会社</footer>\n</div></body></html>\n'


def make_thumb(a, p):
    """写真のない号の見出し画像 thumb.png を作る（題名・カテゴリ・日付が変わったときだけ作り直す）。"""
    import hashlib, subprocess
    key = hashlib.sha1('|'.join([a.get('category', ''), a['title'], a.get('date', a['slug'][:10])]).encode()).hexdigest()
    png, stamp = os.path.join(p, 'thumb.png'), os.path.join(p, 'thumb.key')
    if not (os.path.exists(png) and os.path.exists(stamp) and open(stamp).read() == key):
        js = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news_thumb.js')
        subprocess.run(['node', js, png, a.get('category', '今日の話題'), a['title'], a.get('date', a['slug'][:10])], check=True)
        open(stamp, 'w').write(key)
    a['thumb'] = True


def build_daily():
    """毎日の記事：news/daily/YYYY-MM-DD.json → news/d/YYYY-MM-DD/index.html。新しい順の一覧を返す。"""
    arts = []
    for f in glob.glob(os.path.join(NEWS, 'daily', '*.json')):
        a = json.load(open(f, encoding='utf-8'))
        a['slug'] = os.path.splitext(os.path.basename(f))[0]
        changed = False
        for l in a.get('links', []):
            if 'image' not in l:
                l['image'] = og_image(l['url']); changed = True
        if changed:
            json.dump({k: v for k, v in a.items() if k != 'slug'}, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        arts.append(a)
        p = os.path.join(NEWS, 'd', a['slug']); os.makedirs(p, exist_ok=True)
        if not (a.get('links') or [{}])[0].get('image'):
            make_thumb(a, p)  # 写真のない号は見出し画像を作る（11/3 松村さん）
        s = head(a['title'], a['lead'][:110], f'news/d/{a["slug"]}/', 3)
        s += f'<header class="hero"><p class="name"><a href="../../">統括AI（先輩）の朝刊</a></p><span class="tag">{E(a.get("category","今日の話題"))}</span><h1>{E(a["title"])}</h1><p class="news-meta">{E(a.get("date",a["slug"][:10]))}　発行：ZAZOU Inc.</p></header>\n<section class="news-item"><p class="lead">{E(a["lead"])}</p>'
        for sec in a.get('sections', []):
            s += f'<h3>{E(sec["heading"])}</h3>' + ''.join(f'<p>{E(x)}</p>' for x in sec['paragraphs'])
        # 出典（11/3 松村さん：URLと、どこの研究チーム・発行元かを必ず載せる）
        s += '<h3>出典</h3><ul class="sources" style="padding-left:1.2em">'
        for l in a.get('links', []):
            bits = [f'<b>{E(l["source"])}</b>']
            if l.get('title'): bits.append(f'「{E(l["title"])}」')
            if l.get('org'): bits.append(E(l['org']))
            if l.get('published'): bits.append(E(l['published']))
            bits.append(f'<a href="{E(l["url"])}" target="_blank" rel="noopener" style="word-break:break-all">{E(l["url"])}</a>')
            s += '<li style="margin:6px 0">' + '／'.join(bits) + '</li>'
        s += '</ul>'
        s += '<h3>関連記事</h3><div class="links">'
        for l in a.get('links', []):
            src = l.get('image') or ('thumb.png' if a.get('thumb') and l is a['links'][0] else '')
            img = f'<img src="{E(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">' if src else f'<div class="ph">{E(l["source"])}</div>'
            s += f'<a class="lk" href="{E(l["url"])}" target="_blank" rel="noopener">{img}<span>{E(l["source"])}<small>{E(l.get("note",""))}</small></span></a>'
        s += f'</div><p style="margin-top:24px"><a href="../../">← 統括AI（先輩）の朝刊の一覧へ</a></p>{NOTE}</section>\n' + FOOT
        open(os.path.join(p, 'index.html'), 'w', encoding='utf-8').write(s)
    arts.sort(key=lambda a: (a.get('date', a['slug'][:10]), a['slug']), reverse=True)
    # 目立つ枠（最新号）は常に日付の新しい号（11/3 松村さん）。top の固定はやめた
    return arts

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
        t = f'統括AI（先輩）の朝刊（{d["week"]}）'
        s = head(t, d['lead'][:110], f'news/{d["slug"]}/', 2)
        s += f'<header class="hero"><p class="name"><a href="../">統括AI（先輩）の朝刊</a></p><h1>{E(d["week"])}の動向</h1><p class="news-meta">更新：{E(d["updated"])}　発行：ZAZOU Inc.</p></header>\n<section>{body(d)}{NOTE}</section>\n' + FOOT
        open(os.path.join(p, 'index.html'), 'w', encoding='utf-8').write(s)
    arts = build_daily()
    latest = weeks[0]
    DESC = '階層型AIエージェントで会社の仕事を回している「統括AI（先輩）」が、エージェントに関する最新の話題を毎朝1本読み、自分たちの運用に照らして書く朝刊です。'
    s = head('統括AI（先輩）の朝刊', DESC, 'news/', 1)
    # トップ画（tools/news_hero.py が作るSVG。PCは3:1、スマホは16:9）
    s += '<picture class="news-hero"><source media="(max-width:640px)" srcset="../assets/news-hero-narrow.svg">'
    s += '<img src="../assets/news-hero-wide.svg" alt="" width="1200" height="400"></picture>\n'
    s += f'''<header class="hero"><p class="name">ZAZOU Inc. ／ ほぼ毎日更新</p><h1>統括AI（先輩）の朝刊</h1><p>{DESC}</p>
<p class="note" style="margin-top:14px">各号の構成：①記事の要約（海外の記事は日本語で）②自社のAIチームの運用から見ると ③小規模事業者にとって。元の記事へのリンクを付けています。</p></header>
'''
    def card(a, big=False):
        im = (a.get('links') or [{}])[0].get('image', '') or (f'd/{a["slug"]}/thumb.png' if a.get('thumb') else '')
        img = f'<img src="{E(im)}" alt="" loading="lazy" referrerpolicy="no-referrer">' if im else f'<div class="ph">{E(a.get("category",""))}</div>'
        extra = f'<small style="margin-top:6px;color:var(--sub)">{E(a.get("lead",""))}</small>' if big else ''
        return f'<a class="lk" href="d/{a["slug"]}/">{img}<span><small>{E(a.get("date",""))}・{E(a.get("category",""))}</small>{E(a["title"])}{extra}</span></a>'
    agent = [a for a in arts if any(sec.get('heading','').startswith('自社のAIチーム') for sec in a.get('sections', []))]
    general = [a for a in arts if a not in agent]
    if agent:
        s += '<section><h2>Latest <span class="ja">／ 最新号</span></h2><div class="links" style="grid-template-columns:1fr">' + card(agent[0], True) + '</div>'
        if len(agent) > 1:
            s += '<h2 style="margin-top:28px">Back numbers <span class="ja">／ これまでの号</span></h2><div class="links" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">' + ''.join(card(a) for a in agent[1:30]) + '</div>'
        s += '</section>\n'
    if general or weeks:
        s += '<section><h2>Before <span class="ja">／ 創刊前のAIニュース（2026年10月26日〜30日）</span></h2><p class="note">朝刊を始める前に集めた、AI業界全般の話題です。</p><div class="links" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">' + ''.join(card(a) for a in general) + '</div>'
        s += '<ul class="week-list" style="margin-top:14px">' + ''.join(f'<li><a href="{w["slug"]}/">{E(w["week"])}の話題のトピック（まとめ）</a></li>' for w in weeks) + '</ul></section>\n'
    s += f'<section>{NOTE}</section>\n' + FOOT
    open(os.path.join(NEWS, 'index.html'), 'w', encoding='utf-8').write(s)
    print('built', len(weeks), 'weeks; latest', latest['slug'])

if __name__ == '__main__':
    main()
