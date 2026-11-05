# デザインノート（アヤ）

2026-11-05

> **このノートのルール**
> ほかのサイトから学ぶのは、レイアウト・余白・情報の並べ方・動きの考え方だけです。文章・画像・ロゴ・コードは一切コピーしません。数値は公開ガイドラインに書かれているもの、またはそこから計算したものです。各項目の下に、実際に開いて確認した参照URLを書いています。

---

## タイポグラフィ

- 本文は **16px（1rem）を基準**にする。14px 未満は原則使わない（デジタル庁）。SmartHR も本文の標準は M=16px で、S（約13.7px）や XS（12px）は「避ける」扱い。
  - https://design.digital.go.jp/dads/foundations/typography/
  - https://smarthr.design/products/design-tokens/typography/
- 文字サイズは**段階を決めて使う**。例：12 / 14 / 16 / 20 / 24 / 32 / 48px。SmartHR は 16px を基準に ×0.75・×1.2・×1.5・×2 のスケール、デジタル庁は 16〜45px を見出しと本文、48〜64px をビジュアル用にしている。思いつきで中間値を作らない。
  - https://smarthr.design/products/design-tokens/typography/
  - https://design.digital.go.jp/dads/foundations/typography/
- 太さは **400（通常）と 700（太字）の2種類に絞る**（デジタル庁は N=400 / B=700）。Web フォントの読み込みも2ウェイトで済み、軽くなる。
  - https://design.digital.go.jp/dads/foundations/typography/
- **見出しは line-height 1.25〜1.4、本文は 1.5 以上、ボタンなどのラベルは 1.0**。SmartHR は見出し 1.25 / 本文 1.5 / ラベル 1.0、デジタル庁は大見出し 1.4、本文 1.5 以上。CSS では単位なしの数値（1.5）で書く。
  - https://smarthr.design/products/design-tokens/typography/
  - https://design.digital.go.jp/dads/foundations/typography/
- フォントは **OS 標準の和文ゴシック、または Noto Sans JP**。デジタル庁は Noto Sans JP ＋ sans-serif、コードは Noto Sans Mono。SmartHR は利用者の環境（OS）を尊重する方針。
  - https://design.digital.go.jp/dads/foundations/typography/
  - https://smarthr.design/products/design-tokens/typography/
- **大きい名前と小さい補足の差をはっきりつける**。rauno.me は太い大きな名前と、小さく静かな説明文の対比で強い印象を出している。Distill はタイトルを一番目立たせ、著者名と要約を小さく薄くしている。
  - https://rauno.me/
  - https://distill.pub/
- 英語の見出しと日本語の説明は**行を分ける**（英語を大きく上、日本語を下）。Goodpatch は2言語の見出しをこの形で組んでいる。日本語の見出しは、文節の切れ目で手動改行する。
  - https://goodpatch.com/

## 日本語の行間と字間

- **本文の line-height は 1.7〜1.9**。jlreq では行間（行と行のすき間）を文字サイズの 50〜100% にし、1行が35字を超えるときは 100% 近くにするよう勧めている。line-height に直すと 1.5〜2.0 になる。1行 35〜40 字の本文なら 1.8 前後がちょうどよく、2.0 を超える必要はない（jlreq は「全角より広くする必要はない」としている）。
  - https://www.w3.org/TR/jlreq/
- **1行は最大 40 字、目安は 35 字**（jlreq の横組み）。16px 本文なら `max-width: 35em〜40em`（560〜640px）。行が長くなるときは段組みにする。
  - https://www.w3.org/TR/jlreq/
- **本文の字間は基本ベタ（0）〜ごくわずか**。W3C は本文に字間を足さないよう勧めている。デジタル庁は 26px 以下で 0.02em、28〜36px で 0.01em、大きい表示文字は 0。小さめの本文で少し広げたいときも 0.02〜0.05em まで。0.08em 以上は短い見出し・キャプションだけにする。
  - https://www.w3.org/International/articles/styling/inline-space
  - https://design.digital.go.jp/dads/foundations/typography/
