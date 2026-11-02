"""朝刊のトップ画（SVG）を作る。

assets/news-hero-wide.svg（PC用 3:1）と assets/news-hero-narrow.svg（スマホ用 16:9）を書き出す。
絵：生成りの地に、開いた新聞（文字は読めない細い線だけ）、うしろに朝日、
新聞のまわりにチームの点が5つ、紙の上の朱の点（統括AI）と細い糸でつながる。
線は手描き風にわずかに揺らす。開いたときに一度だけ、糸が描かれ朝日が少し昇る
（SVG内のCSS。prefers-reduced-motion では動かさない）。文字・ロゴは入れない。

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

    # 地平線と朝日（新聞のうしろ、右寄り）
    sx, sy, sr = cx + 250 * s, cy - 18 * s, 62 * s
    el.append('<g class="sun"><circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.9"/></g>' % (f(sx), f(sy), f(sr), TERRA))
    el.append('<rect x="0" y="%s" width="%s" height="%s" fill="%s"/>' % (f(cy - 18 * s + 4 * s), f(W), f(H), PAPER))
    hz = cy - 18 * s + 4 * s
    el.append('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.55"/>'
              % (wobble([(cx - 420 * s, hz), (cx + 420 * s, hz)], rnd, 0.8), INK, f(1.1 * s)))
    # 朝日の光：短い線を数本
    for k in range(5):
        a = math.radians(-160 + k * 35)
        r0, r1 = sr + 12 * s, sr + 26 * s
        el.append('<path class="ray" d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.7" fill="none"/>'
                  % (wobble([(sx + math.cos(a) * r0, sy + math.sin(a) * r0), (sx + math.cos(a) * r1, sy + math.sin(a) * r1)], rnd, 0.5),
                     TERRA, f(1.6 * s)))

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
    # 紙面：見出しの太線・本文の細線（読めない線だけ）・写真の枠（セージの網）
    for side in (-1, 1):
        x0 = 14 if side > 0 else -186
        el.append('<path d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.85" fill="none"/>'
                  % (wobble([P(x0, -72), P(x0 + 120 + rnd.random() * 30, -72)], rnd, 0.5), INK, f(4 * s)))
        cols = [(x0, x0 + 78), (x0 + 92, x0 + 170)]
        for ci, (a, b) in enumerate(cols):
            photo = side < 0 and ci == 1
            for r in range(9):
                y = -48 + r * 14
                if photo and r < 4:
                    continue
                end = b - (rnd.random() * 26 if r % 4 == 3 else rnd.random() * 6)
                el.append('<path d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.38" fill="none"/>'
                          % (wobble([P(a, y), P(end, y)], rnd, 0.35), INK, f(1.4 * s)))
            if photo:
                q = [P(a, -50), P(b, -50), P(b, -2), P(a, -2)]
                el.append('<polygon points="%s" fill="%s" fill-opacity="0.35"/>' % (' '.join('%s,%s' % (f(x), f(y)) for x, y in q), SAGE))
                for yy in range(-44, -4, 8):
                    for xx in range(int(a) + 6, int(b) - 2, 8):
                        X, Y = P(xx + (4 if (yy // 8) % 2 else 0), yy)
                        el.append('<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.55"/>' % (f(X), f(Y), f(1.3 * s), SAGE))

    # チームの点と糸：紙の上の朱の点（統括）へ、まわりの5点から
    lead = P(52, -20)
    team = [P(-300, -40), P(-250, 120), P(270, 130), P(330, 40), P(-110, -170)]
    for k, t in enumerate(team):
        mx, my = (t[0] + lead[0]) / 2 + (rnd.random() - 0.5) * 60 * s, (t[1] + lead[1]) / 2 - 30 * s
        d = 'M%s %s Q%s %s %s %s' % (f(t[0]), f(t[1]), f(mx), f(my), f(lead[0]), f(lead[1]))
        el.append('<path class="thread t%d" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.42" stroke-linecap="round"/>'
                  % (k, d, INK, f(1 * s)))
    for k, t in enumerate(team):
        el.append('<circle class="member" cx="%s" cy="%s" r="%s" fill="%s"/>' % (f(t[0]), f(t[1]), f((4.2 if k != 2 else 5) * s), SAGE if k == 2 else INK))
    el.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (f(lead[0]), f(lead[1]), f(6 * s), VERM))
    # 細い湯気のような線：朝の一服（湯のみは描かず、線だけ）
    st = P(-262, 104)
    el.append('<path d="M%s %s c %s %s %s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.4" stroke-linecap="round"/>'
              % (f(st[0]), f(st[1] - 10 * s), f(-6 * s), f(-10 * s), f(6 * s), f(-16 * s), f(0), f(-28 * s), INK, f(1 * s)))

    css = ('<style>@media (prefers-reduced-motion: no-preference){'
           '.thread{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.6s ease-out forwards}'
           + ''.join('.t%d{animation-delay:%.2fs}' % (k, 0.4 + k * 0.22) for k in range(5)) +
           '.sun{transform:translateY(%spx);animation:rise 2.4s ease-out forwards}'
           '@keyframes draw{to{stroke-dashoffset:0}}@keyframes rise{to{transform:translateY(0)}}}</style>' % f(10 * s))
    # the page shows this at about 700 px wide, so lines are drawn a little heavier
    body = re.sub(r'stroke-width="([0-9.]+)"', lambda m: 'stroke-width="%s"' % f(float(m.group(1)) * 1.35), ''.join(el))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-label="朝日の差す紙の上に開いた新聞と、それを囲むチームの点が糸でつながった絵">%s'
            '<rect width="%d" height="%d" fill="%s"/>%s</svg>\n' % (W, H, css, W, H, PAPER, body))


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
    for name, (w, h) in {'news-hero-wide.svg': (1200, 400), 'news-hero-narrow.svg': (1200, 675)}.items():
        svg = compose(w, h)
        open(os.path.join(root, name), 'w', encoding='utf-8').write(svg)
        print(name, len(svg.encode('utf-8')), 'bytes')
