"""Writes scene.rml for the Rive piece 「記録が、物語になる」.

Scattered small records (short lines, dots, small squares) drift, are linked by
thin threads that draw themselves on, two links come loose, the records gather
onto one rounded contour that draws closed, then everything loosens back.
12 s loop at 60 fps on a 1500 x 500 artboard. Pure RML: no scripts.

Run: python3 generate.py  (then: rive . --verify / rive inspect . --summary)
"""
import math
import random

W, H = 1500, 500
FPS, DUR = 60, 720
PAPER, INK, VERM, SAGE = 'FFF2ECE0', 'FF2A2622', 'FFB2543C', 'FF8A9A80'
THREAD = 'A62A2622'  # ink at ~65 % alpha

rnd = random.Random(11)
_id = [100]


def nid():
    _id[0] += 1
    return '0:%d' % _id[0]


def f(v):
    return ('%.3f' % v).rstrip('0').rstrip('.')


EASE = '<CubicEaseInterpolator x1="0.42" y1="0" x2="0.58" y2="1"/>'
EASE_OUT = '<CubicEaseInterpolator x1="0.2" y1="0" x2="0.3" y2="1"/>'


def keys(frames):
    """frames: list of (frame, value, ease) -> KeyFrameDouble list. ease None = linear."""
    out = []
    for fr, val, ease in frames:
        if ease:
            out.append('<KeyFrameDouble value="%s" frame="%d" interpolationType="cubic">%s</KeyFrameDouble>' % (f(val), fr, ease))
        else:
            out.append('<KeyFrameDouble value="%s" frame="%d" interpolationType="linear"/>' % (f(val), fr))
    return ''.join(out)


anim = []  # (objectId, property, frames)


def key(obj, prop, frames):
    anim.append((obj, prop, frames))


# ---------- the contour: closed cubic path ----------
CX, CY = 750, 252
N = 8
facs = [1.07, 0.86, 1.13, 1.0, 0.94, 0.84, 1.15, 0.97]
RX, RY = 215, 142
verts = []
for i in range(N):
    a = -math.pi / 2 + 0.25 + 2 * math.pi * i / N + (0.12 if i % 3 == 1 else 0)
    verts.append([CX + RX * facs[i] * math.cos(a), CY + RY * facs[i] * math.sin(a), a])
for i, v in enumerate(verts):
    p, n = verts[i - 1], verts[(i + 1) % N]
    th = math.atan2(n[1] - p[1], n[0] - p[0])
    chord = (math.hypot(v[0] - p[0], v[1] - p[1]) + math.hypot(n[0] - v[0], n[1] - v[1])) / 2
    v.append(th)
    v.append(0.36 * chord)


def bez_segments():
    segs = []
    for i in range(N):
        a, b = verts[i], verts[(i + 1) % N]
        p0 = (a[0], a[1])
        p1 = (a[0] + math.cos(a[3]) * a[4], a[1] + math.sin(a[3]) * a[4])
        p2 = (b[0] - math.cos(b[3]) * b[4], b[1] - math.sin(b[3]) * b[4])
        p3 = (b[0], b[1])
        segs.append((p0, p1, p2, p3))
    return segs


def sample_contour(n=2000):
    pts = []
    for (p0, p1, p2, p3) in bez_segments():
        for k in range(n // N):
            t = k / (n // N)
            u = 1 - t
            x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0]
            y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]
            pts.append((x, y))
    acc = [0.0]
    for i in range(1, len(pts) + 1):
        acc.append(acc[-1] + math.hypot(pts[i % len(pts)][0] - pts[i - 1][0], pts[i % len(pts)][1] - pts[i - 1][1]))
    return pts, acc


cpts, cacc = sample_contour()
CLEN = cacc[-1]


def contour_at(s):
    target = (s % 1) * CLEN
    lo = 0
    while cacc[lo + 1] < target:
        lo += 1
    p, q = cpts[lo], cpts[(lo + 1) % len(cpts)]
    return p, math.atan2(q[1] - p[1], q[0] - p[0])


# ---------- records ----------
KINDS = ['line', 'dot', 'line', 'square', 'line', 'line', 'dot', 'line', 'square', 'line', 'line', 'dot']
NR = len(KINDS)
records = []
for i, kind in enumerate(KINDS):
    s = (i + 0.5 + (rnd.random() - 0.5) * 0.4) / NR
    (sx, sy), tang = contour_at(s)
    records.append({'kind': kind, 's': s, 'slot': (sx, sy), 'tang': tang, 'id': nid()})

