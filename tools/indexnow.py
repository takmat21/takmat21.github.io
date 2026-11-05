#!/usr/bin/env python3
"""IndexNow：更新したページを Bing などの検索エンジンにすぐ知らせる。

仕組み：サイト直下に「鍵の名前.txt」（中身は鍵そのもの）を置き、更新した URL の一覧と鍵を
api.indexnow.org に送る。検索エンジンは鍵のファイルを見て、送り主がサイトの持ち主だと確かめる。
鍵は公開してよい値（パスワードではない）。Bing・Yandex・Seznam などが共有する。Google は対象外。

使い方（tools/ で実行）
  python3 indexnow.py --init                 鍵を作ってサイト直下に置く（1 回だけ。作成済みなら何もしない）
  python3 indexnow.py --since 2026-11-05     sitemap の lastmod がこの日以降の URL を表示（送らない）
  python3 indexnow.py --since 2026-11-05 --send   実際に送る（外部への送信。松村さんの確認後に）

注意：鍵のファイルが公開サイトに反映された（push 後）あとでないと、送っても受け付けられない。
"""
import argparse
import json
import re
import secrets
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOST = "takmat21.github.io"
SITE = f"https://{HOST}/"
ENDPOINT = "https://api.indexnow.org/indexnow"


def find_key():
    for f in ROOT.glob("*.txt"):
        name = f.stem
        if re.fullmatch(r"[0-9a-f]{32}", name) and f.read_text(encoding="utf-8").strip() == name:
            return name
    return None


def init_key():
    k = find_key()
    if k:
        return k, False
    k = secrets.token_hex(16)
    (ROOT / f"{k}.txt").write_text(k, encoding="utf-8")
    return k, True


def urls_since(day):
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    return [u for u, d in re.findall(r"<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>", sm) if d >= day]


def send(key, urls):
    body = json.dumps({"host": HOST, "key": key, "keyLocation": f"{SITE}{key}.txt", "urlList": urls}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status  # 200 / 202 なら受付


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--init", action="store_true", help="鍵を作ってサイト直下に置く")
    ap.add_argument("--since", help="sitemap の lastmod がこの日（YYYY-MM-DD）以降の URL を対象にする")
    ap.add_argument("--send", action="store_true", help="実際に送る（付けなければ一覧を表示するだけ）")
    a = ap.parse_args()
    if a.init:
        k, made = init_key()
        print(("鍵を作りました: " if made else "鍵は作成済み: ") + f"{k}.txt")
        return
    key = find_key()
    if not key:
        sys.exit("鍵がありません。先に --init を実行してください。")
    if not a.since:
        sys.exit("--since YYYY-MM-DD を指定してください。")
    urls = urls_since(a.since)[:10000]
    print(f"対象 {len(urls)} 件")
    for u in urls:
        print(" ", u)
    if a.send and urls:
        print("送信結果:", send(key, urls))
    elif urls:
        print("（送っていません。送るときは --send を付けてください）")


if __name__ == "__main__":
    main()
