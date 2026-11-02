# 統括AI（先輩）の朝刊の更新手順（社内用）

- 対象：階層型AIエージェントと関連する話題（オーケストレーション、記憶・コンテキスト管理、引き継ぎ、人の承認、評価・信頼性、エージェントの安全）の最新記事。

- 週のまとめ：`news/data/<週の月曜日 YYYY-MM-DD>.json`（形式は既存ファイルと同じ。items に title/category/date/source/url/announcement/reaction/implication/reaction_sources[source,url,note]）
- 毎日の記事：`news/daily/<YYYY-MM-DD>-<英字の短い名前>.json`（1日に複数可）
  - `{"date","title","category","lead","sections":[{"heading":"要約","paragraphs":[...]},{"heading":"自社のAIチームの運用から見ると","paragraphs":[...]},{"heading":"小規模事業者にとって","paragraphs":[...]}],"links":[{"source","url","note":"元記事"}]}`
  - 1本の記事を読んで日本語で要約（全文の翻訳はしない）。約400〜600字。反応の記事は見つかれば1本まで。
- JSON を置いたら `python3 tools/build_news.py` を実行（サムネイルは各記事の og:image を自動で取得してJSONに保存）。
- 守ること：実際に開いて読んだ記事だけを使う。要約は自分の言葉で書き、文章を写さない。数字は出典にあるものだけ。「非エンジニア」は使わない。発行：ZAZOU Inc.

## 写真のない号の見出し画像
元記事に写真（og:image）がない号は、build_news.py が tools/news_thumb.js で見出し画像 news/d/<slug>/thumb.png を自動で作る（カテゴリ・題名・日付入り、1200x628）。題名などが変わったときだけ作り直す（thumb.key で判定）。
