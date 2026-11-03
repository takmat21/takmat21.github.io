"""論文タブのトップ画（SVG）を作る。

assets/paper-hero-wide.svg（PC用 3:1）と assets/paper-hero-narrow.svg（スマホ用 16:9）を書き出す。
朝刊のトップ画（tools/news_hero.py）と同じ色・同じ手描き風の線。主題は
「記憶が外の記録に移り、整理され、必要なときに糸で引き出される」。
32.4秒で一周するループ：
夜のしずけさ（メモの紙片がただよい、文字の線が薄れていく）→
紙片が一枚ずつ左の棚のマスに収まり、線が書き直される →
棚の二枚が場所を入れ替え、棚に一段足され、最後の紙片がそこへ収まる →
中央の朱の点（統括）が目覚め、必要な紙片にだけ糸を伸ばし、その紙片が灯る →
灯った紙片が右へ集まって一冊の本（論文）になり、表紙に見出しが書かれ、灯りが本を照らす（クライマックス）→
完成した本と棚の余韻 → 紙の色の幕でふわっと始めに戻る。
SVG内のCSSだけで動く（JSなし）。prefers-reduced-motion では完成した絵だけを出し、ループしない。文字・ロゴは入れない。

使い方: python3 tools/paper_hero.py
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


def wobble(points, rnd, amp=1.2):
    """折れ線を細かく分け、横にわずかに揺らした path の d を返す（手描き風）。"""
    out = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        L = math.hypot(x1 - x0, y1 - y0) or 1
        nx, ny = -(y1 - y0) / L, (x1 - x0) / L
        n = max(2, int(L / 22))
        ph = rnd.random() * 6
        for k in range(n):
            t = k / n
            w = math.sin(ph + t * 3.1) * amp + (rnd.random() - 0.5) * amp * 0.5
            out.append((x0 + (x1 - x0) * t + nx * w, y0 + (y1 - y0) * t + ny * w))
    out.append(points[-1])
    return 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in out)


def pts(q):
    return ' '.join('%s,%s' % (f(x), f(y)) for x, y in q)


def compose(W, H, seed=5):
    rnd = random.Random(seed)
    wide = W / H > 2
    cx, cy = W * 0.5, H * (0.53 if wide else 0.52)
    s = min(W / 1200.0, H / 400.0) * (1.0 if wide else 1.3)
    U = lambda x, y: (cx + x * s, cy + y * s)
    el = []
    css = []

    # ---- 灯り（右上）：クライマックスで本を照らす ----
    lx, ly = U(392, -112) if wide else U(352, -150)
    lr = 30 * s
    lamp = '<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.9"/>' % (f(lx), f(ly), f(lr), TERRA)
    rays = ''
    for k in range(6):
        a = math.radians(-200 + k * 44)
        r0, r1 = lr + 10 * s, lr + 21 * s
        rays += ('<path d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="0.7" fill="none"/>'
                 % (wobble([(lx + math.cos(a) * r0, ly + math.sin(a) * r0), (lx + math.cos(a) * r1, ly + math.sin(a) * r1)], rnd, 0.4),
                    TERRA, f(1.5 * s)))
    el.append('<g class="lamp">%s<g class="rays">%s</g></g>' % (lamp, rays))

    # ---- 棚：3段×4列のマス（左）。あとから4段目が足される ----
    CW, CH = 60, 42
    gx0, gy0 = -372, -108
    ROWS, COLS = 3, 4
    gx1 = gx0 + COLS * CW
    gy1 = gy0 + ROWS * CH
    gy2 = gy1 + CH  # bottom of the added row
    shelf = []
    sw = f(1.2 * s)
    shelf.append(wobble([U(gx0, gy0), U(gx1, gy0), U(gx1, gy1), U(gx0, gy1), U(gx0, gy0)], rnd, 0.7))
    for r in range(1, ROWS):
        shelf.append(wobble([U(gx0, gy0 + r * CH), U(gx1, gy0 + r * CH)], rnd, 0.6))
    for c in range(1, COLS):
        shelf.append(wobble([U(gx0 + c * CW, gy0), U(gx0 + c * CW, gy1)], rnd, 0.6))
    el.append('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.55" stroke-linecap="round" stroke-linejoin="round"/>'
              % (' '.join(shelf), INK, sw))
    # the added row: drawn on later, one stroke at a time
    added = [[U(gx0, gy1), U(gx0, gy2), U(gx1, gy2), U(gx1, gy1)]] + [[U(gx0 + c * CW, gy1), U(gx0 + c * CW, gy2)] for c in range(1, COLS)]
    for k, a in enumerate(added):
        el.append('<path class="nr nr%d" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.55" stroke-linecap="round" stroke-linejoin="round"/>'
                  % (k, wobble(a, rnd, 0.6), INK, sw))

    def cell(r, c):
        return (gx0 + c * CW + CW / 2, gy0 + r * CH + CH / 2)

    SW_, SH_ = 46, 28

    def slip_shape(x, y, n_lines, line_cls=None, op='0.5'):
        """紙片：生成りの小さな札と、読めない線が2〜3本。x, y は単位座標の中心。"""
        q = [U(x - SW_ / 2, y - SH_ / 2), U(x + SW_ / 2, y - SH_ / 2), U(x + SW_ / 2, y + SH_ / 2), U(x - SW_ / 2, y + SH_ / 2)]
        out = '<polygon points="%s" fill="%s"/>' % (pts(q), SHEET)
        out += ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.75" stroke-linejoin="round"/>'
                % (wobble(q + [q[0]], rnd, 0.5), INK, f(1.1 * s)))
        lines = ''
        for i in range(n_lines):
            yy = y - 7 + i * 7
            x1 = x + 15 - (rnd.random() * 12 if i == n_lines - 1 else rnd.random() * 3)
            d = wobble([U(x - 16, yy), U(x1, yy)], rnd, 0.3)
            lines += ('<path%s d="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-opacity="%s" fill="none"/>'
                      % (' class="%s" pathLength="1"' % line_cls if line_cls else '', d, INK, f((1.8 if i == 0 else 1.2) * s), op))
        return out + lines

    # which cells are filled from the start (older memories), which by the drifting slips
    pre = [(0, 0), (0, 2), (1, 1), (1, 3), (2, 0), (2, 2)]
    drift_cells = [(0, 1), (1, 0), (0, 3), (2, 1), (1, 2), (2, 3), (3, 1)]  # the last one goes into the added row
    selected = [(0, 3), (2, 2), (3, 1)]  # what the lead pulls out later (one settled, one old, the newest)
    swap = ((0, 0), (1, 1))  # two old slips trade places

    # soft lights behind the slips that are pulled out
    for i, (r, c) in enumerate(selected):
        x, y = U(*cell(r, c))
        el.append('<circle class="sh sh%d" cx="%s" cy="%s" r="%s" fill="%s" opacity="0"/>' % (i, f(x), f(y), f(30 * s), TERRA))

    # old slips: already on the shelf
    for i, (r, c) in enumerate(pre):
        x, y = cell(r, c)
        cls = ''
        if (r, c) == swap[0]:
            cls = ' class="sa"'
        elif (r, c) == swap[1]:
            cls = ' class="sb"'
        el.append('<g%s>%s</g>' % (cls, slip_shape(x, y, 2 + (i % 2), op='0.42')))

    # drifting slips: drawn in their final cell; CSS starts them adrift in the middle of the night
    drift_from = [(-40, -96, -14), (30, 40, 10), (120, -120, -8), (-70, 22, 16), (190, -40, -12), (80, -60, 6), (220, 30, 18)]
    for i, (r, c) in enumerate(drift_cells):
        x, y = cell(r, c)
        el.append('<g class="d d%d">%s</g>' % (i, slip_shape(x, y, 2 + ((i + 1) % 2), line_cls='dl dl%d' % i, op='0.5')))

    # ---- 統括の点（中央下）と糸 ----
    lead = U(-66, 104)
    threads = ''
    for i, (r, c) in enumerate(selected):
        tx, ty = U(*cell(r, c))
        if c == COLS - 1 or r == ROWS:
            tx += 23 * s  # nothing to its right: reach its right edge
        else:
            ty += 14 * s  # otherwise reach its lower edge, so the thread does not cross other slips
        mx, my = (tx + lead[0]) / 2 + (rnd.random() - 0.5) * 30 * s, min(ty, lead[1]) + (ty - lead[1]) * 0.15 - 28 * s
        threads += ('<path class="th th%d" pathLength="1" d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"/>'
                    % (i, f(lead[0]), f(lead[1]), f(mx), f(my), f(tx), f(ty), INK, f(1 * s)))
    el.append('<g class="threads" stroke-opacity="0.42">%s</g>' % threads)

    # ---- 本（右）：集まった紙片が一冊になる ----
    bx, by = 236, -8
    BW, BH = 118, 150
    tilt = math.radians(-5)

    def B(x, y):
        return U(bx + x * math.cos(tilt) - y * math.sin(tilt), by + x * math.sin(tilt) + y * math.cos(tilt))
    bc = B(0, 0)
    # the light that gathers around the book (two soft circles, no filters)
    el.append('<g class="glow" opacity="0.2"><circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.45"/><circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.55"/></g>'
              % (f(bc[0]), f(bc[1]), f(118 * s), TERRA, f(bc[0]), f(bc[1]), f(86 * s), TERRA))
    # rings of light from the book at the climax
    for i in range(2):
        el.append('<circle class="rip rp%d" cx="%s" cy="%s" r="%s" fill="none" stroke="%s" stroke-width="%s" vector-effect="non-scaling-stroke" opacity="0"/>'
                  % (i, f(bc[0]), f(bc[1]), f(40 * s), TERRA, f(1.5 * s)))
    hw, hh = BW / 2, BH / 2
    cover = [B(-hw, -hh), B(hw, -hh), B(hw, hh), B(-hw, hh)]
    pages = [B(-hw + 4, -hh + 5), B(hw + 6, -hh + 5), B(hw + 6, hh + 6), B(-hw + 4, hh + 6)]
    book = '<polygon points="%s" fill="%s" fill-opacity="0.12"/>' % (pts([(x + 7 * s, y + 8 * s) for x, y in pages]), INK)
    book += '<polygon points="%s" fill="%s"/>' % (pts(pages), SHEET)
    book += ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.6" stroke-linejoin="round"/>'
             % (wobble([B(hw, -hh + 5), B(hw + 6, -hh + 5), B(hw + 6, hh + 6), B(-hw + 4, hh + 6), B(-hw + 4, hh)], rnd, 0.5), INK, f(1.1 * s)))
    for k in range(1, 3):  # page edges
        book += ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.3"/>'
                 % (wobble([B(hw + 2 * k, -hh + 2 + 2 * k), B(hw + 2 * k, hh + 2 * k)], rnd, 0.3), INK, f(0.9 * s)))
    book += '<polygon points="%s" fill="%s"/>' % (pts(cover), SHEET)
    spine = [B(-hw, -hh), B(-hw + 13, -hh), B(-hw + 13, hh), B(-hw, hh)]
    book += '<polygon points="%s" fill="%s" fill-opacity="0.5"/>' % (pts(spine), SAGE)
    book += ('<path class="bo" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.8" stroke-linejoin="round"/>'
             % (wobble(cover + [cover[0]], rnd, 0.8), INK, f(1.3 * s)))
    book += ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.5"/>'
             % (wobble([B(-hw + 13, -hh), B(-hw + 13, hh)], rnd, 0.4), INK, f(1 * s)))
    # cover: a label frame, the headline (thick) and two thin lines under it
    lab = [B(-hw + 26, -hh + 26), B(hw - 14, -hh + 26), B(hw - 14, -hh + 76), B(-hw + 26, -hh + 76)]
    book += ('<path class="lb" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.45" stroke-linejoin="round"/>'
             % (wobble(lab + [lab[0]], rnd, 0.5), INK, f(1 * s)))
    book += ('<path class="hl" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.85" stroke-linecap="round"/>'
             % (wobble([B(-hw + 34, -hh + 44), B(hw - 24, -hh + 44)], rnd, 0.5), INK, f(4 * s)))
    for k, (x1, yy) in enumerate([(hw - 30, -hh + 60), (hw - 52, -hh + 68)]):
        book += ('<path class="cl cl%d" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.4" stroke-linecap="round"/>'
                 % (k, wobble([B(-hw + 34, yy), B(x1, yy)], rnd, 0.3), INK, f(1.3 * s)))
    # a few lines low on the cover, like an author line
    book += ('<path class="cl cl2" pathLength="1" d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.35" stroke-linecap="round"/>'
             % (wobble([B(-hw + 34, hh - 24), B(hw - 46, hh - 24)], rnd, 0.3), INK, f(1.2 * s)))
    el.append('<g class="book">%s</g>' % book)

    # the copies that fly from the shelf into the book (hidden when still)
    fly_to = []
    for i, (r, c) in enumerate(selected):
        x, y = cell(r, c)
        el.append('<g class="fl fl%d" opacity="0">%s</g>' % (i, slip_shape(x, y, 2, op='0.5')))
        X, Y = U(x, y)
        fly_to.append((bc[0] - X + (i - 1) * 10 * s, bc[1] - Y + (i - 1) * 14 * s))

    # the lamp's light reaching the book
    b0 = (lx - lr * 0.8, ly + lr * 0.5)
    b1 = B(hw - 10, -hh - 6)
    el.append('<path class="beam" d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="%s" stroke-opacity="0.5" stroke-linecap="round" stroke-dasharray="%s %s"/>'
              % (f(b0[0]), f(b0[1]), f((b0[0] + b1[0]) / 2 + 6 * s), f((b0[1] + b1[1]) / 2 - 18 * s), f(b1[0]), f(b1[1]), TERRA, f(1.4 * s), f(2.5 * s), f(5 * s)))

    el.append('<circle class="lead" cx="%s" cy="%s" r="%s" fill="%s"/>' % (f(lead[0]), f(lead[1]), f(6 * s), VERM))
    el.append('<rect class="dusk" width="%d" height="%d" fill="%s" opacity="0"/>' % (W, H, INK))

    # ---- one loop, 32.4 s (seconds) ----
    #  0-6     night: the slips drift; their lines fade
    #  6-14    one by one, the slips settle into the shelf and their lines are redrawn
    #  13.6-17 two old slips trade places; a new row is added and the last slip settles there
    #  17-21   the lead wakes and reaches only the slips it needs; they light up
    #  21-26.5 climax: they fly to the right and become one book; the headline is written; the lamp lights the book
    #  26.5-30.6 stillness; then a paper-coloured veil carries it back to the night
    LOOP, VEIL_IN, RESET = 32.4, 30.6, 31.4
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
        loop(selector, [(t0, 'stroke-dashoffset:1', ease), (t0 + dur, 'stroke-dashoffset:0', 'linear')])

    def tf(dx, dy, rot=0, sc=1):
        v = 'transform:translate(%spx,%spx)' % (f(dx), f(dy))
        if rot:
            v += ' rotate(%sdeg)' % f(rot)
        if sc != 1:
            v += ' scale(%s)' % f(sc)
        return v
    ZERO = 'transform:translate(0px,0px) rotate(0deg) scale(1)'

    css.append('.dl,.nr,.th,.bo,.lb,.hl,.cl{stroke-dasharray:1}')
    css.append('.d,.sa,.sb,.fl,.lead,.sh,.rip,.book{transform-box:fill-box;transform-origin:center}')
    # night
    loop('.dusk', [(0.0, 'opacity:.16', EASE_SOFT), (6.5, 'opacity:0', 'linear')])
    loop('.lamp', [(0.0, 'opacity:.45', 'linear'), (24.4, 'opacity:.45', EASE_SOFT), (25.4, 'opacity:1', 'linear')])
    loop('.rays', [(24.6, 'opacity:0', EASE_SOFT), (25.8, 'opacity:1', 'linear')])
    # drifting slips: float gently, then settle one by one
    settle = [6.2 + i * 1.15 for i in range(6)] + [16.2]
    for i, (r, c) in enumerate(drift_cells):
        x, y = cell(r, c)
        fx, fy, rot = drift_from[i]
        dx, dy = (fx - x) * s, (fy - y) * s
        bob = [(dx, dy, rot), (dx + 9 * s, dy - 7 * s, rot + 4), (dx - 4 * s, dy + 6 * s, rot - 2)]
        p, t, k = [], 0.0, 0
        while t < settle[i] - 1.1:
            bx_, by_, br = bob[k % 3]
            p.append((t, tf(bx_, by_, br), EASE_SOFT))
            t += 3.4
            k += 1
        bx_, by_, br = bob[k % 3]
        p.append((settle[i] - 1.1, tf(bx_, by_, br), EASE_IO))
        p.append((settle[i], ZERO, 'linear'))
        # the very first point must be at 0 s with the drift start; loop() prepends it from p[0]
        loop('.d%d' % i, p)
        # lines fade in the night, then are written again once the slip is in place
        loop('.dl%d' % i, [(0.0, 'opacity:.9;stroke-dashoffset:0', EASE_SOFT), (5.5, 'opacity:.25;stroke-dashoffset:0', 'linear'),
                           (settle[i] - 0.05, 'opacity:.25;stroke-dashoffset:0', 'linear'), (settle[i], 'opacity:1;stroke-dashoffset:1', EASE_OUT),
                           (settle[i] + 0.7, 'opacity:1;stroke-dashoffset:0', 'linear')])
    # two old slips trade places (each lifts a little on its way)
    (ra, ca), (rb, cb) = swap
    ax, ay = cell(ra, ca)
    bx2, by2 = cell(rb, cb)
    vx, vy = (ax - bx2) * s, (ay - by2) * s
    T_SW = 13.7
    loop('.sa', [(T_SW, tf(-vx, -vy), EASE_IO), (T_SW + 0.8, tf(-vx / 2 - 6 * s, -vy / 2 - 16 * s, -6), EASE_IO), (T_SW + 1.6, ZERO, 'linear')])
    loop('.sb', [(T_SW, tf(vx, vy), EASE_IO), (T_SW + 0.8, tf(vx / 2 + 6 * s, vy / 2 + 16 * s, 6), EASE_IO), (T_SW + 1.6, ZERO, 'linear')])
    # the shelf grows a row
    for k in range(len(added)):
        draw_on('.nr%d' % k, 14.6 + (0 if k == 0 else 0.7 + k * 0.18), 0.8 if k == 0 else 0.4)
    # the lead wakes and reaches for what it needs
    T_LEAD, T_SEND = 17.2, 21.2
    loop('.lead', [(0.0, 'opacity:.4;transform:scale(1)', EASE_IO), (T_LEAD, 'opacity:.4;transform:scale(1)', EASE_IO),
                   (T_LEAD + 0.5, 'opacity:1;transform:scale(1.5)', EASE_IO), (T_LEAD + 1.2, 'opacity:1;transform:scale(1)', 'linear'),
                   (T_SEND - 0.3, 'opacity:1;transform:scale(1)', EASE_IO), (T_SEND + 0.3, 'opacity:1;transform:scale(1.9)', EASE_SOFT),
                   (T_SEND + 1.4, 'opacity:1;transform:scale(1)', 'linear')])
    T_FLY = 21.5
    for i in range(len(selected)):
        t_on = 17.8 + i * 0.85
        draw_on('.th%d' % i, t_on, 0.9)
        loop('.sh%d' % i, [(t_on + 0.7, 'opacity:0;transform:scale(.5)', EASE_SOFT), (t_on + 1.2, 'opacity:.5;transform:scale(1.15)', EASE_SOFT),
                           (t_on + 2.0, 'opacity:.38;transform:scale(1)', 'linear'), (T_FLY + i * 0.25, 'opacity:.38;transform:scale(1)', EASE_SOFT),
                           (T_FLY + i * 0.25 + 1.6, 'opacity:0;transform:scale(1.4)', 'linear')])
        t0 = T_FLY + i * 0.25
        dx, dy = fly_to[i]
        loop('.fl%d' % i, [(t0 - 0.01, 'opacity:0;' + ZERO, 'linear'), (t0, 'opacity:1;' + ZERO, EASE_IO),
                           (t0 + 1.0, 'opacity:1;' + tf(dx * 0.62, dy * 0.62 - 26 * s, 8, 0.8), EASE_IO),
                           (t0 + 1.6, 'opacity:0;' + tf(dx, dy, 0, 0.55), 'linear')])
    # the book forms as the slips arrive
    T_BOOK = 22.3
    loop('.book', [(T_BOOK, 'opacity:0;transform:scale(.86)', EASE_OUT), (T_BOOK + 1.2, 'opacity:1;transform:scale(1)', 'linear')])
    draw_on('.bo', T_BOOK, 1.2, EASE_IO)
    draw_on('.lb', T_BOOK + 1.0, 0.7)
    draw_on('.hl', T_BOOK + 1.6, 0.8)
    for k in range(3):
        draw_on('.cl%d' % k, T_BOOK + 2.3 + k * 0.3, 0.5)
    # climax: the lamp lights the book
    T_LIGHT = 25.0
    loop('.beam', [(T_LIGHT, 'opacity:0', EASE_SOFT), (T_LIGHT + 1.0, 'opacity:1', 'linear')])
    loop('.glow', [(T_LIGHT, 'opacity:0', EASE_SOFT), (T_LIGHT + 0.8, 'opacity:.42', EASE_SOFT), (T_LIGHT + 3.0, 'opacity:.2', 'linear')])
    for i in range(2):
        t0 = T_LIGHT + 0.3 + i * 0.5
        loop('.rp%d' % i, [(t0, 'opacity:0;transform:scale(1)', 'linear'), (t0 + 0.05, 'opacity:.7;transform:scale(1.2)', EASE_OUT),
                           (t0 + 2.4, 'opacity:0;transform:scale(%s)' % f(4.2 - i), 'linear')])
    css.append('@keyframes thr{0%%,%s%%{stroke-opacity:.42}%s%%{stroke-opacity:.72}%s%%,100%%{stroke-opacity:.42}}'
               '.threads{animation:thr %ss ease-in-out infinite}' % (pct(T_SEND - 0.2), pct(T_SEND + 0.5), pct(T_SEND + 2.4), f(LOOP)))
    css.append('@keyframes veil{0%%,%s%%{opacity:0}%s%%{opacity:1;animation-timing-function:ease-in-out}100%%{opacity:0}}'
               '.veil{animation:veil %ss ease-in-out infinite}' % (pct(VEIL_IN), pct(RESET), f(LOOP)))
    static = '.veil,.dusk,.rip,.sh,.fl{opacity:0}'
    style = '<style>%s@media (prefers-reduced-motion: no-preference){%s}</style>' % (static, ''.join(css))
    el.append('<rect class="veil" width="%d" height="%d" fill="%s" opacity="0"/>' % (W, H, PAPER))

    body = re.sub(r'stroke-width="([0-9.]+)"', lambda m: 'stroke-width="%s"' % f(float(m.group(1)) * 1.35), ''.join(el))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-label="夜にただよっていたメモの紙片が棚のマスに整理され、中央の朱の点から伸びた糸が必要な紙片だけを引き出し、一冊の本にまとまって灯りに照らされる絵">%s'
            '<rect width="%d" height="%d" fill="%s"/>%s</svg>\n' % (W, H, style, W, H, PAPER, body))


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
    for name, (w, h) in {'paper-hero-wide.svg': (1200, 400), 'paper-hero-narrow.svg': (1200, 675)}.items():
        svg = compose(w, h)
        open(os.path.join(root, name), 'w', encoding='utf-8').write(svg)
        print(name, len(svg.encode('utf-8')), 'bytes')