- **大きい見出しは字間を少し詰める**（負の letter-spacing か `font-feature-settings: "palt"`）。palt はまず見出しだけに使う。本文に使うと強すぎることがある。句読点が詰まりすぎるときは `pwid` / `pkna` を試す。Meiryo には効かない。
  - https://ics.media/en/entry/14087/
  - https://www.w3.org/International/articles/styling/inline-space
- **和文と英数字のすき間はスペース文字で作らない**。`text-autospace: normal` を使う。目安は 1/8〜1/4em。字間（letter-spacing）と足し算になる点に注意する。
  - https://www.w3.org/International/articles/styling/inline-space
- **改行ルール**：`body` に `line-break: strict` と `overflow-wrap: anywhere` を指定し、`word-break` は normal のままにする。`keep-all` は日本語ではみ出し、`break-all` は英単語を壊すので使わない。段落の行末をそろえたいときは `text-wrap: pretty`。
  - https://ics.media/entry/240411/
- 段落頭の一字下げは、紙の組版では原則 1em（jlreq）。Web の短い文では下げずに、**段落の間を 1em 空ける**ほうが読みやすい。WCAG でも段落間 2倍まで広げられても崩れないことが求められる。
  - https://www.w3.org/TR/jlreq/
  - https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html

## 余白

- **8px を最小単位**にして、4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64px の中から選ぶ（SmartHR）。デジタル庁も 8px の倍数で、実際に使う段階は 3〜5 個ほどにする（例：8 / 24 / 64px）。
  - https://smarthr.design/products/design-tokens/spacing/
  - https://design.digital.go.jp/dads/foundations/spacing/
- **関係が近いものは近く、遠いものは遠く**。例：分類ラベル→タイトルは 8px、タイトル→本文は 24px、セクションの間は 64px（デジタル庁の作例）。画像のキャプションは、本文より画像に近づける。
  - https://design.digital.go.jp/dads/foundations/spacing/
- **セクションの間は大きく、カードの中は詰める**。rauno.me はセクション間を広く空け、カードやリンク列の中は詰めてまとまりを出している。
  - https://rauno.me/
- 段組みは **12カラム、ガター（列の間）は本文サイズの 2 倍**（16px なら 32px）。ブレークポイントは 768px の1つで十分（デジタル庁）。
  - https://design.digital.go.jp/dads/foundations/layout/
- 読み物ページは **1カラム・狭い幅**にする。leerob.com と Distill は1カラム、飾りなしで、上から下へ読むだけの構成になっている。サイドバーは置かない。
  - https://leerob.com/
  - https://distill.pub/
- 一覧の各項目の間は**広めに縦の余白**を取る（Distill、Anthropic Research）。罫線を足すより、余白で区切るほうが静かに見える。
  - https://distill.pub/
  - https://www.anthropic.com/research

## 色

- 色は**役割で決める**：メイン（ブランド）、サブ、背景、アクセント。アクセントは強調にだけ少し使う。使いすぎると統一感がなくなる（デジタル庁）。
  - https://design.digital.go.jp/dads/foundations/color/
- **文字は背景に対して 4.5:1 以上、大きな文字は 3:1 以上**。ボタンの枠・アイコン・区切り線など文字以外は 3:1 以上。
  - https://www.w3.org/TR/WCAG22/
  - https://design.digital.go.jp/dads/foundations/color/
- グレーは**白から黒までの段階（デジタル庁は 14 段階）を決めて**その中から選ぶ。薄いグレーの文字は 4.5:1 を下回りやすいので、組み合わせごとに確認する。
  - https://design.digital.go.jp/dads/foundations/color/
- リンクは**青、訪問済みは少し赤みのある紫**にし、明るさも変える（色の見え方が違う人でも見分けやすい）。色だけに頼らず、下線もつける。
  - https://design.digital.go.jp/dads/foundations/color/
  - https://design.digital.go.jp/dads/foundations/
