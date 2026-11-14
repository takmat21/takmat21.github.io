#!/usr/bin/env python3
"""写真のない号の見出し画像に、自由に使える写真を入れる（画像生成のAPIは使わない。料金0円）。
使い方:
  python3 tools/news_photo.py <slug> "<英語の検索語>"        … 候補を出す（番号・題・撮影者・ライセンス）
  python3 tools/news_photo.py <slug> "<英語の検索語>" <番号>  … その写真を news/d/<slug>/bg.jpg に置き、JSON に bg（出どころ）を書く
写真は Openverse（https://openverse.org）で探す。加工してよく、同じ条件で出し直す義務のないもの（CC0・パブリックドメイン・CC BY）だけ。
人の顔が主役の写真、会社のロゴや商品が主役の写真は選ばない（統括が絵を目で見て決める）。"""
import io, json, os, sys, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}

def get(url, n=30_000_000):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read(n)

def search(q):
    u = 'https://api.openverse.org/v1/images/?' + urllib.parse.urlencode({'q': q, 'license': 'cc0,pdm,by', 'aspect_ratio': 'wide', 'size': 'large', 'page_size': 12, 'mature': 'false'})
    return [r for r in json.loads(get(u))['results'] if (r.get('width') or 0) >= 1200]

def main():
    slug, q = sys.argv[1], sys.argv[2]
    rs = search(q)
    if len(sys.argv) < 4:
        for i, r in enumerate(rs):
            print(i, '|', r['title'], '|', r.get('creator'), '|', r['license'], r.get('license_version') or '', '|', r['width'], 'x', r['height'], '|', r['url'])
        return
    r = rs[int(sys.argv[3])]
    from PIL import Image
    im = Image.open(io.BytesIO(get(r['url']))).convert('RGB')
    w, h = im.size; k = max(1200 / w, 628 / h)
    im = im.resize((round(w * k), round(h * k)), Image.LANCZOS); w, h = im.size
    im = im.crop(((w - 1200) // 2, (h - 628) // 2, (w - 1200) // 2 + 1200, (h - 628) // 2 + 628))
    p = os.path.join(ROOT, 'news', 'd', slug); os.makedirs(p, exist_ok=True)
    im.save(os.path.join(p, 'bg.jpg'), quality=86)
    lic = {'cc0': 'CC0', 'pdm': 'パブリックドメイン', 'by': 'CC BY'}[r['license']] + ((' ' + r['license_version']) if r['license'] == 'by' and r.get('license_version') else '')
    f = os.path.join(ROOT, 'news', 'daily', slug + '.json'); a = json.load(open(f, encoding='utf-8'))
    a['bg'] = {'title': r['title'], 'creator': r.get('creator') or '不明', 'license': lic, 'license_url': r.get('license_url') or '', 'page': r['foreign_landing_url'], 'change': '切り抜き、暗くして文字を合成'}
    json.dump(a, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('ok', slug, a['bg'])

if __name__ == '__main__':
    main()
