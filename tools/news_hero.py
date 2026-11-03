"""朝刊のトップ画（SVG）を作る。

assets/news-hero-wide.svg（PC用 3:1）と assets/news-hero-narrow.svg（スマホ用 16:9）を書き出す。
絵：生成りの地に、開いた新聞（文字は読めない細い線だけ）、うしろに朝日、
新聞のまわりにチームの点が5つ、紙の上の朱の点（統括AI）と細い糸でつながる。
線は手描き風にわずかに揺らす。34.4秒で一周する「1日の物語」のループ：
夜明け前のうす暗さ → 朝日が地平線に届く → 新聞が開き、見出しと本文が一本ずつ書かれる →
統括の点が目覚め、担当が一つずつ灯って糸でつながり、担当どうしも輪になる →
統括から光の輪が広がり、チームが一斉に光る（クライマックス）→ 朝日が昇りきり、紙面が完成 →
静かな余韻 → 紙の色の幕でふわっと夜明け前に戻る。
（SVG内のCSS。prefers-reduced-motion では最後の絵だけを出し、ループしない）。文字・ロゴは入れない。

使い方: python3 tools/news_hero.py
"""
import math
import os
import random
import re

PAPER = '#F2ECE0'
SHEET = '#F8F4EA'
INK = '#2A2622'
VERM = '#B2543C'
SAGE = '#8A9A80'
TERRA = '#C46D51'


def f(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')


def wobble(points, rnd, amp=1.2, steps=10):
    """折れ線を細かく分け、横にわずかに揺らした path の d を返す（手描き風）。"""
    out = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        L = math.hypot(x1 - x0, y1 - y0) or 1
        nx, ny = -(y1 - y0) / L, (x1 - x0) / L
        n = max(2, int(L / 18))
        ph = rnd.random() * 6
        for k in range(n):
            t = k / n
            w = math.sin(ph + t * 3.1) * amp + (rnd.random() - 0.5) * amp * 0.5
            out.append((x0 + (x1 - x0) * t + nx * w, y0 + (y1 - y0) * t + ny * w))
    out.append(points[-1])
    return 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in out)


