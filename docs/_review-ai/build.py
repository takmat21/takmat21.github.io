import os,urllib.parse
OUT='/home/user/takmat21.github.io/ai'
NAME='【サイト名】'
MAIL='matsumura.takashi@zazoucorp.com'; TEL='090-6373-7945'
subj=urllib.parse.quote('ご相談（AIの仕組み化）')
body=urllib.parse.quote('会社名：\nお名前：\n電話番号（任意）：\n\n手間がかかっている業務：\n\n今のやり方（かんたんで大丈夫です）：\n\n')
MAILTO=f'mailto:{MAIL}?subject={subj}&amp;body={body}'
NAV=[('service/','サービス'),('price/','料金'),('cases/','自社の仕組み'),('company/','会社概要'),('faq/','よくある質問'),('contact/','お問い合わせ')]

def page(slug,title,desc,main,crumb=None):
    pre='' if slug=='' else '../'
    nav=''.join(f'<li><a href="{pre}{u}"{" aria-current=\"page\"" if u==slug else ""}>{t}</a></li>' for u,t in NAV)
    fnav=''.join(f'<li><a href="{pre}{u}">{t}</a></li>' for u,t in NAV)
    ph=''
    if crumb:
        h1,lead=crumb
        ph=f'''<div class="ph"><div class="c">
  <p class="crumb"><a href="{pre or './'}">トップ</a> ／ {h1}</p>
  <h1>{h1}</h1>
  <p>{lead}</p>
</div></div>
'''
    html=f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex">
<link rel="icon" href="{pre}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&amp;family=Shippori+Mincho:wght@700&amp;family=JetBrains+Mono:wght@400&amp;display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&amp;family=Shippori+Mincho:wght@700&amp;family=JetBrains+Mono:wght@400&amp;display=swap"></noscript>
<link rel="stylesheet" href="{pre}ai.css?v=1">
</head>
<body>
<a class="skip" href="#main">本文へ</a>
<header class="hd"><div class="c">
  <a class="brand" href="{pre or './'}"><b>{NAME}</b><small>ZAZOU株式会社 ／ AIで業務を仕組み化する</small></a>
  <nav class="gnav" aria-label="サイト内"><ul>{nav}</ul></nav>
  <a class="hd-cta" href="{pre}contact/">無料で相談する</a>
</div></header>
<main id="main">
{ph}{main}
<section class="cta-band"><div class="c">
  <h2>まず1つの業務から、一緒に整理しましょう。</h2>
  <p>相談は無料です。手間がかかっている業務の名前だけでも大丈夫です。相談だけで終わっても費用はかかりません。</p>
  <div class="btns"><a class="btn" href="{MAILTO}">メールで相談する（無料）</a><a class="btn sub" href="tel:{TEL}">電話で相談する</a></div>
  <p class="btn-note">電話：<a class="tel" href="tel:{TEL}">{TEL}</a>（ZAZOU株式会社　松村）</p>
</div></section>
</main>
<footer class="ft"><div class="c">
  <div><b class="n">{NAME}</b><p>ZAZOU株式会社<br>滋賀県蒲生郡日野町<br>代表取締役 松村貴士</p></div>
  <div><h3>MENU</h3><ul><li><a href="{pre or './'}">トップ</a></li>{fnav}</ul></div>
  <div><h3>CONTACT</h3><ul><li><a href="mailto:{MAIL}">{MAIL}</a></li><li><a href="tel:{TEL}">{TEL}</a></li><li><a href="{pre}../">代表のポートフォリオ（ZAZOU Lab）</a></li></ul></div>
  <p class="copy">© 2026 ZAZOU株式会社</p>
</div></footer>
</body></html>
'''
    d=os.path.join(OUT,slug); os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(html)

def flow(steps):
    lab={'auto':'自動','ai':'AI','hu':'人'}
    return '<ol class="flow">'+''.join(f'<li><span class="who {w}">{lab[w]}</span><br>{t}</li>' for w,t in steps)+'</ol>'
KEY='<p class="flow-key"><span><span class="who auto">自動</span> 決めた時刻に動く</span><span><span class="who ai">AI</span> AIが下書き・作業</span><span><span class="who hu">人</span> 人が確かめて決める</span></p>'

PRICE_PLANS='''<div class="plans">
  <div class="plan"><p class="pk">単発</p><h3>1段目　試しに1つ</h3><p class="pp">50,000円〜<small>（税別）</small></p><p>1つの業務を試しに仕組みにします。</p><p class="hrs">作業時間の目安 約17時間</p></div>
  <div class="plan rec"><p class="pk">単発</p><h3>2段目　業務に合わせる</h3><p class="pp">150,000円〜<small>（税別）</small></p><p>御社の業務に合わせて作り込みます。</p><p class="hrs">作業時間の目安 約50時間</p></div>
  <div class="plan"><p class="pk">単発</p><h3>3段目　広い範囲</h3><p class="pp">280,000円〜<small>（税別）</small></p><p>複数の業務にまたがる仕組みをつくります。</p><p class="hrs">作業時間の目安 約93時間</p></div>
  <div class="plan"><p class="pk">月額</p><h3>保守</h3><p class="pp">月10,000円〜<small>（税別）</small></p><p>使い方の相談と、小さな直し。</p><p class="hrs">作業時間の目安 月3時間まで</p></div>
