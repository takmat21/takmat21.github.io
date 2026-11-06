#!/usr/bin/env python3
"""/ai/（サービスサイト）の各ページの head に canonical と OGP を入れる。何度実行しても同じ結果になる。

python3 tools/seo_head.py

- title・description はページに書かれたものを使う（本文担当が書いたものをそのまま）
- <!-- seo-head --> 〜 <!-- /seo-head --> の範囲を毎回作り直す。サイト名の仮置き【サイト名】を
  置き換えたあとに実行し直せば、og:title・og:site_name もそろう
- noindex には触らない（外すのは松村さんの指示が出てから）
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://takmat21.github.io/"
OGP = SITE + "ai/ogp.png"
BLOCK = re.compile(r"<!-- seo-head -->.*?<!-- /seo-head -->\n?", re.S)


def site_name():
    t = (ROOT / "ai" / "index.html").read_text(encoding="utf-8")
    return html.unescape(re.search(r"<title>(.*?)</title>", t, re.S).group(1)).split("｜")[0].strip()


def run():
    name = site_name()
    changed = []
    for f in sorted((ROOT / "ai").rglob("index.html")):
        t = f.read_text(encoding="utf-8")
        head = t.split("</head>")[0]
        rel = f.relative_to(ROOT).as_posix()[: -len("index.html")]
        url = SITE + rel
        title = html.unescape(re.search(r"<title>(.*?)</title>", head, re.S).group(1)).strip()
        dm = re.search(r'<meta name="description" content="([^"]*)"', head)
        desc = html.unescape(dm.group(1)) if dm else ""
        e = lambda v: html.escape(v, quote=True)
        tags = [f'<link rel="canonical" href="{url}">',
                '<meta property="og:type" content="website">',
                f'<meta property="og:site_name" content="{e(name)}">',
                f'<meta property="og:title" content="{e(title)}">',
                f'<meta property="og:description" content="{e(desc)}">',
                f'<meta property="og:url" content="{url}">',
                f'<meta property="og:image" content="{OGP}">',
                '<meta property="og:image:width" content="1200">',
                '<meta property="og:image:height" content="630">',
                '<meta property="og:locale" content="ja_JP">',
                '<meta name="twitter:card" content="summary_large_image">']
        block = "<!-- seo-head -->\n" + "\n".join(tags) + "\n<!-- /seo-head -->\n"
        new = BLOCK.sub("", t)
        new = new.replace("</head>", block + "</head>", 1)
        if new != t:
            f.write_text(new, encoding="utf-8")
            changed.append(rel)
    return changed


if __name__ == "__main__":
    print(len(run()), "pages updated")
    sys.exit(0)