# scattered positions: spread across the band, records keep some distance
placed = []
for r in records:
    best, bs = None, -1
    for _ in range(500):
        x, y = 120 + rnd.random() * (W - 240), 70 + rnd.random() * (H - 140)
        d = min([math.hypot(x - px, y - py) for px, py in placed] or [999])
        score = min(d, 210) - abs(math.hypot((x - CX) / 2.6, y - CY) - 170) * 0.25
        if score > bs:
            bs, best = score, (x, y)
    placed.append(best)
    r['pos'] = best
    r['drift'] = ((rnd.random() - 0.5) * 50, (rnd.random() - 0.5) * 36)
    r['rot'] = (rnd.random() - 0.5) * 2.6
    r['rotDrift'] = (rnd.random() - 0.5) * 0.5

# the first record is the vermilion one: where the inquiry starts
ORIGIN = 0

# threads: spanning tree over scattered positions + two short extras
edges, intree = [], [ORIGIN]
while len(intree) < NR:
    best = None
    for a in intree:
        for b in range(NR):
            if b in intree:
                continue
            d = math.hypot(records[a]['pos'][0] - records[b]['pos'][0], records[a]['pos'][1] - records[b]['pos'][1])
            if best is None or d < best[0]:
                best = (d, a, b)
    intree.append(best[2])
    edges.append([best[1], best[2]])
pairs = sorted(((math.hypot(records[a]['pos'][0] - records[b]['pos'][0], records[a]['pos'][1] - records[b]['pos'][1]), a, b)
                for a in range(NR) for b in range(a + 1, NR)
                if [a, b] not in edges and [b, a] not in edges))
for d, a, b in pairs[:2]:
    edges.append([a, b])
depth = {ORIGIN: 0}
queue = [ORIGIN]
while queue:
    n = queue.pop(0)
    for e in edges:
        o = e[1] if e[0] == n else e[0] if e[1] == n else None
        if o is not None and o not in depth:
            depth[o] = depth[n] + 1
            queue.append(o)
for e in edges:
    if depth[e[1]] < depth[e[0]]:
        e.reverse()
maxd = max(depth.values())

# ---------- timeline (frames) ----------
T_SETTLE = 150     # drift ends; records rest at their scattered spot
T_THREAD0 = 180    # first thread starts
T_THREADS = 400    # last thread done
T_LOOSE = (330, 390)  # two threads come loose
T_GATHER = (420, 525)
T_CLOSE = (505, 585)
T_WASH = (570, 610)
T_UNRAVEL = (600, 690)
T_RETURN = (610, 720)

shapes_xml = []
anim_order = []

# records
for i, r in enumerate(records):
    px, py = r['pos']
    dx, dy = r['drift']
    sx, sy = r['slot']
    color = VERM if i == ORIGIN else INK
    if r['kind'] == 'line':
        geo = ('<PointsPath name="Path"><StraightVertex x="-24" y="1.5"/>'
               '<CubicMirroredVertex x="0" y="-1.5" rotation="0" distance="10"/>'
               '<StraightVertex x="24" y="1.5"/></PointsPath>')
        paint = '<Stroke thickness="%s" cap="round" join="round" name="Stroke"><SolidColor colorValue="%s" name="C"/></Stroke>' % ('4' if i == ORIGIN else '3.2', color)
    elif r['kind'] == 'dot':
        geo = '<Ellipse width="9" height="9" originX="0.5" originY="0.5" name="Path"/>'
        paint = '<Fill name="Fill"><SolidColor colorValue="%s" name="C"/></Fill>' % color
    else:
        geo = '<Rectangle width="10" height="10" originX="0.5" originY="0.5" cornerRadiusTL="1" name="Path"/>'
        paint = '<Fill name="Fill"><SolidColor colorValue="%s" name="C"/></Fill>' % color
    shapes_xml.append('<Shape x="%s" y="%s" rotation="%s" name="Record %d" id="%s">%s%s</Shape>'
                      % (f(px + dx), f(py + dy), f(r['rot'] + r['rotDrift']), i, r['id'], geo, paint))
    stg = (i * 7) % 40  # small stagger so the records do not move in lockstep
    g0, g1 = T_GATHER[0] + stg, T_GATHER[1] + stg // 2
    r0, r1 = T_RETURN[0] + stg // 2, T_RETURN[1]
    # path through the gather: a gentle sideways bow
    mx, my = (px + sx) / 2 + (sy - py) * 0.18, (py + sy) / 2 - (sx - px) * 0.18
    key(r['id'], 'x', [(0, px + dx, EASE), (T_SETTLE, px, None), (g0, px, EASE), (g1, sx, None), (r0, sx, EASE), (r1, px + dx, None)])
    key(r['id'], 'y', [(0, py + dy, EASE), (T_SETTLE, py, None), (g0, py, EASE), (g1, sy, None), (r0, sy, EASE), (r1, py + dy, None)])
    key(r['id'], 'rotation', [(0, r['rot'] + r['rotDrift'], EASE), (T_SETTLE, r['rot'], None), (g0, r['rot'], EASE), (g1, r['tang'], None),
                              (r0, r['tang'], EASE), (r1, r['rot'] + r['rotDrift'], None)])