</div>'''

CASES=[
('jobs','求人サイトの見回りと提案文の下書き','自社の営業（仕事探し）',
 '複数の求人サイトを決めた時刻に自動で見回り、条件に合う案件を選んで表に記録し、提案文の下書きまでAIが作ります。送るかどうかは人が決めます。',
 [('auto','平日2回・土日1回、決めた時刻に起動'),('ai','求人サイトを見回り、新しい案件を集める'),('ai','条件に合うかを選び、表に記録'),('ai','提案文を下書きし、別のAIが点検'),('hu','送るかどうかを決め、人が送る')],
 'Claude、Googleスプレッドシート','提案文を送るかどうか、送る前の最終確認', None),
('mail','メールの確認と、やることの一覧','毎日のメール対応',
 '平日の決めた時刻にAIがメールを読み、返事やお客様への対応が要るものを分けて一覧にし、タスクとして登録します。返信するかどうか、何を書くかは人が決めます。',
 [('auto','平日の決めた時刻に起動'),('ai','新しいメールを読む'),('ai','対応が要るものを分け、一覧とタスクに登録'),('hu','一覧を見て、返事や対応を決める')],
 'Claude、Gmail、Googleスプレッドシート、GAS','返信の内容と送信', None),
('csv','送り状のCSV作成','出荷の準備',
 '注文データを、ヤマト運輸のB2クラウドに取り込める形式（CSV・Shift_JIS）に変換します。変換ツールは公開していて、だれでも試せます。',
 [('auto','注文データを取り出す'),('auto','GASでB2クラウドの形式に変換'),('auto','送り状のCSV（Shift_JIS）を作成'),('hu','中身を確かめて、送り状の発行に使う')],
 'Googleスプレッドシート、GAS、HTML・JavaScript（公開ツール）','CSVの中身と、送り状の発行', ('https://takmat21.github.io/yamato-b2-/','公開している変換ツールを見る')),
('minutes','議事録づくり','打ち合わせの記録',
 '打ち合わせの録音を文字起こしし、AIで議事録にまとめます。決まったこととやることを、あとから探せる形で残します。',
 [('hu','打ち合わせを録音する'),('ai','録音を文字起こし'),('ai','議事録にまとめる（決まったこと・やること）'),('hu','内容を確かめて残す')],
 'Claude、ChatGPT、Googleドキュメント','議事録の中身', None),
('drawing','図面見積アプリ（試作）','製造業向けの試作',
 '金属加工の図面PDFをAIが読み、寸法・材質・数量などを拾い出して、見積書の下書きを作ります。読み違えやすい所は「要確認」として出し、人が確かめて金額を決めます。自作の見本図面10枚では、90項目中89項目が合いました（自作の見本での結果で、実際の図面での結果ではありません）。',
 [('hu','図面のPDFを受け取る'),('ai','寸法・材質・数量などを拾い出す'),('ai','読み違えやすい所に「要確認」を付ける'),('ai','見積書の下書きを作る'),('hu','確かめて金額を決める')],
 'Claude、Excel','拾い出した値の確認と、見積の金額', ('../../samples/drawing-estimate/','図面見積アプリの紹介ページ')),
('news','朝刊とAIニュース番組','情報収集と発信',
 '統括役のAIが毎朝AIの最新の動きを読み、自社の運用と照らし合わせて「朝刊」としてWebに出しています。YouTubeのAIニュース番組（SOCRA）も、台本・音声・画像・字幕までAIが作り、公開まで自動で行っています。費用はAIの利用料のほかにかかっていません。',
 [('auto','毎朝6時台に起動'),('ai','記事を選んで読み、日本語で要約'),('ai','自社の運用と比べ「取り入れるか」を書く'),('auto','ページを自動で作り、公開')],
 'Claude、GitHub Pages、YouTube','どの番組・記事を出すかの方針、公開の許可（最初に人が決める）', ('../../news/','朝刊を見る')),
]

# ---------- トップ ----------
cards=''.join(f'<a class="card" href="cases/#{k}"><span class="no">CASE {i+1:02d}</span><h3>{t}</h3><p>{s}</p><span class="go">流れを見る →</span></a>' for i,(k,t,s,*_) in enumerate(CASES))
top=f'''<section class="hero"><div class="c">
  <div class="reveal">
    <p class="kicker"><b>滋賀・日野町</b>ZAZOU株式会社</p>
    <h1>AIを、毎日の<wbr>仕事の流れに<wbr>組み込む。</h1>
    <p class="lead">自社の業務でAIの仕組みを毎日動かしている設計者が、御社の業務を1つずつ仕組みにします。手順の書き出しから、AIの設定、人が確かめる所まで。</p>
    <ul class="hero-points"><li>1つの業務から始める</li><li>料金はすべて公開</li><li>最後は人が確かめる</li></ul>
    <div class="btns"><a class="btn" href="contact/">無料で相談する</a><a class="btn sub" href="price/">料金を見る</a></div>
    <p class="btn-note">単発 50,000円〜（税別）／保守 月10,000円〜（税別）</p>
  </div>
  <figure class="shot"><img src="../assets/img/board.webp" width="1600" height="1460" alt="案件・タスク・予定を1画面にまとめたオペレーションボードの画面" fetchpriority="high" decoding="async"><figcaption>自社で毎日使っている画面（オペレーションボード、見本データ）</figcaption></figure>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">For you</span><h2>こんな会社のお手伝いをします</h2></div>
  <ul class="fit">
    <li><a href="contact/"><b>AIを試したが、仕事で使えていない</b><span>使う人が限られ、毎日の業務に入っていない。</span><em>まず話してみる →</em></a></li>
    <li><a href="service/"><b>同じ転記や集計を、毎週手でやっている</b><span>決まった作業を、仕組みに任せたい。</span><em>進め方を見る →</em></a></li>
    <li><a href="price/"><b>作ったあとも、続けて支えてほしい</b><span>月ごとに相談しながら、少しずつ広げたい。</span><em>保守の料金を見る →</em></a></li>
  </ul>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Why us</span><h2>3つの特長</h2></div>
  <div class="grid">
    <div class="card"><span class="no">01</span><h3>自社で毎日使っているやり方</h3><p>メールの確認、案件の管理、送り状のCSV作成、議事録など、自社の業務で毎日動かしている形をそのまま持ち込みます。</p></div>
    <div class="card"><span class="no">02</span><h3>相談で終わらず、作るところまで</h3><p>手順の書き出しから、AIへの指示文、スプレッドシート・GASの仕組みまで、こちらで作ります。</p></div>
    <div class="card"><span class="no">03</span><h3>社内に残る形で渡す</h3><p>手順書と設定を残し、御社の人が使い続けられる形にします。AIの答えを人が確かめる所も、手順の中に決めておきます。</p></div>
  </div>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Cases</span><h2>自社で動かしている仕組み</h2><p>他社の事例ではなく、ZAZOU 自身の業務で使っているものです。それぞれ、どこをAIに任せて、どこを人が確かめているかを図で紹介しています。</p></div>
  <div class="grid">{cards}</div>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Flow</span><h2>進め方</h2></div>
  <ol class="steps">
    <li><b>業務を1つ決める</b><span>無料相談で、いちばん手間がかかっている業務を選びます。</span></li>
    <li><b>手順を書き出す</b><span>今のやり方を、だれが見ても分かる形にします。</span></li>
    <li><b>AIを組み込む</b><span>指示文・スプレッドシート・GASで仕組みにします。</span></li>
    <li><b>使いながら直す</b><span>現場で使い、合わない所を直します。</span></li>
  </ol>
  <p class="more"><a href="service/">サービスの内容をくわしく見る →</a></p>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Price</span><h2>料金</h2><p>料金はすべて公開しています。表示は税別です。始める前に、作業時間の目安からお見積りします。</p></div>
  {PRICE_PLANS}
  <p class="more"><a href="price/">含むもの・含まないもの、契約の決まりを見る →</a></p>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Representative</span><h2>担当するのは、代表の松村です</h2></div>
  <div class="rep">
    <div class="rep-card"><div class="mon" aria-hidden="true">松</div><b>松村 貴士</b><span>ZAZOU株式会社 代表取締役</span></div>
    <div class="prose">
      <p>パナソニックで約15年、チューナ・縦型洗濯機・ロボット掃除機の機構設計をしてきました。2020年にZAZOU株式会社を設立し、2026年10月からは、Claude・Googleスプレッドシート・GASを組み合わせたAIの仕組みを自社の業務で毎日動かしています。</p>
      <p>設計の仕事で身につけた「手順を書き出し、確かめる所を決める」やり方で、AIを仕事の流れに組み込みます。</p>
      <p class="more"><a href="company/">経歴と会社概要を見る →</a></p>
    </div>
  </div>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">FAQ</span><h2>よくある質問</h2></div>
  <dl class="qa">
    <div><dt>AIにくわしくなくても大丈夫ですか。</dt><dd>大丈夫です。今の仕事の手順を教えていただければ、AIの設定はこちらで行います。</dd></div>
    <div><dt>料金は税込ですか、税別ですか。</dt><dd>表示はすべて税別です。</dd></div>
    <div><dt>AIの答えをそのまま使うのですか。</dt><dd>いいえ。AIには決めた表だけを使わせ、別のAIで点検し、最後は人が確かめてから外に出します。</dd></div>
  </dl>
  <p class="more"><a href="faq/">よくある質問をすべて見る →</a></p>
