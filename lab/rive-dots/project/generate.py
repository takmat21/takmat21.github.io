"""Writes scene.rml for the Rive piece of dots.

An even field of small dots on paper (rows offset by half a step, like a
printing screen). A vermilion dot pulses and two ripples cross the field. Then
about 300 dots leave the grid and gather into a sunflower-seed arrangement
(phyllotaxis: each dot turned by the golden angle), with the vermilion dot at
its centre and some spiral arms in sage, while the rest of the field fades to a
faint ground. A pulse runs outward through the arrangement, then every dot
returns to its place in the grid. 12 s loop at 60 fps on a 1500 x 500 artboard.
Pure RML: no scripts.

Run: python3 generate.py  (then: rive . --verify / rive inspect . --summary)
"""
import math

W, H = 1500, 500
FPS, DUR = 60, 720
PAPER, INK, VERM, SAGE = 'FFF2ECE0', 'FF2A2622', 'FFB2543C', 'FF8A9A80'
DOT_INK = 'D92A2622'     # ink at ~85 %
FAINT_INK = '592A2622'   # the ground while the form holds
SAGE_DOT = 'F28A9A80'

COLS, ROWS = 44, 17
GAP = 33.5
RGAP = GAP * 0.87
X0 = (W - (COLS - 0.5) * GAP) / 2 + GAP * 0.25
Y0 = (H - (ROWS - 1) * RGAP) / 2
BASE = 4.2

ORIGIN = (8, 7)
CX, CY = 750.0, 250.0
NSEED = 300
RMAX = 212.0
GOLDEN = math.radians(137.50776)

# timeline (frames)
PULSE = (80, 130)          # the vermilion dot pulses
GATHER = (300, 450)        # dots travel into the arrangement (staggered inside this window)
WAVE = (470, 560)          # a pulse runs outward through the arrangement
RETURN = (575, 700)        # everything goes back to the grid

EASE = '<CubicEaseInterpolator x1="0.42" y1="0" x2="0.58" y2="1"/>'
EASE_IO = '<CubicEaseInterpolator x1="0.65" y1="0" x2="0.35" y2="1"/>'
_id = [100]


def nid():
    _id[0] += 1
    return '0:%d' % _id[0]


def f(v):
    return ('%.2f' % v).rstrip('0').rstrip('.')


def kd(frames):
    out = []
    for fr, val, ease in sorted(frames, key=lambda k: k[0]):
        if ease:
            out.append('<KeyFrameDouble value="%s" frame="%d" interpolationType="cubic">%s</KeyFrameDouble>' % (f(val), fr, ease))
        else:
            out.append('<KeyFrameDouble value="%s" frame="%d" interpolationType="linear"/>' % (f(val), fr))
    return ''.join(out)


def kc(frames):
    return ''.join('<KeyFrameColor value="%s" frame="%d" interpolationType="linear"/>' % (v, fr) for fr, v in frames)


# ---------- grid ----------
cells = []
for j in range(ROWS):
    for i in range(COLS):
        cells.append({'i': i, 'j': j, 'x': X0 + i * GAP + (GAP / 2 if j % 2 else 0), 'y': Y0 + j * RGAP})
origin_idx = next(k for k, c in enumerate(cells) if (c['i'], c['j']) == ORIGIN)
ox, oy = cells[origin_idx]['x'], cells[origin_idx]['y']

# ---------- the arrangement: sunflower seeds ----------
c_sp = RMAX / math.sqrt(NSEED)
slots = []
for n in range(NSEED):
    r = c_sp * math.sqrt(n + 0.5)
    a = n * GOLDEN
    # seeds grow larger toward the rim, as in a seed head
    size = 3.6 + 7.4 * math.sqrt(r / RMAX)
    slots.append({'n': n, 'x': CX + r * math.cos(a), 'y': CY + r * math.sin(a) * 0.98, 'r': r, 'size': size,
                  'sage': (n % 21) in (0, 8, 13)})

# assign: the vermilion dot takes the centre; then each slot, from the centre out,
# takes the nearest free grid dot, so paths stay short and mostly radial
taken = {origin_idx: 0}
slot_owner = {0: origin_idx}
free = set(range(len(cells))) - {origin_idx}
for s in slots[1:]:
    best = min(free, key=lambda k: (cells[k]['x'] - s['x']) ** 2 * 0.55 + (cells[k]['y'] - s['y']) ** 2)
    free.discard(best)
    taken[best] = s['n']
    slot_owner[s['n']] = best

