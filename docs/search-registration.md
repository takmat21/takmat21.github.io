# 検索エンジンへの登録（松村さんが行う手順）

準備済み：sitemap.xml、robots.txt（AI のクローラーも許可）、/llms.txt、構造化データ、IndexNow の鍵（サイト直下の `d0ea028b4f16bdf9ffd277f980155726.txt`）。

## 松村さんの手順（3 行）

1. **Google Search Console**（https://search.google.com/search-console ）で「URL プレフィックス」に `https://takmat21.github.io/` を入れ、確認方法「HTML タグ」の `content="…"` の中身を太郎かアヤに渡す → `tools/site_verify.py google <コード>` でトップに入れて push → 「確認」を押し、サイトマップに `sitemap.xml` を登録。
2. **Bing Webmaster Tools**（https://www.bing.com/webmasters ）で「Google Search Console からインポート」を選ぶ（1 の後なら確認不要。手動にする場合は `tools/site_verify.py bing <コード>`）。
3. **IndexNow**：push のあと、更新した日に `python3 tools/indexnow.py --since YYYY-MM-DD --send` を実行（Bing などへ更新を通知。Google は対象外なので、Google は 1 のサイトマップで拾われる）。

## メモ

- 確認コードと IndexNow の鍵は公開してよい値（パスワードではない）。
- 外部への登録・送信（1〜3）は松村さんの確認後に行う（ルール141 ①）。
- 朝刊の発行（`tools/build_news.py`）のたびに sitemap と構造化データは自動で作り直される。IndexNow の送信を発行手順に足すかは、松村さんの判断。