</div></section>
'''
page('',f'{NAME}｜AIで業務を仕組み化する（ZAZOU株式会社）','自社の業務でAIの仕組みを毎日動かしている設計者が、御社の業務を1つずつAIで仕組みにします。料金はすべて公開（税別）。滋賀県日野町のZAZOU株式会社。',top)

# ---------- サービス ----------
svc='''<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">About</span><h2>「AIの仕組み化」とは</h2><p>業務を1つ選び、今の手順を書き出して、AIに任せる所と人が確かめる所を分けた仕組みにします。作るのは、自社で毎日動かしているのと同じ形です。</p></div>
  <div class="tw"><table class="tbl">
    <tbody>
    <tr><th>向いている会社</th><td>AIを試したが、毎日の業務に組み込めていない小さな会社</td></tr>
    <tr><th>できること</th><td>転記・集計、メールの確認と一覧づくり、議事録、書類やCSVの作成、資料の下書き など</td></tr>
    <tr><th>使う道具</th><td>Claude・ChatGPT、Googleスプレッドシート、GAS（Google Apps Script）、Excel など</td></tr>
    <tr><th>料金</th><td>単発 50,000円〜280,000円（税別）／保守 月10,000円〜（税別）　<a href="../price/">くわしく</a></td></tr>
    <tr><th>担当</th><td>ZAZOU株式会社 代表 松村貴士</td></tr>
    </tbody>
  </table></div>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Why it stops</span><h2>AIの活用が止まる、よくある理由</h2><p>多くの場合、AIの性能ではなく、仕事の進め方の側で止まっています。</p></div>
  <div class="grid">
    <div class="card"><span class="no">01</span><h3>どの業務から始めるか決まらない</h3><p>できそうなことが多く、手がつけられない。</p></div>
    <div class="card"><span class="no">02</span><h3>手順が書き出されていない</h3><p>今のやり方が人の頭の中にあり、AIに渡せない。</p></div>
    <div class="card"><span class="no">03</span><h3>作る人の手が回らない</h3><p>担当者が本業と兼務で、仕組みづくりが後回しになる。</p></div>
    <div class="card"><span class="no">04</span><h3>確かめる所が決まっていない</h3><p>AIの答えをどこで人が見るかが決まらず、使うのが怖い。</p></div>
    <div class="card"><span class="no">05</span><h3>うまくいっても個人に残る</h3><p>使い方が共有されず、担当者が替わると止まる。</p></div>
    <div class="card"><span class="no">06</span><h3>効果が見えない</h3><p>減った時間を測っていないので、続ける理由が見えない。</p></div>
  </div>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Roles</span><h2>だれが、何をするか</h2></div>
  <div class="grid g4">
    <div class="card"><span class="no">設計</span><h3>松村</h3><p>どの業務からやるかを一緒に決め、手順とAIの使い方を設計します。</p></div>
    <div class="card"><span class="no">下書き・作業</span><h3>AI</h3><p>決めた手順のうち、任せられる所を下書き・集計・転記します。</p></div>
    <div class="card"><span class="no">点検</span><h3>別のAIと決めた表</h3><p>間違いや抜けを、作ったAIとは別のAIが確かめます。</p></div>
    <div class="card"><span class="no">最終確認</span><h3>御社の担当者</h3><p>外に出す前に、人が見て決めます。</p></div>
  </div>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Principles</span><h2>5つの決めごと</h2></div>
  <ol class="rules">
    <li><b>1つの業務から始める</b><span>一度に広げず、1つを仕組みにしてから次へ進みます。</span></li>
    <li><b>手順を書き出してから組み込む</b><span>今のやり方を書き出し、AIに任せる所と人が確かめる所を分けます。</span></li>
    <li><b>AIには事実の表だけを使わせる</b><span>決めた表にないことは書かせません。</span></li>
    <li><b>二重チェックと人の最終確認</b><span>別のAIで点検し、最後は人が見てから外に出します。</span></li>
    <li><b>減った時間を測る</b><span>使いながら直し、減った時間を記録して次の業務へ広げます。</span></li>
  </ol>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Flow</span><h2>進め方</h2></div>
  <ol class="steps">
    <li><b>業務を1つ決める</b><span>無料相談で、いちばん手間がかかっている業務を選びます。</span></li>
    <li><b>手順を書き出す</b><span>今のやり方を、だれが見ても分かる形にします。</span></li>
    <li><b>AIを組み込む</b><span>指示文・スプレッドシート・GASで仕組みにします。</span></li>
    <li><b>使いながら直す</b><span>現場で使い、合わない所を直します。手順書と設定をお渡しします。</span></li>
  </ol>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Compare</span><h2>ほかの進め方とのちがい</h2></div>
  <div class="tw"><table class="tbl cmp">
    <thead><tr><th></th><th class="me">ZAZOU の仕組み化</th><th>社員が兼務で進める</th><th>研修だけ受ける</th></tr></thead>
    <tbody>
      <tr><th>どの業務からやるか</th><td class="me">一緒に1つに絞る</td><td>担当者しだい</td><td>受講者しだい</td></tr>
      <tr><th>仕組みを作る手</th><td class="me">こちらで作る</td><td>本業の合間</td><td>自分で作る</td></tr>
      <tr><th>人が確かめる所</th><td class="me">手順の中に決めて組み込む</td><td>決まっていないことが多い</td><td>個人の判断</td></tr>
      <tr><th>社内に残るもの</th><td class="me">手順書・設定・仕組み</td><td>担当者の頭の中</td><td>受講した知識</td></tr>
    </tbody>
  </table></div>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Before / After</span><h2>変わること</h2></div>
  <div class="tw"><table class="tbl cmp">
    <thead><tr><th>前</th><th class="me">後</th></tr></thead>
    <tbody>
      <tr><td>毎回、手で転記・集計している</td><td class="me">決まった作業は仕組みが下書きし、人は確かめる</td></tr>
      <tr><td>AIの使い方が人によってちがう</td><td class="me">指示文と手順が決まっていて、だれでも同じ使い方</td></tr>
      <tr><td>AIの答えをそのまま使ってしまう</td><td class="me">人が確かめる所が手順の中に決まっている</td></tr>
      <tr><td>やり方が担当者の頭の中にある</td><td class="me">手順書と設定が社内に残る</td></tr>
    </tbody>
  </table></div>
  <p class="note" style="margin-top:12px">変わる程度は業務によってちがいます。数字は、実際に測ったものだけをお伝えします。</p>
