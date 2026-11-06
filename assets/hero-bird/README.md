# 仕事一覧トップ：白文鳥の写真アニメーション

`index.html` をブラウザで開くとプレビューできます。写真素材は生成画像です。

動画を使用せず、WebP画像3枚とJavaScript/CSSで動かします。翼の動きは写真素材の変形による簡易表現です。実写動画のような連続した羽ばたきではありません。

16秒で「飛来 → 着枝 → 休息 → 飛び去る」を繰り返します。画面外や非表示タブでは停止し、「動きを減らす」設定では静止画になります。外部ライブラリや外部への通信はありません。

## 既存サイトへの組み込み

1. このフォルダを `assets/hero-bird/` に置きます。
2. `assets/hero-bird/hero-bird.css` と `assets/hero-bird/hero-bird.js` を読み込みます。
3. 既存の `hero-mask samples-top` 要素を、プレビュー内の `data-hero-bird` のdiv全体で置き換えます。外側のclassは `hero-bird samples-top` にします。
4. 3枚の画像パスを `assets/hero-bird/assets/branch.webp`、`assets/hero-bird/assets/bird.webp`、`assets/hero-bird/assets/flight.webp` に直します。
5. 古いhero-maskのCSS/JSを読み込む必要はなくなります。他のタブのトップ表示に影響しないことを確認してから公開してください。

生成方針：生成りの背景、柔らかな自然光、白文鳥、細い枝と少量の深緑の葉。余白の多い横長の写真表現。文字・ロゴなし。
