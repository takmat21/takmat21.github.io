"""Writes scene.rml for the Rive piece of dots.

An even field of small dots on paper. A vermilion dot pulses and two ripples
cross the field; then the dots swell and shrink into a halftone form, part of
it turning sage; the form holds, then dissolves left to right back to the
even field. 12 s loop at 60 fps on a 1500 x 500 artboard. Pure RML: no scripts.

Run: python3 generate.py  (then: rive . --verify / rive inspect . --summary)
"""
import math

W, H = 1500, 500
FPS, DUR = 60, 720
PAPER, INK, VERM, SAGE = 'FFF2ECE0', 'FF2A2622', 'FFB2543C', 'FF8A9A80'
DOT_INK = 'D92A2622'   # ink at ~85 %

COLS, ROWS = 44, 17
GAP = 33.5
RGAP = GAP * 0.87     # rows offset by half a step, like a printing screen
X0 = (W - (COLS - 0.5) * GAP) / 2 + GAP * 0.25
Y0 = (H - (ROWS - 1) * RGAP) / 2
BASE = 4.2            # dot diameter at rest

ORIGIN = (8, 7)       # grid cell of the vermilion dot
FORM_C = (770, 248)   # centre of the halftone form

EASE = '<CubicEaseInterpolator x1="0.42" y1="0" x2="0.58" y2="1"/>'
EASE_OUT = '<CubicEaseInterpolator x1="0.15" y1="0" x2="0.35" y2="1"/>'
_id = [100]


def nid():
    _id[0] += 1
    return '0:%d' % _id[0]


def f(v):
    return ('%.2f' % v).rstrip('0').rstrip('.')


def kd(frames):
    out = []
    for fr, val, ease in frames:
        if ease:
            out.append('<KeyFrameDouble value="%s" frame="%d" interpolationType="cubic">%s</KeyFrameDouble>' % (f(val), fr, ease))
        else:
            out.append('<KeyFrameDouble value="%s" frame="%d" interpolationType="linear"/>' % (f(val), fr))
    return ''.join(out)


def kc(frames):
    return ''.join('<KeyFrameColor value="%s" frame="%d" interpolationType="linear"/>' % (v, fr) for fr, v in frames)


def mass(x, y, cx, cy, rx, ry, p):
    """0..1 inside an uneven rounded mass, with a soft rim."""
    dx, dy = (x - cx) / rx, (y - cy) / ry
    a = math.atan2(dy, dx)
    edge = 1 + 0.12 * math.cos(2 * a + p) + 0.07 * math.sin(3 * a - p)
    return max(0.0, min(1.0, (edge - math.hypot(dx, dy)) / 0.3))


def fields(x, y):
    """Ink weight and sage weight: an ink crescent, with the bitten-out part in sage."""
    a = mass(x, y, FORM_C[0], FORM_C[1], 300, 185, 0.7)
    b = mass(x, y, FORM_C[0] + 105, FORM_C[1] - 40, 225, 140, -0.5)
    light = 0.5 + 0.5 * max(0.0, min(1.0, 0.55 - (x - FORM_C[0]) / 520.0 + (y - FORM_C[1]) / 420.0))
    ink = a * (1 - b) * light
    sage = b * (0.35 + 0.65 * a) * 0.75
    return ink, sage


def mix(c1, c2, t):
    a = [int(c1[i:i + 2], 16) for i in (0, 2, 4, 6)]
    b = [int(c2[i:i + 2], 16) for i in (0, 2, 4, 6)]
    return ''.join('%02X' % round(a[k] + (b[k] - a[k]) * t) for k in range(4))


shapes, anim = [], []
ox, oy = X0 + ORIGIN[0] * GAP + (GAP / 2 if ORIGIN[1] % 2 else 0), Y0 + ORIGIN[1] * RGAP
for j in range(ROWS):
    for i in range(COLS):
        x, y = X0 + i * GAP + (GAP / 2 if j % 2 else 0), Y0 + j * RGAP
        is_origin = (i, j) == ORIGIN
        sid, eid, cid = nid(), nid(), nid()
        d0 = BASE * (1.6 if is_origin else 1.0)
        color = VERM if is_origin else DOT_INK
        shapes.append('<Shape x="%s" y="%s" name="Dot %d,%d" id="%s"><Ellipse width="%s" height="%s" originX="0.5" originY="0.5" name="P" id="%s"/>'
                      '<Fill name="F"><SolidColor colorValue="%s" name="C" id="%s"/></Fill></Shape>'
                      % (f(x), f(y), i, j, sid, f(d0), f(d0), eid, color, cid))
        # --- ripples from the vermilion dot ---
        r = math.hypot(x - ox, y - oy)
        amp = 1 + 1.7 * math.exp(-r / 600.0)
        h1 = 120 + int(r * 0.11)
        h2 = h1 + 62
        keys = [(0, d0, None)]
        if is_origin:
            keys += [(80, d0, EASE), (104, d0 * 2.2, EASE), (130, d0, None)]
            rip_end = 130
        else:
            keys += [(h1 - 22, d0, None), (h1, d0 * amp, None), (h1 + 30, d0, None),
                     (h2 - 22, d0, None), (h2, d0 * (1 + (amp - 1) * 0.55), None), (h2 + 30, d0, None)]
            rip_end = h2 + 30
        # --- the halftone form ---
        wi, ws = fields(x, y)
        fv = max(wi, ws)
        target = d0 * (0.5 + 3.9 * fv) if not is_origin else d0 * 1.2
        dc = math.hypot((x - FORM_C[0]) / 1.7, y - FORM_C[1])
        t_form = max(380 + int(dc * 0.16), rip_end + 6)
        t_formed = t_form + 70
        t_dis = 580 + int(x / W * 70)
        t_gone = t_dis + 50
        keys += [(t_form, d0, EASE), (t_formed, target, None), (t_dis, target, EASE), (t_gone, d0, None), (DUR, d0, None)]
        frames = sorted(keys, key=lambda k: k[0])
        for prop in ('width', 'height'):
            anim.append((eid, prop, kd(frames)))
        if not is_origin and ws > 0.06:
            tint = mix(DOT_INK, 'EE' + SAGE[2:], min(1.0, ws / (wi + ws) * 1.15))
            anim.append((cid, 'colorValue', kc([(0, DOT_INK), (t_form + 15, DOT_INK), (t_formed + 10, tint),
                                                (t_dis, tint), (t_gone, DOT_INK), (DUR, DOT_INK)])))

by_obj = {}
for obj, prop, xml in anim:
    by_obj.setdefault(obj, []).append((prop, xml))
anim_xml = ''.join('<KeyedObject objectId="%s">%s</KeyedObject>\n' % (o, ''.join('<KeyedProperty property="%s">%s</KeyedProperty>' % (p, x) for p, x in ps))
                   for o, ps in by_obj.items())

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
''' % (W, H, PAPER, '\n'.join(shapes), FPS, DUR, anim_xml)
open('scene.rml', 'w').write(rml)
print('dots', COLS * ROWS, 'keyed objects', len(by_obj), 'rml bytes', len(rml))