</div></section>

<section class="sec paper"><div class="c two">
  <div class="sec-h" style="margin:0"><span class="en">Check</span><h2>当てはまるものを選んでみてください</h2><p>1つでも当てはまれば、仕組みにできる業務があるかもしれません。</p></div>
  <form class="check" onsubmit="return false">
    <label><input type="checkbox"> 同じ転記や集計を、毎週手でやっている</label>
    <label><input type="checkbox"> AIを試したが、使う人が限られている</label>
    <label><input type="checkbox"> メールや問い合わせの確認に時間を取られている</label>
    <label><input type="checkbox"> 手順が人によってちがい、引き継ぎが難しい</label>
    <label><input type="checkbox"> 何から手をつけるか決められずにいる</label>
    <p class="cnt" aria-live="polite">当てはまる数 <b>0</b> / 5</p>
  </form>
</div></section>
<script>(function(){var f=document.querySelector('.check');if(!f)return;var b=f.querySelector('.cnt b');f.addEventListener('change',function(){b.textContent=f.querySelectorAll('input:checked').length});})();</script>
'''
page('service/',f'サービス｜{NAME}（ZAZOU株式会社）','業務を1つ選び、手順を書き出して、AIに任せる所と人が確かめる所を分けた仕組みにします。進め方・役割分担・5つの決めごと。',svc,('サービス','AIを入れるだけでなく、毎日の仕事の流れに組み込むところまでお手伝いします。'))

# ---------- 料金 ----------
pr=f'''<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Plans</span><h2>料金の一覧</h2><p>表示はすべて税別です。始める前に、作業時間の目安からお見積りをお出しし、ご了承いただいてから作り始めます。</p></div>
  {PRICE_PLANS}
  <div class="tw" style="margin-top:40px"><table class="tbl price">
    <caption>表示はすべて税別です。目安の時間を超える分は、事前にお見積りのうえ時間単価で承ります。</caption>
    <thead><tr><th>プラン</th><th>内容</th><th>作業時間の目安</th><th>料金（税別）</th></tr></thead>
    <tbody>
      <tr><th>1段目</th><td>1つの業務を試しに仕組みにする</td><td>約17時間</td><td class="n">50,000円〜</td></tr>
      <tr><th>2段目</th><td>業務に合わせて作り込む</td><td>約50時間</td><td class="n">150,000円〜</td></tr>
      <tr><th>3段目</th><td>広い範囲の仕組みづくり</td><td>約93時間</td><td class="n">280,000円〜</td></tr>
      <tr><th>保守</th><td>使い方の相談・小さな直し</td><td>月3時間まで</td><td class="n">10,000円〜 <small>／月</small></td></tr>
      <tr><th>時間単価</th><td>上記を超える分・追加の作業</td><td>—</td><td class="n">3,000円 <small>／時間</small></td></tr>
    </tbody>
  </table></div>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Scope</span><h2>含むもの・含まないもの</h2></div>
  <div class="scope">
    <div><h3>含むもの</h3><ul><li>業務手順の書き出し</li><li>AIへの指示文・設定</li><li>スプレッドシート・GASの仕組み</li><li>使い方の説明</li></ul></div>
    <div class="no"><h3>含まないもの</h3><ul><li>AIサービスの利用料（御社のアカウントの場合）</li><li>ドメイン・サーバーなど外部サービスの費用</li><li>現地での作業・交通費（必要な場合は事前にお見積り）</li></ul></div>
    <div><h3>お願いすること</h3><ul><li>今の手順を教えていただく時間</li><li>外に出す前の最終確認</li></ul></div>
  </div>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Terms</span><h2>契約の決まり</h2><p>期間・更新・止め方を、ここにまとめています。</p></div>
  <dl class="co">
    <dt>単発（1〜3段目）</dt><dd>1回ごとのご契約です。</dd>
    <dt>保守</dt><dd>月ごとの更新です。いつでも止められます（前月末までにご連絡ください）。</dd>
    <dt>追加の作業</dt><dd>目安の時間を超える前にお見積りをお出しし、ご了承いただいてから時間単価（3,000円・税別）で承ります。</dd>
    <dt>相談</dt><dd>無料です。相談だけで終わっても費用はかかりません。</dd>
  </dl>
