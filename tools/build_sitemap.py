#!/usr/bin/env python3
"""sitemap.xml を作り直す。build_news.py の最後から build() が呼ばれる（単体実行も可）。
対象：公開してよいHTMLページ。docs/ tools/ lab/ assets/ は入れない。
<meta name="robots" content="noindex"> のページは検索に出さない意思表示なので入れない（INCLUDE_NOINDEX で切替）。
lastmod は git の最終コミット日。未コミットの変更・新規ファイルは今日の日付。"""
import os, re, subprocess, datetime, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://takmat21.github.io/'
SKIP_TOP = {'docs', 'tools', 'lab', 'assets', '.git'}
INCLUDE_NOINDEX = False

def _git(*a):
    try:
        return subprocess.run(['git', '-C', ROOT, *a], capture_output=True, text=True, check=True).stdout
    except Exception:
        return ''

def build(use_dirty=True):
    today = datetime.date.today().isoformat()
    dirty = set()
    if use_dirty:
        for l in _git('status', '--porcelain').splitlines():
            dirty.add(l[3:].strip().strip('"'))
    pages = []
    for p in glob.glob(os.path.join(ROOT, '**', 'index.html'), recursive=True):
        rel = os.path.relpath(p, ROOT)
        if rel.split(os.sep)[0] in SKIP_TOP and not rel.startswith(os.path.join('lab', 'gas') + os.sep):
            continue
        head = open(p, encoding='utf-8').read().split('</head>')[0]
        if not INCLUDE_NOINDEX and re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex', head, re.I):
            continue
        d = os.path.dirname(rel).replace(os.sep, '/')
        if rel in dirty:
            lm = today
        else:
            lm = _git('log', '-1', '--format=%cs', '--', rel).strip() or datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()
        pages.append((BASE + (d + '/' if d else ''), lm))
    pages.sort(key=lambda x: (x[0] != BASE, x[0]))
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    out += [f'<url><loc>{u}</loc><lastmod>{lm}</lastmod></url>' for u, lm in pages]
    out.append('</urlset>')
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return len(pages)

if __name__ == '__main__':
    print('sitemap.xml:', build(), 'urls')