- **色は画像に任せ、UI は無彩色に近づける**。Anthropic Research はページの色をほぼサムネイルのイラストに任せ、文字や枠は控えめにしている。研究ラボらしい落ち着きが出る。
  - https://www.anthropic.com/research
- ダークモードを作るなら、ロゴや画像も明暗それぞれの版を用意する（Josh W. Comeau、DeepMind はライト/ダーク用の素材を持っている）。
  - https://www.joshwcomeau.com/
  - https://deepmind.google/research/

## カードの作り

- **中身の順番を全カードでそろえる**：小さな分類ラベル → 日付 → 画像 → 太字のタイトル → 1〜2文の要約。Anthropic Research、DeepMind、Sakana AI、Distill がほぼこの順番。
  - https://www.anthropic.com/research
  - https://deepmind.google/research/
  - https://sakana.ai/
  - https://distill.pub/
- **カード全体を1つのリンクにする**（Sakana AI）。タッチ範囲が広がり、スマホで押しやすい。ただし中に別のリンクを入れ子にしない。
  - https://sakana.ai/
- 研究カードのメタ情報は**「年・発表先・テーマタグ・オープンソースかどうか」**くらいに絞る（Sakana AI）。著者が多いときは、アイコンを重ねて「+N」で省略する（Hugging Face）。
  - https://sakana.ai/
  - https://huggingface.co/blog
- **成果は「結果」から書く**。basement.studio は実績の紹介文を成果から始め、Goodpatch は事例カードの1行説明に具体的な成果を入れている。「何を作ったか」より「何が変わったか」を先に書く。
  - https://basement.studio/
  - https://goodpatch.com/
- 作品一覧は**画像・タイトル・分類の3点だけ**でも成り立つ（Takram）。説明文は詳細ページに回す。ただし画像の alt は必ず書く（Takram の一覧には alt がなかった）。
  - https://www.takram.com/
- 一覧の最後には**「すべて見る」リンクを1つ**置く（Takram、Goodpatch、DeepMind）。トップページは厳選、全件は別ページ。
  - https://www.takram.com/
  - https://goodpatch.com/
  - https://deepmind.google/research/
- 職歴や実績は**日付・役割・説明・技術タグ**の固定セットで並べる（Brittany Chiang）。最後に「全体を見る」アーカイブへのリンクを置く。
  - https://brittanychiang.com/

## 動き

- **動きは「足し算」で書く**：アニメーションは `@media (prefers-reduced-motion: no-preference)` の中だけで定義する。対応していないブラウザや、動きを減らしたい人には、最初から静止版が出る。
  - https://web.dev/articles/prefers-reduced-motion
- `reduce` のときは、**拡大・パン・パララックス・背景動画をやめる**。どうしても動かす場合は、ゆっくりした透明度の変化（フェード）に置きかえる。大きな拡大やパンは前庭障害（めまい）を引き起こすことがある。
  - https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  - https://web.dev/articles/prefers-reduced-motion
- JavaScript の動きは `matchMedia('(prefers-reduced-motion: reduce)')` の `change` を監視して、途中で設定が変わっても止められるようにする。
  - https://web.dev/articles/prefers-reduced-motion
- **動かすのは `transform` と `opacity` だけ**。`top` / `left` / `box-shadow` を動かすとレイアウトのずれや重さの原因になる。
  - https://web.dev/articles/optimize-cls
- 小さな動きで十分：**カードのホバーで少し浮く（2〜4px 程度）、リンクの矢印が少し右へ、メールアドレスのコピー後に短い確認表示**（rauno.me の考え方）。ページを開いたときの演出は最小限にする。
  - https://rauno.me/
- ユーザーの操作で起きる動きは、止められるようにしておく（WCAG 2.3.3）。
  - https://www.w3.org/TR/WCAG22/

## スマホ

- **横幅 320px（CSS px）でも横スクロールなしで読める**ようにする（WCAG 1.4.10 リフロー）。
  - https://www.w3.org/TR/WCAG22/