</div></section>
'''
page('price/',f'料金｜{NAME}（ZAZOU株式会社）','料金はすべて公開しています（税別）。単発 50,000円〜、保守 月10,000円〜、時間単価 3,000円。含むもの・含まないもの・契約の決まり。',pr,('料金','料金・作業時間の目安・含まないもの・契約の決まりを、すべてこのページに載せています。'))

# ---------- 自社の仕組み ----------
toc=''.join(f'<li><a href="#{k}">{i+1:02d} {t}</a></li>' for i,(k,t,*_) in enumerate(CASES))
body_cases=''
for i,(k,t,s,desc,steps,tools,hu,link) in enumerate(CASES):
    l=f'<p><a href="{link[0]}">{link[1]} →</a></p>' if link else ''
    body_cases+=f'''<article class="case" id="{k}">
  <div class="case-h"><span class="no">{i+1:02d}</span><h2>{t}</h2></div>
  <p class="prose" style="margin:0">{desc}</p>
  <div><h3 class="note" style="font-weight:700">流れ</h3>{flow(steps)}{KEY}</div>
  <dl><dt>使っている道具</dt><dd>{tools}</dd><dt>人が確かめる所</dt><dd>{hu}</dd><dt>分野</dt><dd>{s}</dd></dl>
  {l}