# threads (drawn under the records)
threads_xml = []
loose = sorted(range(len(edges)), key=lambda k: -depth[edges[k][1]])[:2]
for k, (a, b) in enumerate(edges):
    A, B = records[a]['pos'], records[b]['pos']
    L = math.hypot(B[0] - A[0], B[1] - A[1])
    nx, ny = -(B[1] - A[1]) / L, (B[0] - A[0]) / L
    bend = (rnd.random() - 0.5) * 0.35 * L
    mx, my = (A[0] + B[0]) / 2 + nx * bend, (A[1] + B[1]) / 2 + ny * bend
    th = math.atan2(B[1] - A[1], B[0] - A[0])
    sid, tid = nid(), nid()
    threads_xml.append(
        '<Shape x="0" y="0" name="Thread %d" id="%s"><PointsPath name="Path">'
        '<StraightVertex x="%s" y="%s"/><CubicMirroredVertex x="%s" y="%s" rotation="%s" distance="%s"/><StraightVertex x="%s" y="%s"/>'
        '</PointsPath><Stroke thickness="1.3" cap="round" name="Stroke"><SolidColor colorValue="%s" name="C"/>'
        '<TrimPath start="0" end="0" name="Trim" id="%s"/></Stroke></Shape>'
        % (k, sid, f(A[0]), f(A[1]), f(mx), f(my), f(th), f(L * 0.3), f(B[0]), f(B[1]), THREAD, tid))
    t0 = T_THREAD0 + round(depth[a] * (T_THREADS - T_THREAD0 - 50) / max(1, maxd)) + rnd.randint(0, 8)
    key(tid, 'end', [(0, 0, None), (t0, 0, EASE_OUT), (t0 + 50, 1, None), (DUR - 1, 1, None), (DUR, 0, None)])
    if k in loose:
        # this link comes loose: it unwinds back toward where it started
        key(tid, 'start', [(0, 0, None), (T_LOOSE[0] + k % 3 * 6, 0, EASE), (T_LOOSE[1], 1, None), (DUR - 1, 1, None), (DUR, 0, None)])
    else:
        key(sid, 'opacity', [(0, 1, None), (T_GATHER[0] + 10, 1, EASE), (T_GATHER[0] + 60, 0, None), (DUR - 1, 0, None), (DUR, 1, None)])

# the contour, drawing itself closed from the vermilion record's slot
cid, ctrim = nid(), nid()
vxml = ''.join('<CubicMirroredVertex x="%s" y="%s" rotation="%s" distance="%s"/>' % (f(v[0]), f(v[1]), f(v[3]), f(v[4])) for v in verts)
contour_xml = ('<Shape x="0" y="0" name="Contour" id="%s"><PointsPath isClosed="true" name="Path">%s</PointsPath>'
               '<Stroke thickness="3" cap="round" join="round" name="Stroke"><SolidColor colorValue="%s" name="C"/>'
               '<TrimPath start="0" end="0" offset="%s" name="Trim" id="%s"/></Stroke></Shape>'
               % (cid, vxml, INK, f(records[ORIGIN]['s']), ctrim))
key(ctrim, 'end', [(0, 0, None), (T_CLOSE[0], 0, EASE), (T_CLOSE[1], 1, None), (DUR - 1, 1, None), (DUR, 0, None)])
key(ctrim, 'start', [(0, 0, None), (T_UNRAVEL[0], 0, EASE), (T_UNRAVEL[1], 1, None), (DUR - 1, 1, None), (DUR, 0, None)])

# a second, thinner pass slightly off register
cid2, ctrim2 = nid(), nid()
contour2_xml = ('<Shape x="5" y="4" name="Contour echo" id="%s"><PointsPath isClosed="true" name="Path">%s</PointsPath>'
                '<Stroke thickness="1" cap="round" name="Stroke"><SolidColor colorValue="59%s" name="C"/>'
                '<TrimPath start="0" end="0" offset="%s" name="Trim" id="%s"/></Stroke></Shape>'
                % (cid2, vxml, INK[2:], f(records[ORIGIN]['s']), ctrim2))
key(ctrim2, 'end', [(0, 0, None), (T_CLOSE[0] + 12, 0, EASE), (T_CLOSE[1] + 10, 1, None), (DUR - 1, 1, None), (DUR, 0, None)])
key(ctrim2, 'start', [(0, 0, None), (T_UNRAVEL[0] - 6, 0, EASE), (T_UNRAVEL[1] - 6, 1, None), (DUR - 1, 1, None), (DUR, 0, None)])