- **押せる場所は 44×44px 以上**（WCAG 2.5.5 の強化基準）。最低ラインは 24×24px（2.5.8）。小さいアイコンを並べるときは、中心から直径 24px の円が重ならない間隔を取る。
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- ブレークポイントは **768px の1つから始める**。768px 未満は1カラム（デジタル庁）。
  - https://design.digital.go.jp/dads/foundations/layout/
- スマホでは**大見出しを1段階小さく**する（SmartHR は XXL を 32px → 28.8px）。
  - https://smarthr.design/products/design-tokens/typography/
- スマホの左右余白は 16〜24px、1行は 20〜24 字程度になる。行間は PC と同じ 1.7〜1.8 を保つ（jlreq の「短い行は行間を狭くしてよい」に合わせ、1.7 まで下げてもよい）。
  - https://www.w3.org/TR/jlreq/
- note は iOS アプリで VoiceOver と Dynamic Type（OS の文字サイズ設定）に対応した。Web でも、**文字サイズを px で固定せず rem で書き**、ブラウザの文字サイズ設定に従うようにする。
  - https://ascii.jp/elem/000/004/058/4058477/
  - https://smarthr.design/products/design-tokens/typography/

## 読み込みの速さ

- 目標：**LCP 2.5秒以下、INP 200ms 以下、CLS 0.1 以下**（モバイル・PC 別に、75パーセンタイルで測る）。
  - https://web.dev/articles/vitals
- **最初に見える一番大きい画像には `fetchpriority="high"` をつけ、`loading="lazy"` をつけない**。HTML の `<img>` に直接書く（CSS の背景画像や JS で差し込むと、ブラウザが見つけるのが遅れる）。high は 1〜2 枚まで。
  - https://web.dev/articles/optimize-lcp
- 画像は **AVIF / WebP で、画面に合ったサイズ**を出し分ける。`width` と `height` を必ず書くか、`aspect-ratio` で場所を確保する。
  - https://web.dev/articles/optimize-lcp
  - https://web.dev/articles/optimize-cls
- Web フォントは **WOFF2・サブセット化・`unicode-range`**。和文フォントは重いので、使うなら2ウェイトまで。`font-display: swap` か `optional`、`size-adjust` で代替フォントとの大きさの差を小さくする。
  - https://web.dev/articles/font-best-practices
  - https://web.dev/articles/optimize-cls
- 外部フォントを使うなら `preconnect`（フォントファイル用は `crossorigin` つき）。いちばん大事なフォントだけ `preload` する。
  - https://web.dev/articles/font-best-practices
- アニメーション用の CSS は別ファイルにして `media="(prefers-reduced-motion: no-preference)"` で読み込むと、動きを切っている人はダウンロード自体しない。
  - https://web.dev/articles/prefers-reduced-motion

## アクセシビリティ

- **「本文へ移動」スキップリンク**を先頭に置く（Brittany Chiang、Goodpatch、Allen AI、note が実装）。
  - https://brittanychiang.com/
  - https://goodpatch.com/
  - https://allenai.org/
  - https://note.com/
- **フォーカスは必ず見えるように**する。`:focus-visible` を使い、どんな背景でも見える2色の枠にする（デジタル庁は黄色＋黒の二重）。`outline: none` だけで消すのは不合格。
  - https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
  - https://design.digital.go.jp/dads/foundations/color/
- コントラストは**文字 4.5:1、大きな文字・アイコン・枠 3:1**。
  - https://www.w3.org/TR/WCAG22/
- **文字の入る箱に高さを固定しない**。行間 1.5倍・段落間 2倍・字間 0.12em・語間 0.16em に広げられても切れないこと。`overflow: hidden` で文字を隠さない。
  - https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- 画像には**意味のある alt を書く**。飾りの画像だけ `alt=""`。作品画像に alt がないのはよくある抜け（Takram の一覧で確認）。
  - https://www.takram.com/
  - https://goodpatch.com/
- リンクは色だけで見分けさせず、**下線もつける**。訪問済みの色も用意する。
  - https://design.digital.go.jp/dads/foundations/color/
