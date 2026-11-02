# AI動向ページの更新手順（社内用）

- 週のまとめ：`news/data/<週の月曜日 YYYY-MM-DD>.json`（形式は既存ファイルと同じ。items に title/category/date/source/url/announcement/reaction/implication/reaction_sources[source,url,note]）
- 毎日の記事：`news/daily/<YYYY-MM-DD>.json`
  - `{"title","category","lead","sections":[{"heading","paragraphs":[...]}],"links":[{"source","url","note"}]}`
  - 本文は約1,000字。見出しは「何が発表・発言されたか」「どう受け止められたか」「小規模事業者にとっての意味」を基本にする。
- JSON を置いたら `python3 tools/build_news.py` を実行（サムネイルは各記事の og:image を自動で取得してJSONに保存）。
- 守ること：実際に開いて読んだ記事だけを使う。要約は自分の言葉で書き、文章を写さない。数字は出典にあるものだけ。「非エンジニア」は使わない。発行：ZAZOU Inc.
