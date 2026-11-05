#!/usr/bin/env python3
"""Google Search Console・Bing Webmaster Tools の「サイトの所有者の確認」用のメタタグを、トップの head に入れる。

使い方（tools/ で実行）
  python3 site_verify.py google <確認コード>   → <meta name="google-site-verification" content="…">
  python3 site_verify.py bing   <確認コード>   → <meta name="msvalidate.01" content="…">
同じ種類のタグがあれば置き換える（何度実行しても 1 つだけ）。確認コードは公開してよい値。
"""
import html
import re
import sys
from pathlib import Path

NAMES = {"google": "google-site-verification", "bing": "msvalidate.01"}
INDEX = Path(__file__).resolve().parent.parent / "index.html"


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in NAMES or not re.fullmatch(r"[A-Za-z0-9_\-]{8,100}", sys.argv[2]):
        sys.exit(__doc__)
    name, code = NAMES[sys.argv[1]], sys.argv[2]
    tag = f'<meta name="{name}" content="{html.escape(code)}">'
    t = INDEX.read_text(encoding="utf-8")
    pat = re.compile(rf'<meta name="{re.escape(name)}" content="[^"]*">\n?')
    t = pat.sub("", t)
    t = t.replace('<meta name="viewport"', tag + '\n<meta name="viewport"', 1)
    INDEX.write_text(t, encoding="utf-8")
    print("入れました:", tag)


if __name__ == "__main__":
    main()