- `<html lang="ja">` を指定し、英語の部分には `lang="en"` をつける（読み上げの発音と、和欧間の空きの処理が正しくなる）。
  - https://www.w3.org/International/articles/styling/inline-space
  - https://sakana.ai/

---

## 訪問したサイト一覧

### (a) 個人・デザイナーのポートフォリオ
1. https://brittanychiang.com/ — 自己紹介→職歴→作品→文章の順。職歴は日付・役割・タグの固定セットで、最後に全体アーカイブへのリンク。スキップリンクあり。
2. https://rauno.me/ — 余白が大きい1カラム。大きな名前と小さい補足の対比。セクション間は広く、カード内は詰める。
3. https://www.joshwcomeau.com/ — 記事カード→カテゴリ→人気記事→ニュースレターの順。ダークモード切替と、明暗それぞれの画像。
4. https://leerob.com/ — 画像も飾りもない文字だけの1カラム。プロフィール→ノート→記事（年月つき）の明快な順番。

### (b) 小さな会社・スタジオ
5. https://www.takram.com/ — 一文の自己紹介→作品グリッド（画像・タイトル・分類のみ）→連絡先。en / ja / zh の切替。作品画像の alt がない点は反面教師。
6. https://basement.studio/ — 実績→サービス→会社について→連絡先の順に、証拠から問い合わせへ流す。紹介文は成果から書く。
7. https://goodpatch.com/ — 英語の大見出し＋日本語の補足の2段組み。ニュース・セミナー・ブログで同じカード形式。日付は YYYY.MM.DD。
8. https://linear.app/ — 機能ごとに「見出し＋短い説明＋画面モック＋もっと見る」の繰り返し。更新履歴を日付つきカードで見せる。

### (c) AI ラボ・研究ラボ
9. https://www.anthropic.com/research — チームごとの分類カード→注目記事→並べ替え・絞り込み→新しい順の一覧。色はサムネイルに任せ、UI は控えめ。
10. https://deepmind.google/research/ — 注目プロジェクト→ニュース→論文一覧→動画の順。カードは日付・分類・見出しで統一。明暗両方のロゴ。
11. https://sakana.ai/ — 日本の AI ラボ。英語がルートで、日本語は /ja/。研究は時系列ではなく厳選カードで、メタ情報は発表先・年・タグ。カード全体がリンク。
12. https://allenai.org/ — 画像と文章のブロックが交互に並び、各ブロックは「テーマ＋価値の一言＋説明1〜2文＋リンク1つ」。技術より成果で説明している。
13. https://huggingface.co/blog — タグで絞り込み、並べ替え、ページ送り。著者アイコンを重ねて「+N」で省略。
14. https://distill.pub/ — 研究記事一覧のお手本。日付→タイトル→著者→要約の順で、縦の余白が広い。

### (d) 日本語の読みやすさ
15. https://www.w3.org/TR/jlreq/ — 日本語組版の基本。行間は文字サイズの 50〜100%、横組みは 1行最大 40 字（作例は 35 字）、段落頭は 1字下げ。
16. https://smarthr.design/products/design-tokens/typography/ — 16px 基準の文字サイズ段階、行間は見出し 1.25 / 本文 1.5 / ラベル 1.0。
17. https://smarthr.design/products/design-tokens/spacing/ — 4〜64px の余白段階（16px 基準）。
18. https://design.digital.go.jp/ （トップ、/dads/foundations/、/typography/、/spacing/、/color/、/layout/）— 14px 未満は使わない、本文の行間 1.5 以上、字間 0〜0.02em、8px 基準の余白、12カラム・ガター 2倍、768px のブレークポイント、色の役割とコントラスト。
19. https://ics.media/entry/240411/ — 日本語の改行 CSS（`line-break: strict`、`overflow-wrap: anywhere`、`text-wrap: pretty`）。
20. https://ics.media/en/entry/14087/ — palt の使いどころ（まず見出し）と注意点（Meiryo には効かない、句読点が詰まりすぎる）。
21. https://www.w3.org/International/articles/styling/inline-space — 和欧間の空きは `text-autospace` で作る（1/8〜1/4em）。本文の字間は足さない。
22. https://note.com/ — 取得できたのはナビとフッターだけ。スキップリンクの存在は確認できた。本文の組版の数値は取れなかった。
23. https://vibes.freee.co.jp/ — 取得できたのは Storybook の外枠だけで、中身は読めなかった（参考情報なし）。

