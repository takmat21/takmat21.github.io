"""各ページに JSON-LD（構造化データ）を入れる。何度実行しても同じ結果になる。

python3 tools/seo_jsonld.py [repo_dir]   （build_news.py の最後からも run() が呼ばれる）

- 入れる場所: </head> の直前。目印 id="ld-auto" の <script> を置き換える（無ければ足す）
- トップは既存の @graph を事実シートの確認済みの事実で補強する（id="ld-site"）
- 値は各ページの title / description / canonical / og:image と sitemap.xml の lastmod から取る
- 料金・FAQ は本文から読み取って入れる（本文に無い内容は書かない）：
  <table class="price">（見出しに「料金」の列がある表）→ Offer、<dl class="qa"> → FAQPage
- samples/sites/ の下層（見本サイト・架空）は noindex でも WebPage だけを入れる。LocalBusiness・Organization・料金・FAQ は付けない。
  一覧ページ samples/sites/ は実在のご案内なので、料金・FAQ も入れる（11/5 アヤ・先輩4）
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://takmat21.github.io/"
# 他のページからの参照でも意味が通るよう、種類・名前・URL も付ける
ORG = {"@type": "Organization", "@id": SITE + "#org", "name": "ZAZOU株式会社", "url": SITE}
PERSON = {"@type": "Person", "@id": SITE + "#person", "name": "松村貴士", "url": SITE}
WEBSITE = {"@type": "WebSite", "@id": SITE + "#site", "name": "ZAZOU Lab", "url": SITE}
OGP = SITE + "assets/ogp.png"

lastmod = {}


def meta(head, prop):
    m = re.search(rf'<meta (?:name|property)="{re.escape(prop)}" content="([^"]*)"', head)
    return html.unescape(m.group(1)) if m else None


def strip_site(t):
    return re.sub(r"\s*[｜|]\s*(ZAZOU Lab|松村貴士)\s*$", "", t).strip()


def _txt(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h))).strip()


def faq_of(page_html):
    """<dl class="qa"> の dt（質問）と dd（答え）を本文の文言のまま取り出す。"""
    out = []
    for dl in re.findall(r'<dl class="qa">(.*?)</dl>', page_html, re.S):
        for q, a in re.findall(r"<dt>(.*?)</dt>\s*<dd>(.*?)</dd>", dl, re.S):
            out.append({"@type": "Question", "name": _txt(q),
                        "acceptedAnswer": {"@type": "Answer", "text": _txt(a)}})
    return out


def offers_of(page_html, url):
    """見出しに「料金」の列がある <table class="price"> の行を Offer にする（税込の表示どおり）。"""
    offers = []
    for tm in re.finditer(r'<table class="(?:[^"]*\s)?price(?:\s[^"]*)?">(.*?)</table>', page_html, re.S):
        tb = tm.group(1)
        # 税込か税別かは、表とその前後の表記で決める（どちらも無ければ書かない）
        near = _txt(page_html[max(0, tm.start() - 600):tm.end() + 400])
        tax = False if re.search(r"税別|税抜", near) else True if "税込" in near else None
        head = re.search(r"<thead>(.*?)</thead>", tb, re.S)
        if not head or "料金" not in _txt(head.group(1)):
            continue
        for row in re.findall(r"<tr>(.*?)</tr>", re.search(r"<tbody>(.*?)</tbody>", tb, re.S).group(1), re.S):
            cells = [_txt(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)]
            if len(cells) < 2:
                continue
            m = re.fullmatch(r"(月)?([\d,]+)円(〜)?(／月|/月|／時間|/時間)?", cells[-1].replace(" ", ""))
            if not m:
                continue
            spec = {"@type": "UnitPriceSpecification", "price": int(m.group(2).replace(",", "")),
                    "priceCurrency": "JPY"}
            if m.group(3):  # 「〜」＝この金額から
                spec["minPrice"] = spec["price"]
            if tax is not None:
                spec["valueAddedTaxIncluded"] = tax
            unit = (m.group(1) or "") + (m.group(4) or "")
            if "月" in unit:
                spec["unitCode"] = "MON"
            if "時間" in unit:
                spec["unitCode"] = "HUR"
            offers.append({"@type": "Offer", "name": cells[0], "description": " ".join(cells[1:-1]),
                           "price": spec["price"], "priceCurrency": "JPY", "priceSpecification": spec, "url": url})
    return offers


def intl_tel(t):
    """電話番号を国際表記に（090-6373-7945 / 09063737945 → +81-90-6373-7945）。"""
    if t.startswith("+"):
        return t
    d = re.sub(r"\D", "", t)
    if len(d) == 11 and d[:3] in ("090", "080", "070", "050"):
        return f"+81-{d[1:3]}-{d[3:7]}-{d[7:]}"
    return "+81-" + d.lstrip("0")


def crumb(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}


# ---------------------------------------------------------------- トップ（事実シートの確認済み事項のみ）
SERVICES = [  # サイトのトップ「できること」の文面どおり
    ("資料作成・リサーチ", "一次情報（公式サイト・公募要領など）で確かめ、出典を添えてまとめます。PowerPoint・Googleスライド・PDF。"),
    ("業務改善（スプレッドシート・GAS）", "期限の通知、週次の集計、入力チェックなど、毎週の手作業を仕組みにします。"),
    ("図面から見積書作成", "図面を読んで寸法・材質・溶接箇所を拾い出し、材料取り・加工工数・積算から見積書まで仕上げます。", SITE + "samples/drawing-estimate/"),
    ("EC・商品企画", "Amazon・Yahoo!ショッピング・BASEでの販売。Makuakeでは企画から撮影・文章・広告・発送まで一人で担当。"),
    ("AIの業務活用（誤りを防ぐ仕組みつき）", "AIには事実をまとめた表だけを使わせ、別のAIによる二重チェックと人の最終確認を通してから外に出します。"),
]
TOP = {"@context": "https://schema.org", "@graph": [
    {"@type": "WebSite", "@id": SITE + "#site", "name": "ZAZOU Lab", "url": SITE, "inLanguage": "ja", "publisher": ORG},
    {"@type": "Person", "@id": SITE + "#person", "name": "松村貴士", "alternateName": "マツムラ タカシ",
     "jobTitle": "代表取締役／AIエージェント・業務自動化エンジニア", "url": SITE,
     "address": {"@type": "PostalAddress", "addressRegion": "滋賀県", "addressCountry": "JP"},
     "alumniOf": {"@type": "CollegeOrUniversity", "name": "京都産業大学"},
     "worksFor": ORG,
     "knowsAbout": ["AIエージェントの運用", "Claude", "ChatGPT", "Google Apps Script", "業務自動化",
                    "機構設計", "2D図面", "CATIA", "NX", "SolidWorks", "見積・積算", "EC運営"],
     "sameAs": ["https://note.com/takashimatsumura"]},
    {"@type": "Organization", "@id": SITE + "#org", "name": "ZAZOU株式会社", "alternateName": "ZAZOU Inc.",
     "foundingDate": "2020-06-05", "founder": PERSON, "url": SITE,
     "address": {"@type": "PostalAddress", "addressLocality": "蒲生郡日野町", "addressRegion": "滋賀県", "addressCountry": "JP"},
     "sameAs": ["https://koorogi.site/", "https://www.youtube.com/@SOCRAchannel"],
     "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": s[0], "description": s[1],
                                                       "provider": ORG, "areaServed": "JP",
                                                       **({"url": s[2]} if len(s) > 2 else {})}} for s in SERVICES]},
]}


def page_ld(rel, head):
    url = SITE + rel
    title = strip_site(html.unescape(re.search(r"<title>(.*?)</title>", head, re.S).group(1)))
    desc = meta(head, "description")
    img = meta(head, "og:image") or OGP
    mod = lastmod.get(url)
    base = {"inLanguage": "ja", "isPartOf": WEBSITE, "url": url, "name": title}
    if desc:
        base["description"] = desc
    home = ("ホーム", SITE)
    if rel.startswith("ai/"):
        return ai_page_ld(rel, head, base, img)
    if rel.startswith("samples/sites/") and rel != "samples/sites/":
        page = {"@type": "WebPage", **base, "creator": ORG,
                "about": "制作の見本として作った架空のサイト（実在の店舗・会社ではありません）"}
        return [page]
    if rel.startswith("news/d/") and (ROOT / rel / "thumb.png").exists():
        img = SITE + rel + "thumb.png"
    if rel.startswith("news/d/") or re.match(r"news/\d{4}-\d{2}-\d{2}/", rel):
        d = re.search(r"(\d{4}-\d{2}-\d{2})", rel).group(1)
        art = {"@type": "NewsArticle", "headline": title[:110], "datePublished": d, "image": [img],
               "author": ORG, "publisher": ORG, "mainEntityOfPage": url, **base}
        if mod and mod >= d:
            art["dateModified"] = mod
        return [art, crumb([home, ("朝刊", SITE + "news/"), (title, url)])]
    if rel == "news/":
        return [{"@type": "CollectionPage", **base, "publisher": ORG}, crumb([home, ("朝刊", url)])]
    if rel.startswith("paper"):
        art = {"@type": "Article", "headline": title[:110], "author": ORG, "publisher": ORG, "image": [img],
               "mainEntityOfPage": url, **base}
        if mod:
            art["dateModified"] = mod
        return [art, crumb([home, ("論文", url)])]
    if rel.startswith("samples/"):
        return [{"@type": "CreativeWork", "creator": PERSON, "publisher": ORG, "image": img, **base},
                crumb([home, ("仕事一覧", SITE + "#samples"), (title, url)])]
    return [{"@type": "WebPage", "publisher": ORG, **base}, crumb([home, (title, url)])]


def put(text, sid, data):
    block = f'<script type="application/ld+json" id="{sid}">{json.dumps(data, ensure_ascii=False, separators=(",", ":"))}</script>\n'
    pat = re.compile(rf'<script type="application/ld\+json" id="{sid}">.*?</script>\n?', re.S)
    if pat.search(text):
        return pat.sub(lambda m: block, text, count=1)
    return text.replace("</head>", block + "</head>", 1)


def ai_site_name():
    """/ai/ のサイト名（ai/index.html の title の「｜」より前）。"""
    f = ROOT / "ai" / "index.html"
    if not f.exists():
        return "AI業務の仕組み化"
    t = html.unescape(re.search(r"<title>(.*?)</title>", f.read_text(encoding="utf-8"), re.S).group(1))
    return t.split("｜")[0].strip()


def ai_org(page_html):
    """会社の情報（事実シートの確認済み事項）＋そのページの連絡先。"""
    org = json.loads(json.dumps(TOP["@graph"][2]))
    org.pop("makesOffer", None)
    mails = sorted(set(re.findall(r'href="mailto:([^"?]+)', page_html)))
    tels = sorted(set(re.findall(r'href="tel:([^"]+)"', page_html)))
    if mails or tels:
        cp = {"@type": "ContactPoint", "contactType": "customer service", "availableLanguage": "ja", "areaServed": "JP"}
        if mails:
            cp["email"] = mails[0]
        if tels:
            cp["telephone"] = intl_tel(tels[0])
        org["contactPoint"] = cp
    return org


def ai_page_ld(rel, head, base, img):
    """/ai/ の各ページ：ページの種類＋パンくず。料金・FAQ は run() で本文から足す。"""
    site = ai_site_name()
    root = SITE + "ai/"
    name = base["name"].split("｜")[0].strip()
    page = AI_PAGES.get(rel, "WebPage")
    graph = [{"@type": page, **base, "publisher": ORG, "image": img}]
    if rel == "ai/":
        graph.append({"@type": "Service", "name": "AIで業務を仕組み化する", "serviceType": "業務の仕組み化（AI・自動化）",
                      "provider": ORG, "areaServed": "JP", "url": root, "description": base.get("description", "")})
        graph.append(crumb([(site, root)]))
    else:
        graph.append(crumb([(site, root), (name, SITE + rel)]))
    return graph


AI_PAGES = {"ai/": "WebPage", "ai/service/": "WebPage", "ai/price/": "WebPage", "ai/cases/": "CollectionPage",
            "ai/company/": "AboutPage", "ai/contact/": "ContactPage", "ai/faq/": "WebPage"}


def run(root=None):
    global ROOT, lastmod
    if root:
        ROOT = Path(root).resolve()
    sm = ROOT / "sitemap.xml"
    lastmod = dict(re.findall(r"<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>", sm.read_text(encoding="utf-8"))) if sm.exists() else {}
    changed = []
    for f in sorted(ROOT.rglob("*.html")):
        if ".git" in f.parts:
            continue
        t = f.read_text(encoding="utf-8")
        head = t.split("</head>")[0]
        rel = f.relative_to(ROOT).as_posix()
        # 見本サイトの下層（架空）は WebPage のみ。一覧ページ samples/sites/ は実在のご案内なので通常のページと同じ扱い（11/5 アヤ）
        sites = rel.startswith("samples/sites/") and rel != "samples/sites/index.html"
        draft_ai = rel.startswith("ai/")  # 公開前（noindex）でも入れておく。noindex を外すのは松村さんの指示後
        if not sites and not draft_ai and ("noindex" in head or 'rel="canonical"' not in head and rel != "index.html"):
            continue
        if sites and "<title>" not in head:
            continue
        rel = rel[:-len("index.html")] if rel.endswith("index.html") else rel
        if rel == "":
            # 既存の（id なしの）JSON-LD を補強版に置き換える
            old = re.compile(r'<script type="application/ld\+json">\s*\{"@context":"https://schema.org","@graph":.*?</script>\n?', re.S)
            new = t
            if old.search(new):
                new = old.sub("", new, count=1)
            top = json.loads(json.dumps(TOP))
            org = top["@graph"][2]
            offers = offers_of(t, SITE + "#price")
            if offers:
                org["hasOfferCatalog"] = {"@type": "OfferCatalog", "name": "料金（税込）", "itemListElement": offers}
            faq = faq_of(t)
            if faq:
                top["@graph"].append({"@type": "FAQPage", "@id": SITE + "#faq", "mainEntity": faq})
            # 連絡先：本文の mailto: / tel: のリンクがあるときだけ入れる（決定ログ85、11/6 松村さん）
            mails = sorted(set(re.findall(r'href="mailto:([^"?]+)', t)))
            tels = sorted(set(re.findall(r'href="tel:([^"]+)"', t)))
            if mails or tels:
                cp = {"@type": "ContactPoint", "contactType": "customer service", "availableLanguage": "ja", "areaServed": "JP"}
                if mails:
                    cp["email"] = mails[0]
                if tels:
                    cp["telephone"] = intl_tel(tels[0])
                org["contactPoint"] = cp
            new = put(new, "ld-site", top)
        else:
            graph = page_ld(rel, head)
            if rel in ("ai/company/", "ai/contact/"):
                graph.append(ai_org(t))
            if not sites:
                url = SITE + rel
                offers = offers_of(t, url)
                if offers:
                    sname = "AIで業務を仕組み化する" if rel.startswith("ai/") else strip_site(html.unescape(re.search(r"<title>(.*?)</title>", head, re.S).group(1)))
                    graph.append({"@type": "Service", "name": sname,
                                  "provider": ORG, "areaServed": "JP", "url": url, "offers": offers})
                faq = faq_of(t)
                if faq:
                    graph.append({"@type": "FAQPage", "url": url, "mainEntity": faq})
            new = put(t, "ld-auto", {"@context": "https://schema.org", "@graph": graph})
        if new != t:
            f.write_text(new, encoding="utf-8")
            changed.append(rel or "/")
    return changed


if __name__ == "__main__":
    print(len(run(sys.argv[1] if len(sys.argv) > 1 else None)), "pages updated")