</article>
'''
cs=f'''<section class="sec"><div class="c">
  <ul class="toc">{toc}</ul>
</div></section>
<section class="sec paper" style="padding-top:64px"><div class="c">
  <div class="sec-h"><span class="en">Structure</span><h2>全体の体制</h2><p>統括役のAIが担当ごとのAIに仕事を割り振り、結果を確かめます。送信・公開・削除など、元に戻せない操作は人が行います。</p></div>
  <div class="two">
    <div class="org" role="img" aria-label="人（代表）が統括AIに指示し、統括AIが担当ごとのAIに仕事を割り振る体制の図">
      <div class="node hu">人（代表）<small>方針・承認・送信</small></div>
      <div class="arrow">指示 ↓　↑ 報告・確認待ち</div>
      <div class="node lead">統括AI<small>仕事の割り振り・結果の確認</small></div>
      <div class="arrow">↓ 指示　↑ 報告</div>
      <div class="row"><div class="node">提案書・見本</div><div class="node">プロフィール管理</div><div class="node">在庫・出荷</div><div class="node">給与計算・デザイン</div><div class="node">補助金</div><div class="node">調べ物</div></div>
    </div>
    <figure class="fig"><img src="../../assets/img/office.webp" width="1600" height="963" alt="担当AIの状態とチームのやり取りを表示するオフィス画面" loading="lazy" decoding="async"><figcaption>オフィス画面：どの担当AIが何をしていて、どこで人の確認待ちになっているかを一目で見られます。</figcaption></figure>
  </div>
  <ol class="rules" style="margin-top:48px">
    <li><b>事実の表だけを使う</b><span>経歴や実績は、決めた表にあることだけを書きます。ないことは書きません。</span></li>
    <li><b>一次情報で確かめる</b><span>制度や会社のことは、その場で開いた公式ページで確かめます。</span></li>
    <li><b>別のAIで二重チェック</b><span>外に出す文面は、作ったAIとは別のAIが事実・誤字・抜けを点検します。</span></li>
    <li><b>元に戻せない操作は人が押す</b><span>送信・応募・公開・削除は人が行います。AIは下書きと記録までです。</span></li>
  </ol>