### (e) 表示速度・アクセシビリティ
24. https://web.dev/articles/vitals — LCP ≤2.5秒、INP ≤200ms、CLS ≤0.1（75パーセンタイル）。
25. https://web.dev/articles/optimize-lcp — LCP 画像は fetchpriority="high"、lazy にしない、HTML に直接書く。
26. https://web.dev/articles/optimize-cls — width/height・aspect-ratio、動きは transform で。
27. https://web.dev/articles/font-best-practices — WOFF2、サブセット、unicode-range、font-display、size-adjust。
28. https://web.dev/articles/prefers-reduced-motion — 動きは「足し算」で書く、JS は matchMedia で監視、アニメ用 CSS を分ける。
29. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — reduce のときはフェードに置きかえる例。前庭障害の説明。
30. https://www.w3.org/TR/WCAG22/ — コントラスト 4.5:1 / 3:1、リフロー 320px、テキスト間隔の数値。
31. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — 押せる場所は最低 24×24px、間隔の例外。
32. https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html — 推奨は 44×44px。
33. https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html — 高さを固定しない、overflow で文字を隠さない。
34. https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html — `:focus-visible` と2色のフォーカス枠。

（検索結果で見ただけのもの：https://ascii.jp/elem/000/004/058/4058477/ — note の iOS アプリが VoiceOver と Dynamic Type に対応した記事）

---

## このサイトにすぐ使えること

1. **本文の基本 CSS を決める**：`font-size: 1rem`（16px）、`line-height: 1.8`、`letter-spacing: 0.02em`（大きい見出しは 0〜-0.01em）、本文の幅は `max-width: 38em`（約 38 字）。
2. **改行と和欧の空き**：`body { line-break: strict; overflow-wrap: anywhere; text-autospace: normal; }`。英数字の前後に手で半角スペースを入れるのをやめる。見出しだけ `font-feature-settings: "palt"`。
3. **余白は 8 の倍数に限定**：8 / 16 / 24 / 40 / 64px の5段階を CSS 変数にし、ラベル→タイトル 8px、タイトル→本文 24px、セクション間 64px（スマホは 40px）。
4. **研究・作品カードの型を1つに統一**：分類ラベル → 日付（YYYY.MM.DD）→ 画像（`aspect-ratio` 固定）→ タイトル → 要約1文。カード全体を1リンクにして、トップは厳選3〜6件＋「すべて見る」。
5. **紹介文は成果から書く**：「〇〇を作った」より「〇〇が △ 分の 1 になった」を1行目に置く。
6. **色は無彩色＋メイン1色＋アクセント1色**：グレーの段階を決め、すべての文字色が 4.5:1 以上かを確認する。リンクは下線つき。
7. **動きは `prefers-reduced-motion: no-preference` の中だけ**：カードのホバーで 2〜4px 浮く、矢印が少し動く、程度。`transform` と `opacity` だけを動かす。
8. **ファーストビューの画像に `fetchpriority="high"`、それ以外は `loading="lazy"`**。すべての `<img>` に width/height、形式は AVIF / WebP。和文 Web フォントを使うなら 2ウェイト・サブセット・`font-display: swap`。
9. **アクセシビリティの最低セット**：先頭に「本文へ移動」、`:focus-visible` で2色のフォーカス枠、押せる場所は 44×44px、`lang="ja"`、英語部分は `lang="en"`、作品画像に意味のある alt。
10. **320px 幅とテキスト間隔の確認**：DevTools で 320px にして横スクロールが出ないか、行間 1.5倍・字間 0.12em に広げても文字が切れないか（高さ固定・`overflow: hidden` を探す）を確認する。
