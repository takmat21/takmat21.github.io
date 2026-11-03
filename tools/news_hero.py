"""朝刊のトップ画（SVG）を作る。

assets/news-hero-wide.svg（PC用 3:1）と assets/news-hero-narrow.svg（スマホ用 16:9）を書き出す。
絵：生成りの地に、開いた新聞（文字は読めない細い線だけ）、うしろに朝日、
新聞のまわりにチームの点が5つ、紙の上の朱の点（統括AI）と細い糸でつながる。
線は手描き風にわずかに揺らす。17秒で一周するループ（約12.5秒の流れ→最後の絵で約3秒止まる→
紙の色の幕でふわっと最初に戻る）：
糸が描かれ朝日が少し昇る → ページがめくれ、見出しと本文の線が一本ずつ書かれる →
朝日が昇りきり光の線が統括の点に届く → 担当どうしも糸でつながって小さな図になり、点が順に脈打つ。
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

    def page(side, Q, cls=None, photo_col=None, unit=1.0, start_k=0):
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
                out.append('<polygon points="%s" fill="%s" fill-opacity="0.35"/>' % (' '.join('%s,%s' % (f(x), f(y)) for x, y in q), SAGE))
                for yy in range(-44, -4, 8):
                    for xx in range(int(a) + 6, int(b) - 2, 8):
                        X, Y = Q(xx + (4 if (yy // 8) % 2 else 0), yy)
                        out.append('<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.55"/>' % (f(X), f(Y), f(1.3 * unit), SAGE))
        return ''.join(out), k

    # 左ページ（最初からある紙面）
    left, _ = page(-1, P, photo_col=1, unit=s)
    el.append(left)
    # 右ページの下の面：めくったあとに見出しと本文が一本ずつ書かれる
    fresh, nfresh = page(1, P, cls='w', photo_col=None, unit=s)
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

    # チームの点と糸：紙の上の朱の点（統括）へ、まわりの5点から
    lead = P(52, -20)
    team = [P(-300, -40), P(-250, 120), P(270, 130), P(330, 40), P(-110, -170)]
    # 朝日が昇りきると、光の線が一本、統括の点まで届く
    bx0, by0 = sx - sr * 0.75, sy - rise - sr * 0.35
    el.append('<path class="beam" pathLength="1" d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.5" stroke-linecap="round" stroke-dasharray="0.012 0.018"/>'
              % (f(bx0), f(by0), f((bx0 + lead[0]) / 2), f(min(by0, lead[1]) - 34 * s), f(lead[0] + 8 * s), f(lead[1] - 6 * s), TERRA, f(1.4 * s)))
    for k, t in enumerate(team):
        mx, my = (t[0] + lead[0]) / 2 + (rnd.random() - 0.5) * 60 * s, (t[1] + lead[1]) / 2 - 30 * s
        d = 'M%s %s Q%s %s %s %s' % (f(t[0]), f(t[1]), f(mx), f(my), f(lead[0]), f(lead[1]))
        el.append('<path class="thread t%d" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.42" stroke-linecap="round"/>'
                  % (k, d, INK, f(1 * s)))
    # 担当どうしも、となり同士で糸につながって輪になる（小さな図）
    order = sorted(range(len(team)), key=lambda k: math.atan2(team[k][1] - lead[1], team[k][0] - lead[0]))
    for i in range(len(order)):
        a, b = team[order[i]], team[order[(i + 1) % len(order)]]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        ox, oy = mx - lead[0], my - lead[1]
        ol = math.hypot(ox, oy) or 1
        c = (mx + ox / ol * 26 * s, my + oy / ol * 26 * s)  # bow outward, away from the lead
        el.append('<path class="ring r%d" pathLength="1" d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.32" stroke-linecap="round"/>'
                  % (i, f(a[0]), f(a[1]), f(c[0]), f(c[1]), f(b[0]), f(b[1]), INK, f(0.9 * s)))
    for k, t in enumerate(team):
        el.append('<circle class="member m%d" cx="%s" cy="%s" r="%s" fill="%s"/>' % (k, f(t[0]), f(t[1]), f((4.2 if k != 2 else 5) * s), SAGE if k == 2 else INK))
    el.append('<circle class="lead" cx="%s" cy="%s" r="%s" fill="%s"/>' % (f(lead[0]), f(lead[1]), f(6 * s), VERM))
    # 細い湯気のような線：朝の一服（湯のみは描かず、線だけ）
    st = P(-262, 104)
    el.append('<path class="steam" pathLength="1" d="M%s %s c %s %s %s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.4" stroke-linecap="round"/>'
              % (f(st[0]), f(st[1] - 10 * s), f(-6 * s), f(-10 * s), f(6 * s), f(-16 * s), f(0), f(-28 * s), INK, f(1 * s)))

    # ---- timeline (seconds), one 17 s loop:
    # 0-12.5 the story, 12.5-15.8 hold on the last scene, 15.8-16.4 a paper-coloured veil
    # comes up, 16.4 everything returns to the start under the veil, 16.4-17 the veil clears.
    LOOP, VEIL_IN, RESET = 17.0, 15.8, 16.4
    T_TURN, D_TURN = 2.8, 1.5
    T_WRITE = T_TURN + D_TURN - 0.1
    T_BEAM, T_RING = 8.0, 9.0
    EASE_OUT, EASE_IO = 'cubic-bezier(.2,.6,.35,1)', 'cubic-bezier(.45,.05,.35,1)'
    kf_count = [0]

    def loop(selector, prop, points):
        """points: [(seconds, value, easing to the next point)]. Holds the last value until RESET,
        then snaps back to the first value (hidden by the veil) and repeats every LOOP seconds."""
        kf_count[0] += 1
        name = 'k%d' % kf_count[0]
        first = points[0][1]
        stops = [(0.0, first, points[0][2])]
        for t, v, e in points:
            stops.append((t, v, e))
        stops.append((RESET - 0.01, points[-1][1], 'linear'))
        stops.append((RESET, first, 'linear'))
        stops.append((LOOP, first, 'linear'))
        body = ''.join('%s%%{%s:%s;animation-timing-function:%s}' % (('%.3f' % (t / LOOP * 100)).rstrip('0').rstrip('.'), prop, v, e)
                       for t, v, e in stops)
        css.append('@keyframes %s{%s}%s{animation:%s %ss linear infinite}' % (name, body, selector, name, f(LOOP)))

    def draw_on(selector, t0, dur, ease=EASE_OUT):
        loop(selector, 'stroke-dashoffset', [(t0, '1', ease), (t0 + dur, '0', 'linear')])

    css.append('.thread,.w,.ring,.steam{stroke-dasharray:1}')
    for k in range(5):
        draw_on('.t%d' % k, 0.4 + k * 0.22, 1.6)
    draw_on('.steam', 1.2, 1.2)
    # the sun: a small rise at the start, a pause, then it clears the horizon
    loop('.sun', 'transform', [(0.0, 'translateY(%spx)' % f(10 * s), EASE_IO), (2.4, 'translateY(0)', 'linear'),
                               (5.95, 'translateY(0)', EASE_IO), (9.6, 'translateY(-%spx)' % f(rise), 'linear')])
    # page turn about the fold
    css.append('.turn{transform-origin:0 0}')
    loop('.turn', 'transform', [(T_TURN, 'scaleX(1)', EASE_IO), (T_TURN + D_TURN, 'scaleX(-1)', 'linear')])
    mid = T_TURN + D_TURN / 2
    loop('.front', 'opacity', [(mid - 0.02, '1', 'linear'), (mid + 0.02, '0', 'linear')])
    loop('.back', 'opacity', [(mid - 0.02, '0', 'linear'), (mid + 0.02, '1', 'linear')])
    loop('.shade', 'opacity', [(T_TURN, '0', EASE_IO), (mid, '.14', EASE_IO), (T_TURN + D_TURN, '0', 'linear')])
    # headline and lines on the fresh page, one by one
    for k in range(nfresh):
        draw_on('.w%d' % k, T_WRITE + (0 if k == 0 else 0.55 + (k - 1) * 0.16), 0.5)
    loop('.beam', 'opacity', [(T_BEAM, '0', EASE_OUT), (T_BEAM + 1.4, '1', 'linear')])
    for i in range(len(team)):
        draw_on('.r%d' % i, T_RING + i * 0.32, 0.7, EASE_IO)
    css.append('.member,.lead{transform-box:fill-box;transform-origin:center}')

    def pulse(selector, t0, dur):
        loop(selector, 'transform', [(t0, 'scale(1)', EASE_IO), (t0 + dur * 0.45, 'scale(1.45)', EASE_IO), (t0 + dur, 'scale(1)', 'linear')])
    for k in range(len(team)):
        pulse('.m%d' % k, T_RING + 1.8 + k * 0.18, 0.9)
    pulse('.lead', T_RING + 2.9, 1.2)
    # the veil that carries the drawing back to the start
    css.append('@keyframes veil{0%%,%s%%{opacity:0}%s%%{opacity:1;animation-timing-function:ease-in-out}100%%{opacity:0}}'
               '.veil{animation:veil %ss ease-in-out infinite}'
               % (('%.3f' % (VEIL_IN / LOOP * 100)).rstrip('0'), ('%.3f' % (RESET / LOOP * 100)).rstrip('0'), f(LOOP)))
    # without motion, the drawing simply shows the last scene and does not loop
    static = ('.sun{transform:translateY(-%spx)}.turn{transform:scaleX(-1)}.front{opacity:0}.shade{opacity:0}.veil{opacity:0}' % f(rise))
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