</div></section>
<section class="sec"><div class="c">
{body_cases}
</div></section>
'''
page('cases/',f'自社の仕組み｜{NAME}（ZAZOU株式会社）','ZAZOU 自身の業務で毎日動かしているAIの仕組み6つを、どこをAIに任せ、どこを人が確かめているかの図つきで紹介します。',cs,('自社の仕組み','他社の事例ではなく、ZAZOU 自身の業務で毎日動かしている仕組みです。どこをAIに任せ、どこを人が確かめているかを、1つずつ図で紹介します。'))

# ---------- 会社概要 ----------
co='''<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Company</span><h2>会社概要</h2></div>
  <dl class="co">
    <dt>会社名</dt><dd>ZAZOU株式会社</dd>
    <dt>代表者</dt><dd>代表取締役 松村 貴士</dd>
    <dt>設立</dt><dd>2020年6月5日</dd>
    <dt>資本金</dt><dd>300万円</dd>
    <dt>所在地</dt><dd>滋賀県蒲生郡日野町</dd>
    <dt>事業内容</dt><dd>ECでの物販（家電・工業製品・日用品の販売と輸出入）<br>AIを使った業務の仕組み化</dd>
    <dt>連絡先</dt><dd><a href="mailto:matsumura.takashi@zazoucorp.com">matsumura.takashi@zazoucorp.com</a><br><a href="tel:090-6373-7945">090-6373-7945</a></dd>
  </dl>
</div></section>

<section class="sec paper"><div class="c">
  <div class="sec-h"><span class="en">Representative</span><h2>代表の経歴</h2></div>
  <div class="rep">
    <div class="rep-card"><div class="mon" aria-hidden="true">松</div><b>松村 貴士</b><span>ZAZOU株式会社 代表取締役</span></div>
    <ol class="hist">
      <li><time>京都産業大学 卒業</time>　</li>
      <li><time>2000年4月〜2005年8月</time>家業の建設業（有限会社松村建工）で、施工・現場の仕事と資材の手配。</li>
      <li><time>2005年9月〜2011年3月</time>パナソニック エレクトロニックデバイスで、チューナの機構設計。</li>
      <li><time>2011年4月〜2012年12月</time>パナソニックで、台湾拠点の縦型洗濯機の機種開発リーダー。</li>
      <li><time>2013年</time>パナソニックで、衣類用の新しい商品の開発（駆動部）。</li>
      <li><time>2014年1月〜2020年4月</time>パナソニックで、ロボット掃除機の開発（駆動部）。</li>
      <li><time>2020年6月</time>ZAZOU株式会社を設立。</li>
      <li><time>2026年10月〜</time>Claude・Googleスプレッドシート・GASを組み合わせたAIの仕組みを、自社の業務で毎日運用。</li>
    </ol>
  </div>
  <p class="more"><a href="../../">代表のポートフォリオ（ZAZOU Lab）を見る →</a></p>