# ---------- dots ----------
shapes, anim = [], []
for k, c in enumerate(cells):
    x, y = c['x'], c['y']
    is_origin = k == origin_idx
    sid, eid, cid = nid(), nid(), nid()
    d0 = BASE * (1.6 if is_origin else 1.0)
    color = VERM if is_origin else DOT_INK
    shapes.append('<Shape x="%s" y="%s" name="Dot %d,%d" id="%s"><Ellipse width="%s" height="%s" originX="0.5" originY="0.5" name="P" id="%s"/>'
                  '<Fill name="F"><SolidColor colorValue="%s" name="C" id="%s"/></Fill></Shape>'
                  % (f(x), f(y), c['i'], c['j'], sid, f(d0), f(d0), eid, color, cid))

    # ripples (all dots)
    r = math.hypot(x - ox, y - oy)
    amp = 1 + 1.7 * math.exp(-r / 600.0)
    h1 = 120 + int(r * 0.11)
    h2 = h1 + 62
    size = [(0, d0, None)]
    if is_origin:
        size += [(PULSE[0], d0, EASE), (PULSE[0] + 24, d0 * 2.2, EASE), (PULSE[1], d0, None)]
        rip_end = PULSE[1]
    else:
        size += [(h1 - 22, d0, None), (h1, d0 * amp, None), (h1 + 30, d0, None),
                 (h2 - 22, d0, None), (h2, d0 * (1 + (amp - 1) * 0.55), None), (h2 + 30, d0, None)]
        rip_end = h2 + 30

    if k in taken:
        s = slots[taken[k]]
        # inner seeds arrive first; each dot travels for 95 frames
        g0 = max(GATHER[0] + int((s['r'] / RMAX) * (GATHER[1] - GATHER[0] - 95)), rip_end + 4)
        g1 = g0 + 95
        # outward pulse through the arrangement during the hold
        w0 = WAVE[0] + int((s['r'] / RMAX) * (WAVE[1] - WAVE[0] - 34))
        sz = s['size'] * (2.6 if is_origin else 1.0)
        b0 = RETURN[0] + int((1 - s['r'] / RMAX) * 30)
        b1 = min(b0 + 95, DUR - 6)
        size += [(g0, d0, EASE), (g1, sz, None), (w0, sz, EASE), (w0 + 17, sz * 1.45, EASE), (w0 + 34, sz, None),
                 (b0, sz, EASE), (b1, d0, None), (DUR, d0, None)]
        # a gentle curve on the way in: x and y ease with slightly different curves
        anim.append((sid, 'x', kd([(0, x, None), (g0, x, EASE_IO), (g1, s['x'], None), (b0, s['x'], EASE_IO), (b1, x, None), (DUR, x, None)])))
        anim.append((sid, 'y', kd([(0, y, None), (g0, y, EASE), (g1, s['y'], None), (b0, s['y'], EASE), (b1, y, None), (DUR, y, None)])))
        if s['sage'] and not is_origin:
            anim.append((cid, 'colorValue', kc([(0, DOT_INK), (g0 + 40, DOT_INK), (g1 + 10, SAGE_DOT), (b0, SAGE_DOT), (b0 + 50, DOT_INK), (DUR, DOT_INK)])))
    else:
        # the rest of the field steps back to a faint ground while the form holds
        q0 = max(GATHER[0] + 30 + int(abs(x - CX) / W * 60), rip_end + 4)
        q1 = RETURN[0] + 40 + int(abs(x - CX) / W * 40)
        size += [(q0, d0, EASE), (q0 + 60, d0 * 0.6, None), (q1, d0 * 0.6, EASE), (q1 + 60, d0, None), (DUR, d0, None)]
        anim.append((cid, 'colorValue', kc([(0, DOT_INK), (q0, DOT_INK), (q0 + 60, FAINT_INK), (q1, FAINT_INK), (q1 + 60, DOT_INK), (DUR, DOT_INK)])))
    for prop in ('width', 'height'):
        anim.append((eid, prop, kd(size)))

by_obj = {}
for obj, prop, xml in anim:
    by_obj.setdefault(obj, []).append((prop, xml))
anim_xml = ''.join('<KeyedObject objectId="%s">%s</KeyedObject>\n' % (o, ''.join('<KeyedProperty property="%s">%s</KeyedProperty>' % (p, x) for p, x in ps))
                   for o, ps in by_obj.items())

# moving dots are declared first so they paint above the faint ground
order = sorted(range(len(shapes)), key=lambda k: 0 if k in taken else 1)
rml = '''<Rive version="1" kind="fragment">
<Artboard defaultStateMachineId="0:7" styleId="0:5" width="%d" height="%d" name="Dots" id="0:2">
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
''' % (W, H, PAPER, '\n'.join(shapes[k] for k in order), FPS, DUR, anim_xml)
open('scene.rml', 'w').write(rml)
print('dots', len(cells), 'seeds', NSEED, 'keyed objects', len(by_obj), 'rml bytes', len(rml))