# the sage wash inside the closed form: three stacked plain fills, each a little
# smaller, give a soft edge. (A feathered Fill drew nothing in the CLI renderer,
# even in a minimal test, so the wash does not rely on Feather.)
rel = ''.join('<CubicMirroredVertex x="%s" y="%s" rotation="%s" distance="%s"/>'
              % (f(v[0] - CX), f(v[1] - CY), f(v[3]), f(v[4])) for v in verts)
wid = nid()
layers = ''
# smaller layers sit toward the lower right, so the colour pools on one side
for k, (sc, al, ox, oy) in enumerate([(0.97, '12', 0, 0), (0.82, '14', 22, 20), (0.62, '18', 46, 38), (0.42, '1C', 66, 52)]):
    layers += ('<Shape x="%s" y="%s" scaleX="%s" scaleY="%s" name="Wash %d"><PointsPath isClosed="true" name="Path">%s</PointsPath>'
               '<Fill name="Fill"><SolidColor colorValue="%s%s" name="C"/></Fill></Shape>' % (f(ox), f(oy), f(sc), f(sc), k, rel, al, SAGE[2:]))
wash_xml = '<Node x="%s" y="%s" opacity="0" name="Wash" id="%s">%s</Node>' % (f(CX + 10), f(CY + 12), wid, layers)
key(wid, 'opacity', [(0, 0, None), (T_WASH[0], 0, EASE), (T_WASH[1], 1, None), (T_UNRAVEL[0] + 10, 1, EASE), (T_UNRAVEL[0] + 60, 0, None)])

# ---------- assemble ----------
# vertices of the main contour get ids for the breathing keys
vxml_keyed = ''
breath = {2: (9, -6), 6: (-8, 7)}
for i, v in enumerate(verts):
    if i in breath:
        vid = nid()
        vxml_keyed += '<CubicMirroredVertex x="%s" y="%s" rotation="%s" distance="%s" id="%s"/>' % (f(v[0]), f(v[1]), f(v[3]), f(v[4]), vid)
        bx, by = breath[i]
        key(vid, 'x', [(0, v[0], None), (T_CLOSE[1], v[0], EASE), (T_CLOSE[1] + 40, v[0] + bx, EASE), (T_UNRAVEL[0] + 40, v[0], None)])
        key(vid, 'y', [(0, v[1], None), (T_CLOSE[1], v[1], EASE), (T_CLOSE[1] + 40, v[1] + by, EASE), (T_UNRAVEL[0] + 40, v[1], None)])
    else:
        vxml_keyed += '<CubicMirroredVertex x="%s" y="%s" rotation="%s" distance="%s"/>' % (f(v[0]), f(v[1]), f(v[3]), f(v[4]))
contour_xml = contour_xml.replace(vxml, vxml_keyed)

anim_xml = ''
by_obj = {}
for obj, prop, frames in anim:
    by_obj.setdefault(obj, []).append((prop, frames))
for obj, props in by_obj.items():
    anim_xml += '<KeyedObject objectId="%s">' % obj
    for prop, frames in props:
        anim_xml += '<KeyedProperty property="%s">%s</KeyedProperty>' % (prop, keys(frames))
    anim_xml += '</KeyedObject>\n'

# first declared paints on top: records, contour, echo, threads, wash
body = '\n'.join(shapes_xml + [contour_xml, contour2_xml] + threads_xml + [wash_xml])
rml = '''<Rive version="1" kind="fragment">
<Artboard defaultStateMachineId="0:7" styleId="0:5" width="%d" height="%d" name="Records" id="0:2">
<LayoutComponentStyle name="Artboard Style" id="0:5"/>
<Fill name="Background"><SolidColor colorValue="%s" name="Paper"/></Fill>
%s
<StateMachine name="State Machine 1" id="0:7">
<StateMachineLayer name="Layer 1" id="0:8">
<AnyState x="200" y="-120"/><ExitState x="400" y="-120"/>
<EntryState><StateTransition stateToId="0:12"/></EntryState>
<AnimationState x="200" animationId="0:6" id="0:12"/>
</StateMachineLayer>
</StateMachine>
<LinearAnimation loopValue="loop" fps="%d" duration="%d" name="Loop" id="0:6">
%s</LinearAnimation>
</Artboard>
</Rive>
''' % (W, H, PAPER, body, FPS, DUR, anim_xml)
open('scene.rml', 'w').write(rml)
print('records', NR, 'threads', len(edges), 'loose', loose, 'keyed objects', len(by_obj))