def compose(W, H, seed=3):
    rnd = random.Random(seed)
    cx, cy = W * 0.5, H * (0.56 if W / H > 2 else 0.5)
    s = min(W / 1200.0, H / 400.0) * (0.88 if W / H > 2 else 1.5)
    el = []
    css = []  # animation rules, all inside prefers-reduced-motion: no-preference

    # 地平線と朝日（新聞のうしろ、右寄り）。光の線は朝日といっしょに昇る
    sx, sy, sr = cx + 250 * s, cy - 18 * s, 62 * s
    rise = 26 * s  # how far the sun climbs in the second half
    sun = '<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.9"/>' % (f(sx), f(sy), f(sr), TERRA)
    for k in range(5):
        a = math.radians(-160 + k * 35)
        r0, r1 = sr + 12 * s, sr + 26 * s
        sun += ('<path class="ray" d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.7" fill="none"/>'
                % (wobble([(sx + math.cos(a) * r0, sy + math.sin(a) * r0), (sx + math.cos(a) * r1, sy + math.sin(a) * r1)], rnd, 0.5),
                   TERRA, f(1.6 * s)))
    el.append('<g class="sun">%s</g>' % sun)
    hz = cy - 18 * s + 4 * s
    el.append('<rect x="0" y="%s" width="%s" height="%s" fill="%s"/>' % (f(hz), f(W), f(H), PAPER))
    el.append('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.55"/>'
              % (wobble([(cx - 420 * s, hz), (cx + 420 * s, hz)], rnd, 0.8), INK, f(1.1 * s)))

    # 開いた新聞：少し傾いた2ページ、中央に折り目
    px, py = cx - 40 * s, cy + 40 * s
    tilt = math.radians(-4)

    def P(x, y):
        return (px + (x * math.cos(tilt) - y * math.sin(tilt)) * s, py + (x * math.sin(tilt) + y * math.cos(tilt)) * s)
    corners = [P(-200, -92), P(0, -100), P(200, -92), P(206, 86), P(0, 94), P(-206, 86)]
    shadow = ['%s,%s' % (f(x + 7 * s), f(y + 8 * s)) for x, y in corners]
    el.append('<polygon points="%s" fill="%s" fill-opacity="0.12"/>' % (' '.join(shadow), INK))
    el.append('<polygon points="%s" fill="%s"/>' % (' '.join('%s,%s' % (f(x), f(y)) for x, y in corners), SHEET))
    el.append('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linejoin="round" stroke-opacity="0.8"/>'
              % (wobble(corners + [corners[0]], rnd, 0.9), INK, f(1.3 * s)))
    el.append('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.45"/>' % (wobble([P(0, -100), P(0, 94)], rnd, 0.6), INK, f(1 * s)))

    def page(side, Q, cls=None, photo_col=None, unit=1.0, start_k=0, photo_cls=None):
        """紙面：見出しの太線・本文の細線（読めない線だけ）・写真の枠。cls を付けると一本ずつ書かれる線になる。"""
        out, k = [], start_k
        x0 = 14 if side > 0 else -186
        def line(pts, w, op, amp):
            nonlocal k
            extra = ''
            if cls:
                extra = ' class="%s %s%d" pathLength="1"' % (cls, cls, k)
                k += 1
            return ('<path%s d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="%s" fill="none"/>'
                    % (extra, wobble(pts, rnd, amp * unit), INK, f(w), op))
        out.append(line([Q(x0, -72), Q(x0 + 120 + rnd.random() * 30, -72)], 4 * unit, '0.85', 0.5))
        cols = [(x0, x0 + 78), (x0 + 92, x0 + 170)]
        for ci, (a, b) in enumerate(cols):
            photo = photo_col == ci
            for r in range(9):
                y = -48 + r * 14
                if photo and r < 4:
                    continue
                end = b - (rnd.random() * 26 if r % 4 == 3 else rnd.random() * 6)
                out.append(line([Q(a, y), Q(end, y)], 1.4 * unit, '0.38', 0.35))
            if photo:
                q = [Q(a, -50), Q(b, -50), Q(b, -2), Q(a, -2)]
                ph = '<polygon points="%s" fill="%s" fill-opacity="0.35"/>' % (' '.join('%s,%s' % (f(x), f(y)) for x, y in q), SAGE)
                for yy in range(-44, -4, 8):
                    for xx in range(int(a) + 6, int(b) - 2, 8):
                        X, Y = Q(xx + (4 if (yy // 8) % 2 else 0), yy)
                        ph += '<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.55"/>' % (f(X), f(Y), f(1.3 * unit), SAGE)
                out.append('<g class="%s">%s</g>' % (photo_cls, ph) if photo_cls else ph)
        return ''.join(out), k

    # 左ページ（最初からある紙面）
    left, _ = page(-1, P, photo_col=1, unit=s)
    el.append(left)
    # 右ページの下の面：めくったあとに見出しと本文が一本ずつ書かれ、最後に写真が浮かぶ
    fresh, nfresh = page(1, P, cls='w', photo_col=1, unit=s, photo_cls='photo2')
    el.append('<g class="fresh">%s</g>' % fresh)

    # めくれるページ：折り目を原点にした座標で描き、横に裏返す
    L = lambda x, y: (x, y)
    leaf_poly = [(0, -100), (200, -92), (206, 86), (0, 94)]
    front, _ = page(1, L, unit=1.0)
    back, _ = page(-1, L, photo_col=0, unit=1.0)
    leaf = ('<polygon points="%s" fill="%s"/>' % (' '.join('%s,%s' % (f(x), f(y)) for x, y in leaf_poly), SHEET) +
            '<path d="%s" fill="none" stroke="%s" stroke-width="1.3" stroke-linejoin="round" stroke-opacity="0.8"/>'
            % (wobble(leaf_poly + [leaf_poly[0]], rnd, 0.9), INK) +
            '<polygon class="shade" points="%s" fill="%s"/>' % (' '.join('%s,%s' % (f(x), f(y)) for x, y in leaf_poly), INK) +
            '<g class="front">%s</g><g class="back"><g transform="scale(-1 1)">%s</g></g>' % (front, back))
    el.append('<g transform="translate(%s %s) rotate(%s) scale(%s)"><g class="turn">%s</g></g>'
              % (f(px), f(py), f(math.degrees(tilt)), ('%.4f' % s), leaf))

    # チーム：紙の上の朱の点（統括）と、まわりの担当5点
    lead = P(52, -20)
    team = [P(-300, -40), P(-250, 120), P(270, 130), P(330, 40), P(-110, -170)]
    # 担当が灯る順：統括のまわりを一周する順
    order = sorted(range(len(team)), key=lambda k: math.atan2(team[k][1] - lead[1], team[k][0] - lead[0]))
    dist = [math.hypot(t[0] - lead[0], t[1] - lead[1]) for t in team]
    # 朝日が昇りきると、光の線が一本、統括の点まで届く
    bx0, by0 = sx - sr * 0.75, sy - rise - sr * 0.35
    el.append('<path class="beam" pathLength="1" d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.5" stroke-linecap="round" stroke-dasharray="0.012 0.018"/>'
              % (f(bx0), f(by0), f((bx0 + lead[0]) / 2), f(min(by0, lead[1]) - 34 * s), f(lead[0] + 8 * s), f(lead[1] - 6 * s), TERRA, f(1.4 * s)))
    # クライマックスで統括から広がる光の輪（線は太らないように）
    for i in range(3):
        el.append('<circle class="rip p%d" cx="%s" cy="%s" r="%s" fill="none" stroke="%s" stroke-width="%s" vector-effect="non-scaling-stroke" opacity="0"/>'
                  % (i, f(lead[0]), f(lead[1]), f(12 * s), TERRA, f(1.6 * s)))
    # the threads share one stroke-opacity on their group, so the climax can darken them together
    threads = ''
    for k, t in enumerate(team):
        mx, my = (t[0] + lead[0]) / 2 + (rnd.random() - 0.5) * 60 * s, (t[1] + lead[1]) / 2 - 30 * s
        d = 'M%s %s Q%s %s %s %s' % (f(lead[0]), f(lead[1]), f(mx), f(my), f(t[0]), f(t[1]))  # drawn from the lead outward
        threads += ('<path class="thread t%d" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"/>'
                    % (k, d, INK, f(1 * s)))
    el.append('<g class="threads" stroke-opacity="0.42">%s</g>' % threads)
    # 担当どうしも、となり同士で糸につながって輪になる（小さな図）
    for i in range(len(order)):
        a, b = team[order[i]], team[order[(i + 1) % len(order)]]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        ox, oy = mx - lead[0], my - lead[1]
        ol = math.hypot(ox, oy) or 1
        c = (mx + ox / ol * 26 * s, my + oy / ol * 26 * s)  # bow outward, away from the lead
        el.append('<path class="ring r%d" pathLength="1" d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.32" stroke-linecap="round"/>'
                  % (i, f(a[0]), f(a[1]), f(c[0]), f(c[1]), f(b[0]), f(b[1]), INK, f(0.9 * s)))
    # 担当の点のうしろの、やわらかい光（クライマックスで一斉に）
    for k, t in enumerate(team):
        el.append('<circle class="halo h%d" cx="%s" cy="%s" r="%s" fill="%s" opacity="0"/>' % (k, f(t[0]), f(t[1]), f(9 * s), TERRA))
    for k, t in enumerate(team):
        el.append('<circle class="member m%d" cx="%s" cy="%s" r="%s" fill="%s"/>' % (k, f(t[0]), f(t[1]), f((4.2 if k != 2 else 5) * s), SAGE if k == 2 else INK))
    el.append('<circle class="lead" cx="%s" cy="%s" r="%s" fill="%s"/>' % (f(lead[0]), f(lead[1]), f(6 * s), VERM))
    # 細い湯気のような線：朝の一服（湯のみは描かず、線だけ）
    st = P(-262, 104)
    el.append('<path class="steam" pathLength="1" d="M%s %s c %s %s %s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.4" stroke-linecap="round"/>'
              % (f(st[0]), f(st[1] - 10 * s), f(-6 * s), f(-10 * s), f(6 * s), f(-16 * s), f(0), f(-28 * s), INK, f(1 * s)))
    # 夜明け前のうす暗さ（墨をごく薄く重ねる）
    el.append('<rect class="dusk" width="%d" height="%d" fill="%s" opacity="0"/>' % (W, H, INK))

    # ---- one day, as a 34.4 s loop (seconds) ----
    #  0-8    before dawn: the room is dim, the sun climbs to the horizon and its rays appear
    #  8-15   the newspaper opens; the headline and lines are written one by one
    #  12-20  the lead wakes; the team lights up one by one, each tied to the lead by a thread
    #  19-22  the team links to each other in a ring
    #  22-25  climax: light spreads from the lead in rings; the team glows together; the sunbeam arrives
    #  24-29  the sun clears the horizon; the photo settles on the page; steam rises
    #  29-32.6 stillness; then a paper-coloured veil carries it back to before dawn
    LOOP, VEIL_IN, RESET = 34.4, 32.6, 33.4
    EASE_OUT, EASE_IO, EASE_SOFT = 'cubic-bezier(.2,.6,.35,1)', 'cubic-bezier(.45,.05,.35,1)', 'cubic-bezier(.33,0,.2,1)'
    kf_count = [0]

    def pct(t):
        return ('%.3f' % (t / LOOP * 100)).rstrip('0').rstrip('.')

    def loop(selector, points):
        """points: [(seconds, 'css declarations', easing to the next point)]. Holds the last state until
        RESET, then returns to the first state (under the veil) and repeats every LOOP seconds."""
        kf_count[0] += 1
        name = 'k%d' % kf_count[0]
        first = points[0][1]
        stops = [(0.0, first, points[0][2])] + list(points) + [(RESET - 0.01, points[-1][1], 'linear'), (RESET, first, 'linear'), (LOOP, first, 'linear')]
        body = ''.join('%s%%{%s;animation-timing-function:%s}' % (pct(t), v, e) for t, v, e in stops)
        css.append('@keyframes %s{%s}%s{animation:%s %ss linear infinite}' % (name, body, selector, name, f(LOOP)))

    def draw_on(selector, t0, dur, ease=EASE_OUT):
        pts = [(t0, 'stroke-dashoffset:1', ease), (t0 + dur, 'stroke-dashoffset:0', 'linear')]
        loop(selector, pts)

    css.append('.thread,.w,.ring,.steam{stroke-dasharray:1}')
    css.append('.member,.lead,.halo,.rip{transform-box:fill-box;transform-origin:center}')
    # before dawn
    loop('.dusk', [(0.0, 'opacity:.15', EASE_SOFT), (6.5, 'opacity:0', 'linear')])
    loop('.sun', [(0.0, 'transform:translateY(%spx)' % f(sr * 0.95), EASE_SOFT), (7.5, 'transform:translateY(0)', 'linear'),
                  (23.5, 'transform:translateY(0)', EASE_IO), (28.5, 'transform:translateY(-%spx)' % f(rise), 'linear')])
    loop('.ray', [(5.0, 'opacity:0', EASE_SOFT), (7.5, 'opacity:1', 'linear')])
    # the newspaper opens slowly
    T_TURN, D_TURN = 8.2, 1.9
    css.append('.turn{transform-origin:0 0}')
    loop('.turn', [(T_TURN, 'transform:scaleX(1)', EASE_IO), (T_TURN + D_TURN, 'transform:scaleX(-1)', 'linear')])
    mid = T_TURN + D_TURN / 2
    loop('.front', [(mid - 0.02, 'opacity:1', 'linear'), (mid + 0.02, 'opacity:0', 'linear')])
    loop('.back', [(mid - 0.02, 'opacity:0', 'linear'), (mid + 0.02, 'opacity:1', 'linear')])
    loop('.shade', [(T_TURN, 'opacity:0', EASE_IO), (mid, 'opacity:.14', EASE_IO), (T_TURN + D_TURN, 'opacity:0', 'linear')])
    T_WRITE = T_TURN + D_TURN - 0.1
    for k in range(nfresh):
        draw_on('.w%d' % k, T_WRITE + (0 if k == 0 else 0.6 + (k - 1) * 0.26), 0.55)
    loop('.photo2', [(25.0, 'opacity:0', EASE_SOFT), (27.0, 'opacity:1', 'linear')])
    # the team lights up, one by one, in a circle around the lead
    T_LEAD = 12.4
    T_CLIMAX = 22.2
    loop('.lead', [(0.0, 'opacity:.4;transform:scale(1)', EASE_IO), (T_LEAD, 'opacity:.4;transform:scale(1)', EASE_IO),
                   (T_LEAD + 0.5, 'opacity:1;transform:scale(1.5)', EASE_IO), (T_LEAD + 1.2, 'opacity:1;transform:scale(1)', 'linear'),
                   (T_CLIMAX - 0.4, 'opacity:1;transform:scale(1)', EASE_IO), (T_CLIMAX + 0.3, 'opacity:1;transform:scale(2.1)', EASE_SOFT),
                   (T_CLIMAX + 1.6, 'opacity:1;transform:scale(1)', 'linear')])
    for n, k in enumerate(order):
        t_on = 13.6 + n * 1.15
        draw_on('.t%d' % k, t_on - 0.9, 1.0)
        # the ripple reaches farther members a little later
        t_glow = T_CLIMAX + 0.25 + dist[k] / (420 * s) * 1.2
        loop('.m%d' % k, [(0.0, 'opacity:.28;transform:scale(1)', EASE_IO), (t_on, 'opacity:.28;transform:scale(1)', EASE_IO),
                          (t_on + 0.35, 'opacity:1;transform:scale(1.55)', EASE_IO), (t_on + 0.9, 'opacity:1;transform:scale(1)', 'linear'),
                          (t_glow - 0.2, 'opacity:1;transform:scale(1)', EASE_IO), (t_glow + 0.3, 'opacity:1;transform:scale(1.7)', EASE_SOFT),
                          (t_glow + 1.4, 'opacity:1;transform:scale(1)', 'linear')])
        loop('.h%d' % k, [(t_glow - 0.2, 'opacity:0;transform:scale(.6)', EASE_SOFT), (t_glow + 0.4, 'opacity:.42;transform:scale(1.7)', EASE_SOFT),
                          (t_glow + 2.2, 'opacity:0;transform:scale(2.4)', 'linear')])
    # the team links up into a ring, a quick chain
    for i in range(len(order)):
        draw_on('.r%d' % i, 19.4 + i * 0.42, 0.55, EASE_IO)
    # climax: rings of light from the lead
    for i in range(3):
        t0 = T_CLIMAX + i * 0.45
        loop('.p%d' % i, [(t0, 'opacity:0;transform:scale(1)', 'linear'), (t0 + 0.05, 'opacity:.8;transform:scale(1.2)', EASE_OUT),
                          (t0 + 2.4, 'opacity:0;transform:scale(%s)' % f(19 - i * 4), 'linear')])
    # threads darken together as the light passes, then settle
    css.append('@keyframes thr{0%%,%s%%{stroke-opacity:.42}%s%%{stroke-opacity:.75}%s%%,100%%{stroke-opacity:.42}}'
               '.threads{animation:thr %ss ease-in-out infinite}' % (pct(T_CLIMAX + 0.2), pct(T_CLIMAX + 0.9), pct(T_CLIMAX + 2.6), f(LOOP)))
    loop('.beam', [(T_CLIMAX + 1.0, 'opacity:0', EASE_SOFT), (T_CLIMAX + 2.6, 'opacity:1', 'linear')])
    draw_on('.steam', 28.0, 1.6)
    # the veil that carries the drawing back to before dawn
    css.append('@keyframes veil{0%%,%s%%{opacity:0}%s%%{opacity:1;animation-timing-function:ease-in-out}100%%{opacity:0}}'
               '.veil{animation:veil %ss ease-in-out infinite}' % (pct(VEIL_IN), pct(RESET), f(LOOP)))
    # without motion, the drawing simply shows the finished scene and does not loop
    static = ('.sun{transform:translateY(-%spx)}.turn{transform:scaleX(-1)}.front{opacity:0}.shade{opacity:0}'
              '.veil,.dusk,.rip,.halo{opacity:0}' % f(rise))
    style = '<style>%s@media (prefers-reduced-motion: no-preference){%s}</style>' % (static, ''.join(css))
    el.append('<rect class="veil" width="%d" height="%d" fill="%s" opacity="0"/>' % (W, H, PAPER))

    # the page shows this at about 700 px wide, so lines are drawn a little heavier
    body = re.sub(r'stroke-width="([0-9.]+)"', lambda m: 'stroke-width="%s"' % f(float(m.group(1)) * 1.35), ''.join(el))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-label="朝日の差す紙の上で新聞がめくられ、見出しが書かれ、まわりのチームの点が糸でつながって小さな図になる絵">%s'
            '<rect width="%d" height="%d" fill="%s"/>%s</svg>\n' % (W, H, style, W, H, PAPER, body))


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
    for name, (w, h) in {'news-hero-wide.svg': (1200, 400), 'news-hero-narrow.svg': (1200, 675)}.items():
        svg = compose(w, h)
        open(os.path.join(root, name), 'w', encoding='utf-8').write(svg)
        print(name, len(svg.encode('utf-8')), 'bytes')