</div></section>
'''
co=co.replace('<li><time>京都産業大学 卒業</time>　</li>','<li><time>学歴</time>京都産業大学 卒業</li>')
page('company/',f'会社概要｜{NAME}（ZAZOU株式会社）','ZAZOU株式会社（滋賀県蒲生郡日野町、2020年設立）の会社概要と、代表 松村貴士の経歴。',co,('会社概要','ZAZOU株式会社の概要と、担当する代表の経歴です。'))

# ---------- FAQ ----------
QA=[('サービスについて',[
 ('AIにくわしくなくても大丈夫ですか。','大丈夫です。今の仕事の手順を教えていただければ、AIの設定はこちらで行います。'),
 ('どんな業務が向いていますか。','毎週くり返す転記や集計、メールや問い合わせの確認、議事録、決まった形の書類づくりなど、手順を書き出せる業務が向いています。'),
 ('AIの答えをそのまま使うのですか。','いいえ。AIには決めた表だけを使わせ、別のAIで点検し、最後は人が確かめてから外に出します。'),
 ('どんな道具を使いますか。','Claude・ChatGPT、Googleスプレッドシート、GAS（Google Apps Script）、Excel など、自社で使っているものです。'),
 ('作ったものは社内に残りますか。','はい。手順書と設定をお渡しし、御社の人が使い続けられる形にします。'),
]),('料金・契約について',[
 ('料金は税込ですか、税別ですか。','表示はすべて税別です。'),
 ('目安の時間を超えたらどうなりますか。','超える前にお見積りをお出しし、ご了承いただいてから時間単価（3,000円・税別）で追加します。'),
 ('料金に含まれないものはありますか。','AIサービスの利用料（御社のアカウントの場合）、ドメイン・サーバーなど外部サービスの費用、現地での作業・交通費（必要な場合は事前にお見積り）は含みません。'),
 ('契約の期間と、止め方を教えてください。','単発は1回ごとのご契約です。保守は月ごとの更新で、いつでも止められます（前月末までにご連絡ください）。'),
]),('相談について',[
 ('相談は無料ですか。','無料です。相談だけで終わっても費用はかかりません。'),
 ('相談の前に用意するものはありますか。','手間がかかっている業務の名前と、今の手順のかんたんなメモがあれば十分です。なくても大丈夫です。'),
 ('どこの会社ですか。','滋賀県蒲生郡日野町のZAZOU株式会社です。代表の松村貴士が担当します。'),
])]
fq='<section class="sec"><div class="c" style="max-width:880px">'
for g,items in QA:
    fq+=f'<div class="qa-group"><h2>{g}</h2><dl class="qa">'
    for q,a in items:
        fq+=f'<div><dt>{q}</dt><dd>{a}</dd></div>'
    fq+='</dl></div>'
fq+='</div></section>'
page('faq/',f'よくある質問｜{NAME}（ZAZOU株式会社）','料金（税別）・契約・相談・進め方についてのよくある質問。',fq,('よくある質問','サービス・料金・契約・相談について、よくいただく質問をまとめました。'))

# ---------- お問い合わせ ----------
ct=f'''<section class="sec"><div class="c">
  <div class="contact">
    <div class="card"><span class="no">MAIL</span><h2 style="font-size:20px">メールで相談する</h2><p>下の書き方を入れた状態でメールが開きます。</p><p class="big"><a href="{MAILTO}">matsumura.takashi@<wbr>zazoucorp.com</a></p><div class="btns" style="margin-top:8px"><a class="btn" href="{MAILTO}">メールを開く</a></div></div>
    <div class="card"><span class="no">TEL</span><h2 style="font-size:20px">電話で相談する</h2><p>代表の松村が担当します。</p><p class="big"><a href="tel:{TEL}">{TEL}</a></p><div class="btns" style="margin-top:8px"><a class="btn sub" href="tel:{TEL}">電話をかける</a></div></div>
  </div>
</div></section>

<section class="sec paper"><div class="c two">
  <div>
    <div class="sec-h" style="margin-bottom:20px"><span class="en">How to write</span><h2>メールの書き方（例）</h2><p>分かる所だけで大丈夫です。</p></div>
    <pre class="tmpl">会社名：
お名前：
電話番号（任意）：

手間がかかっている業務：
（例）毎週、注文の表を見ながら別の表に手で写している

今のやり方（かんたんで大丈夫です）：</pre>
  </div>
  <div>
    <div class="sec-h" style="margin-bottom:20px"><span class="en">Consultation</span><h2>無料相談でわかること</h2></div>
    <ul class="rules" style="counter-reset:r">
      <li><b>どの業務から始めるとよいか</b><span>いちばん手間がかかっている所から選びます。</span></li>
      <li><b>AIに任せる所と、人が確かめる所</b><span>今の手順に当てはめて考えます。</span></li>
      <li><b>おおよその進め方と費用</b><span>作業時間の目安から、お見積りをお出しします。</span></li>
    </ul>
  </div>
</div></section>

<section class="sec"><div class="c">
  <div class="sec-h"><span class="en">Steps</span><h2>ご相談から始めるまで</h2></div>
  <ol class="steps">
    <li><b>メールか電話で相談</b><span>困っている業務を教えてください。</span></li>
    <li><b>無料相談</b><span>始める業務と進め方を一緒に整理します。</span></li>
    <li><b>お見積り</b><span>作業時間の目安から、事前にお見積りします。</span></li>
    <li><b>始める</b><span>ご了承いただいてから作り始めます。</span></li>
  </ol>
</div></section>
'''
page('contact/',f'お問い合わせ・無料相談｜{NAME}（ZAZOU株式会社）','メール・電話で無料相談を受け付けています。ZAZOU株式会社（滋賀県日野町）代表 松村貴士が担当します。',ct,('お問い合わせ・無料相談','相談は無料です。メールか電話でご連絡ください。'))
print('done')
