# The countryside kit for the open world (ZW-051, phase 3): what a Greek valley has outside the town.
# Each model follows its approved reference picture in concepts/countryside/. Greek throughout: dry stone and
# cream plaster, terracotta tile, azure paint, bronze, marble, the gold bolt; shutters, never glass.
#   python blender/country.py <item> <out.glb>
# Front faces -Y, real size, the ground at z = 0 (piles and piers go below it; normalize lifts the model so that
# its lowest point is the origin, and the world sets it back down by the depth noted on each builder).
import sys, math, random
import bpy, bmesh, zw
import parts as P
from mathutils import Matrix, Vector

ITEM, OUT = sys.argv[-2], sys.argv[-1]
zw.reset(); rnd = random.Random(11)
T, M = zw.tex_photo, zw.material
_x = {}
def mat(n):
    if n in _x: return _x[n]
    make = {
        'thatch': lambda: M('thatch', *T('thatch_roof_angled', 'thatch', 512, tint=(0.62, 0.52, 0.34), mix=0.7, gain=0.95, contrast=1.3), rough=1.0),
        'hay': lambda: M('hay', *T('thatch_roof_angled', 'hay', 512, tint=(0.80, 0.60, 0.22), mix=0.8, gain=0.92, contrast=2.0, nstrength=2.0), rough=1.0),
        'drystone': lambda: M('drystone', *T('stacked_stone_wall', 'drystone', 1024, tint=(0.80, 0.74, 0.63), mix=0.6, gain=1.0, contrast=1.15, nstrength=1.6), rough=0.95),
        'rock': lambda: M('rock', *zw.tex_mottled('rock', (0.62, 0.58, 0.52), seed=31, amount=0.4, grain=0.3, bump=0.9), rough=0.95),
        'plank': lambda: M('plank', *T('weathered_planks', 'plank', 512, tint=(0.50, 0.38, 0.26), mix=0.6, gain=0.95, contrast=1.1), rough=0.85),
        'wicker': lambda: M('wicker', *zw.tex_mottled('wicker', (0.66, 0.50, 0.30), seed=33, amount=0.35, grain=0.45, bump=0.9), rough=0.95),
        'sack': lambda: M('sack', *zw.tex_mottled('sack', (0.74, 0.64, 0.46), seed=34, amount=0.25, grain=0.4), rough=1.0),
        'grain': lambda: M('grain', *zw.tex_mottled('grain', (0.86, 0.66, 0.30), seed=35, amount=0.2, grain=0.5), rough=1.0),
        'net': lambda: M('net', *zw.tex_mottled('net', (0.42, 0.40, 0.33), seed=36, amount=0.3, grain=0.6, bump=0.9), rough=1.0),
        'white': lambda: M('white', (0.93, 0.92, 0.88), rough=0.6),
    }
    _x[n] = make[n]() if n in make else P.mat(n); return _x[n]


# ---------------------------------------------------------------- shared pieces
def stone(c, r, seed=0, m='rock', flat=0.7):
    o = zw.blob('rock', (r * rnd.uniform(0.8, 1.2), r * rnd.uniform(0.8, 1.2), r * flat), c, mat(m), 8, 5)
    zw.wobble(o, r * 0.16, 2.2 / max(r, 0.05), seed); zw.box_uv(o, 0.8); return o

def stone_ring(R, n, r, z=0.0, c=(0, 0), seed=0):
    for i in range(n):
        a = 2 * math.pi * (i + rnd.uniform(-0.2, 0.2)) / n
        stone((c[0] + R * math.cos(a), c[1] + R * math.sin(a), z + r * 0.45), r * rnd.uniform(0.8, 1.15), seed + i)

def lash(p, r, axis='Z', turns=3, t=0.018):
    for i in range(turns):
        q = list(p); q['XYZ'.index(axis)] += (i - (turns - 1) / 2) * t * 1.9
        zw.torus('lash', r + t * 0.6, t, tuple(q), mat('rope'), axis=axis, seg=10, tube=5)

def basket(c, s=1.0, fill=None):
    x, y, z = c
    zw.lathe('basket', [(0, 0), (0.16 * s, 0), (0.24 * s, 0.14 * s), (0.25 * s, 0.30 * s), (0.22 * s, 0.34 * s), (0.20 * s, 0.33 * s), (0, 0.28 * s)], mat('wicker'), centre=c, segs=12, uv=0.3)
    zw.torus('rim', 0.235 * s, 0.022 * s, (x, y, z + 0.335 * s), mat('wicker'), axis='Z', seg=12, tube=5)
    if fill: zw.blob('fill', (0.2 * s, 0.2 * s, 0.07 * s), (x, y, z + 0.31 * s), mat(fill), 10, 4)

def sack(c, s=1.0, seed=0):
    o = zw.blob('sack', (0.26 * s, 0.2 * s, 0.34 * s), (c[0], c[1], c[2] + 0.3 * s), mat('sack'), 9, 6); zw.wobble(o, 0.03 * s, 4.0, seed)
    zw.blob('neck', (0.07 * s, 0.07 * s, 0.07 * s), (c[0], c[1], c[2] + 0.66 * s), mat('sack'), 6, 4); lash((c[0], c[1], c[2] + 0.6 * s), 0.05 * s, turns=2, t=0.012)

def skirt(name, r0, r1, z0, z1, m, c=(0, 0), segs=20, seed=0, shag=0.05, uv=0.9):
    """One layer of thatch or hay: a cone band whose lower edge hangs ragged."""
    o = zw.lathe(name, [(r0 * 0.98, z0 - 0.02), (r0, z0), (r1, z1), (r1 * 0.9, z1 + 0.01)], mat(m), centre=(c[0], c[1], 0), segs=segs, uv=uv)
    zw.refine(o, 0.3); zw.wobble(o, shag, 3.5, seed); zw.box_uv(o, uv); return o

def ladder(p0, p1, w=0.5, rungs=7, r=0.03):
    p0, p1 = Vector(p0), Vector(p1); d = (p1 - p0); side = Vector((0, 0, 1)).cross(d).normalized() * (w / 2)
    if side.length < 1e-3: side = Vector((w / 2, 0, 0))
    for s in (-1, 1): zw.rod('rail', p0 + side * s, p1 + side * s, r * 1.2, mat('wood'), segs=7, uv=0.5)
    for i in range(rungs): q = p0 + d * ((i + 0.7) / (rungs + 0.4)); zw.rod('rung', q - side, q + side, r * 0.8, mat('wood_dark'), segs=6, uv=0.5)

def coil(c, R=0.22, n=3):
    for i in range(n): zw.torus('coil', R - i * 0.035, 0.024, (c[0], c[1], c[2] + 0.024 + i * 0.03), mat('rope'), axis='Z', seg=14, tube=5)

def fork(p0, p1, tines=3):
    p0, p1 = Vector(p0), Vector(p1); d = (p1 - p0).normalized(); side = d.cross(Vector((0, 1, 0))).normalized()
    zw.rod('shaft', p0, p1, 0.022, mat('wood'), segs=6, uv=0.4)
    for i in range(tines): o = side * ((i - (tines - 1) / 2) * 0.09); zw.rod('tine', p1 + o * 0.4, p1 + o + d * 0.36, 0.013, mat('wood'), segs=5, uv=0.4)


# ---------------------------------------------------------------- 1. the shepherd's hut (4 m across)
def hut():
    w = zw.lathe('wall', [(2.06, 0), (2.04, 0.35), (1.97, 1.5), (1.9, 2.05), (1.6, 2.05)], mat('drystone'), segs=28, uv=1.6)
    zw.refine(w, 0.35); zw.wobble(w, 0.035, 2.4, 3); zw.box_uv(w, 1.6)
    for i in range(26):                                      # stones standing proud of the wall, and a rough footing
        a = rnd.uniform(0.35, 2 * math.pi - 0.35) - math.pi / 2; z = rnd.uniform(0.2, 1.8); r = 2.03 - 0.07 * z
        stone((r * math.cos(a), r * math.sin(a), z), rnd.uniform(0.1, 0.17), i, 'drystone', 0.6)
    stone_ring(2.12, 22, 0.2, seed=40)
    # the doorway: stone jambs and a heavy lintel, a plank door on bronze hinges
    for s in (-1, 1): zw.box('jamb', (0.26, 0.42, 1.6), (s * 0.56, -1.98, 0.8), mat('drystone'), bevel=0.04, uv=1.0)
    zw.box('lintel', (1.6, 0.46, 0.26), (0, -1.98, 1.72), mat('drystone'), bevel=0.05, uv=1.0)
    zw.box('recess', (0.9, 0.05, 1.6), (0, -1.9, 0.8), mat('dark'))
    for i in range(4): zw.box('leaf', (0.21, 0.06, 1.56), (-0.33 + i * 0.22, -2.0, 0.8), mat('plank'), bevel=0.008, uv=0.8)
    for z in (0.4, 1.25): zw.box('strap', (0.84, 0.02, 0.07), (0, -2.04, z), mat('bronze'), bevel=0.005)
    zw.torus('ring', 0.06, 0.012, (0.28, -2.05, 0.85), mat('bronze'), axis='Y', seg=10, tube=4)
    zw.box('threshold', (1.5, 0.7, 0.1), (0, -2.25, 0.05), mat('drystone'), bevel=0.03, uv=1.0)
    # the thatch: four ragged layers up to a smoke hole, bound with rope
    lay = [(2.5, 1.9, 2.05, 2.45), (2.1, 1.45, 2.4, 2.95), (1.55, 0.9, 2.9, 3.45), (1.0, 0.36, 3.4, 3.9)]
    for i, (r0, r1, z0, z1) in enumerate(lay): skirt('thatch', r0, r1, z0, z1, 'thatch', seed=i, shag=0.07)
    zw.torus('smoke', 0.34, 0.06, (0, 0, 3.92), mat('thatch'), axis='Z', seg=14, tube=6)
    zw.cylinder('hole', 0.3, 0.3, 0.05, (0, 0, 3.93), mat('dark'), segs=12)
    for r, z in ((2.2, 2.2), (1.5, 2.86), (0.86, 3.44)): zw.torus('bind', r, 0.022, (0, 0, z + 0.05), mat('rope'), axis='Z', seg=28, tube=5)
    # outside: a stone seat with a folded blanket, a water jar, the crook by the door
    zw.box('seat', (1.0, 0.4, 0.14), (1.45, -2.05, 0.4), mat('drystone'), bevel=0.04, uv=1.0)
    for s in (-1, 1): stone((1.45 + s * 0.36, -2.05, 0.17), 0.2, 60 + s, 'drystone', 0.9)
    zw.box('blanket', (0.5, 0.34, 0.1), (1.35, -2.05, 0.52), mat('cloth_cream'), bevel=0.03, uv=0.5)
    P.pot(2.05, -1.55, 0, 1.25)
    zw.rod('crook', (0.86, -2.2, 0), (0.8, -2.08, 1.75), 0.022, mat('wood'), segs=6, uv=0.4)
    zw.torus('hook', 0.08, 0.02, (0.72, -2.08, 1.75), mat('wood'), axis='Y', seg=10, tube=5)


# ---------------------------------------------------------------- 2. the barn (9 x 5.5 m)
def barn():
    W, D, H = 9.0, 5.5, 3.1
    f = P.block('barn', W, D, H, m='plaster', plinth=None, cap='marble')
    b = zw.box('base', (W + 0.24, D + 0.24, 1.0), (0, 0, 0.5), mat('drystone'), bevel=0.04, uv=1.6); zw.refine(b, 0.5); zw.wobble(b, 0.02, 2.0, 5); zw.box_uv(b, 1.6)
    P.gable_roof(W + 0.7, D + 0.9, H, pitch=24, axis='X', k=1.15, tymp='plaster', bolt=True)
    F = f['F']
    P.door(F, -1.2, 0.0, w=2.3, h=2.5, wood='azure_wood', trim='marble', double=True)
    for u in (2.0, 3.5): P.window(F, u, 1.35, w=0.7, h=0.9, wood='wood_dark')
    P.window(f['B'], 0, 1.4, w=0.7, h=0.9, wood='wood_dark'); P.window(f['L'], 0, 1.4, w=0.7, h=0.9, wood='wood_dark')
    zw.box('apron', (W + 1.4, 2.0, 0.1), (0, -D / 2 - 0.9, 0.05), mat('paving'), bevel=0.02, uv=1.6)
    ladder((3.9, -D / 2 - 1.1, 0.1), (4.1, -D / 2 - 0.25, 3.3), w=0.55, rungs=9)
    for i, (x, y) in enumerate(((0.6, -3.3), (1.05, -3.45), (0.85, -3.75))): sack((x, y, 0.1), 0.9, i)
    hy = zw.blob('hay', (0.9, 0.6, 0.55), (-3.6, -3.35, 0.45), mat('hay'), 10, 6); zw.wobble(hy, 0.09, 3.0, 2); zw.box_uv(hy, 0.8)
    fork((-3.0, -3.0, 0.1), (-3.05, -2.86, 1.7))


# ---------------------------------------------------------------- 3. the watermill (wheel on the right, +X; the stream runs past it front to back)
def mill():
    W, D = 4.6, 5.0
    P.block('lower', W, D, 2.6, m='stone', plinth='stone_dark', cap='marble', uv=2.0)
    f = P.block('upper', W - 0.2, D - 0.2, 2.4, z=2.6, m='plaster', plinth=None, cap='marble')
    P.gable_roof(D + 0.9, W + 0.8, 5.0, pitch=26, axis='Y', k=1.1, tymp='plaster', bolt=True)
    lo = P.faces(0, 0, W, D)
    P.door(lo['F'], -0.6, 0.0, w=1.1, h=2.1, wood='azure_wood', double=False)
    P.window(lo['F'], 1.2, 1.2, w=0.6, h=0.8, wood='wood_dark')
    P.window(f['F'], 0, 3.3, w=0.8, h=1.0, wood='azure_wood'); P.window(f['L'], 0, 3.3, w=0.8, h=1.0, wood='azure_wood')
    zw.box('step', (1.9, 0.9, 0.16), (-0.6, -D / 2 - 0.45, 0.08), mat('paving'), bevel=0.03, uv=1.2)
    # the wheel: 3.8 m across, on an oak axle through the wall, in a timber frame, fed by a trough from behind
    R, X, Z = 1.9, W / 2 + 0.95, 1.95
    zw.cylinder('axle', 0.16, 0.16, 2.6, (W / 2 + 0.7, 0, Z), mat('wood_dark'), axis='X', segs=10, uv=0.6)
    for s in (-1, 1):
        x = X + s * 0.36
        for r in (R, R - 0.34): zw.torus('felloe', r, 0.11, (x, 0, Z), mat('wood'), axis='X', seg=28, tube=6)
        for i in range(8): a = i * math.pi / 4; zw.beam('spoke', (x, 0, Z), (x, (R - 0.05) * math.cos(a), Z + (R - 0.05) * math.sin(a)), 0.1, 0.07, mat('wood_dark'), uv=0.6)
        zw.cylinder('hub', 0.3, 0.3, 0.16, (x, 0, Z), mat('bronze'), axis='X', segs=12)
    for i in range(20):
        a = i * math.pi / 10; c, s_ = math.cos(a), math.sin(a)
        o = zw.box('paddle', (0.86, 0.05, 0.42), (0, 0, 0), mat('plank'), bevel=0.006, uv=0.7)
        o.data.transform(Matrix.Translation((X, (R - 0.12) * c, Z + (R - 0.12) * s_)) @ Matrix.Rotation(a + math.pi / 2, 4, 'X'))
    for y in (-2.25, 2.25):
        P.post(X + 0.75, y, 0, 3.3, 0.2, 'wood_dark')
        zw.beam('brace', (X + 0.75, y, 0.3), (X + 0.75, y * 0.35, 1.9), 0.12, 0.12, mat('wood_dark'), uv=0.6)
    zw.beam('plate', (X + 0.75, -2.4, Z), (X + 0.75, 2.4, Z), 0.2, 0.22, mat('wood_dark'), bevel=0.01, uv=0.6)
    zw.beam('top', (X + 0.75, -2.4, 3.3), (X + 0.75, 2.4, 3.3), 0.18, 0.18, mat('wood_dark'), bevel=0.01, uv=0.6)
    zw.box('trough', (0.7, 3.2, 0.08), (X, 2.6, 4.02), mat('plank'), uv=0.7)
    for s in (-1, 1): zw.box('trough', (0.07, 3.2, 0.3), (X + s * 0.36, 2.6, 4.15), mat('plank'), uv=0.7)
    for y in (2.4, 4.0):
        for s in (-1, 1): P.post(X + s * 0.42, y, 0, 4.0, 0.14, 'wood_dark')
    zw.box('water', (0.56, 3.1, 0.05), (X, 2.6, 4.1), mat('water'))
    # worn millstones against the front wall, and sacks of flour
    for i, (x, tilt) in enumerate(((1.75, 0.32), (2.3, 0.2))):
        o = zw.cylinder('millstone', 0.55, 0.55, 0.2, (0, 0, 0), mat('rock'), axis='Y', segs=20, uv=0.8, bevel=0.03)
        h = zw.cylinder('eye', 0.11, 0.11, 0.22, (0, 0, 0), mat('dark'), axis='Y', segs=10)
        for q in (o, h): q.data.transform(Matrix.Translation((x, -D / 2 - 0.3 - i * 0.22, 0.56)) @ Matrix.Rotation(-tilt, 4, 'X'))
    for i, (x, y) in enumerate(((-1.9, -2.95), (-1.55, -3.2))): sack((x, y, 0), 0.85, i + 5)


# ---------------------------------------------------------------- 4. the timber bridge (28 x 4 m; deck ends 0.9 m up on stone ramps; piers go 4 m below the ground)
BRIDGE_L, BRIDGE_W = 28.0, 4.0
def deck_z(x): return 0.9 + 1.2 * (1 - (x / (BRIDGE_L / 2)) ** 2)
def bridge():
    L, W = BRIDGE_L, BRIDGE_W; n = 62
    for i in range(n):                                       # the planks follow the arch
        x = -L / 2 + (i + 0.5) * L / n; z = deck_z(x); sl = math.atan(-2.4 * x / (L / 2) ** 2)
        o = zw.box('deck', (L / n - 0.025, W + rnd.uniform(-0.06, 0.06), 0.09), (0, 0, 0), mat('plank'), bevel=0.008, uv=1.1)
        o.data.transform(Matrix.Translation((x, rnd.uniform(-0.03, 0.03), z)) @ Matrix.Rotation(-sl, 4, 'Y'))
    seg = 14
    for s in (-1, 1):                                        # two heavy stringers under the deck and the rails above it
        for i in range(seg):
            x0, x1 = -L / 2 + i * L / seg, -L / 2 + (i + 1) * L / seg
            zw.beam('stringer', (x0, s * 1.5, deck_z(x0) - 0.24), (x1, s * 1.5, deck_z(x1) - 0.24), 0.3, 0.34, mat('wood_dark'), uv=0.8)
            for h, r in ((1.0, 0.06), (0.55, 0.045)): zw.rod('rail', (x0, s * (W / 2 - 0.12), deck_z(x0) + h), (x1, s * (W / 2 - 0.12), deck_z(x1) + h), r, mat('wood'), segs=7, uv=0.6)
        for i in range(seg + 1):
            x = -L / 2 + i * L / seg; z = deck_z(x)
            P.post(x, s * (W / 2 - 0.12), z, 1.12, 0.13, 'wood_dark'); lash((x, s * (W / 2 - 0.12), z + 1.0), 0.07, turns=2)
            if i < seg and i % 2 == 0: x1 = x + L / seg; zw.rod('cross', (x, s * (W / 2 - 0.12), z + 0.1), (x1, s * (W / 2 - 0.12), deck_z(x1) + 0.95), 0.03, mat('wood'), segs=6, uv=0.6)
    for k in range(5):                                       # trestle piers standing in the river
        x = (k - 2) * L / 6; z = deck_z(x) - 0.4
        for s in (-1, 1):
            zw.rod('pile', (x, s * 1.75, -4.0), (x, s * 1.45, z), 0.19, mat('wood_dark'), segs=9, r2=0.16, uv=0.8)
            lash((x, s * 1.6, z * 0.5 - 1.0), 0.19, turns=3, t=0.022)
        zw.beam('cap', (x, -2.0, z), (x, 2.0, z), 0.3, 0.26, mat('wood_dark'), bevel=0.012, uv=0.8)
        zw.beam('xbrace', (x, -1.68, -1.6), (x, 1.5, z - 0.3), 0.14, 0.1, mat('wood'), uv=0.8); zw.beam('xbrace', (x + 0.11, 1.68, -1.6), (x + 0.11, -1.5, z - 0.3), 0.14, 0.1, mat('wood'), uv=0.8)
    for s in (-1, 1):                                        # stone abutments: a paved ramp between low walls, with a lamp post
        x0 = s * L / 2
        zw.prism('ramp', [(x0 - s * 0.6, -2.0), (x0 + s * 5.0, -2.0), (x0 + s * 5.0, 0.02), (x0 - s * 0.6, 0.86)], W + 0.3, mat('paving'), axis='Y', uv=1.6)
        for y in (-1, 1):
            o = zw.prism('cheek', [(x0 - s * 0.8, -2.0), (x0 + s * 5.2, -2.0), (x0 + s * 5.2, 0.5), (x0 - s * 0.8, 1.5)], 0.45, mat('drystone'), axis='Y', centre=(0, y * (W / 2 + 0.3), 0), bevel=0.03, uv=1.6)
            zw.refine(o, 0.6); zw.wobble(o, 0.02, 2.0, 7); zw.box_uv(o, 1.6)
            zw.box('pier', (0.7, 0.7, 2.3), (x0 - s * 0.6, y * (W / 2 + 0.3), 0.45), mat('drystone'), bevel=0.04, uv=1.4)
            zw.box('piercap', (0.86, 0.86, 0.14), (x0 - s * 0.6, y * (W / 2 + 0.3), 1.67), mat('marble'), bevel=0.02, uv=1.2)


# ---------------------------------------------------------------- 5. the fishing boat (6 m; z = 0 is the waterline)
def boat():
    L, B, N, K = 6.0, 1.05, 22, 9
    def half(t): return B * (1 - abs(t) ** 2.6) ** 0.75                         # half breadth along the hull, t in -1..1
    def sheer(t): return 0.5 + 0.55 * abs(t) ** 2.4                              # the top edge rises to bow and stern
    def keel(t): return -0.42 + 0.5 * abs(t) ** 3.0
    def sect(t, k, inset=0.0):                                                   # k: 0 keel .. K sheer
        u = k / K; b = max(0.0, half(t) - inset); z0, z1 = keel(t) + inset, sheer(t)
        return (t * L / 2 * (1 - inset * 0.1), b * math.sin(u * math.pi / 2) ** 0.8, z0 + (z1 - z0) * (1 - math.cos(u * math.pi / 2)) ** 0.9)
    def shell(name, m, k0, k1, inset, flip):
        bm = bmesh.new(); V = {}
        for i in range(N + 1):
            t = -0.985 + 1.97 * i / N
            for s in (-1, 1):
                for k in range(k0, k1 + 1):
                    x, y, z = sect(t, k, inset); V[i, s, k] = bm.verts.new((x, s * y, z))
        for i in range(N):
            for s in (-1, 1):
                for k in range(k0, k1):
                    q = [V[i, s, k], V[i + 1, s, k], V[i + 1, s, k + 1], V[i, s, k + 1]]
                    bm.faces.new(q[::-1] if (s > 0) != flip else q)
        bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.001)
        o = zw.obj_from_bm(name, bm, mat(m), 60); zw.box_uv(o, 0.7); return o
    shell('hull', 'plank', 0, K - 2, 0.0, False); shell('strake', 'azure_wood', K - 2, K, 0.0, False); shell('inside', 'wood', 0, K, 0.05, True)
    for i in range(N):                                                           # the gunwale
        for s in (-1, 1):
            t0, t1 = -0.985 + 1.97 * i / N, -0.985 + 1.97 * (i + 1) / N; a, b = sect(t0, K), sect(t1, K)
            zw.rod('gunwale', (a[0], s * a[1], a[2] + 0.02), (b[0], s * b[1], b[2] + 0.02), 0.04, mat('wood_dark'), segs=6, uv=0.5)
    for e in (-1, 1):                                                            # high curved stem and stern posts
        pts = [(e * (2.9 + 0.22 * math.sin(u * 1.3)), 1.02 + 0.95 * u) for u in (0, 0.25, 0.5, 0.75, 1.0)]; pts[-1] = (e * (2.9 - 0.2), pts[-1][1] + 0.05)
        pts = [(e * 2.93, 0.2), (e * 2.96, 0.7)] + pts
        for a, b in zip(pts, pts[1:]): zw.rod('stem', (a[0], 0, a[1]), (b[0], 0, b[1]), 0.07, mat('wood_dark'), segs=7, r2=0.06, uv=0.5)
    for s in (-1, 1):                                                            # the painted eye on each bow
        x, y, z = sect(0.78, K - 1); m_ = Matrix.Translation((x, s * (y + 0.012), z - 0.02)) @ Matrix.Rotation(s * 0.42, 4, 'Z')
        for r, d, mm in ((0.13, 0.02, 'white'), (0.055, 0.03, 'dark')):
            o = zw.cylinder('eye', r, r, d, (0, 0, 0), mat(mm), axis='Y', segs=12); o.data.transform(m_ @ Matrix.Diagonal((1.5, 1, 0.8, 1)))
    for x in (-1.5, -0.2, 1.2): w = half(x / 3) - 0.06; zw.box('thwart', (0.3, 2 * w, 0.05), (x, 0, 0.3), mat('plank'), bevel=0.008, uv=0.7)
    zw.box('floor', (4.0, 0.9, 0.04), (0, 0, -0.16), mat('plank'), uv=0.7)
    zw.rod('mast', (0.5, 0, -0.15), (0.5, 0, 3.1), 0.06, mat('wood'), segs=8, r2=0.045, uv=0.5)   # mast, a slanting yard and the furled sail
    y0, y1 = Vector((-1.3, 0, 2.35)), Vector((2.0, 0, 2.95)); zw.rod('yard', y0, y1, 0.04, mat('wood'), segs=7, uv=0.5)
    for i in range(6):
        a, b = y0.lerp(y1, i / 6), y0.lerp(y1, (i + 1) / 6); o = zw.rod('cloth_cream', a + Vector((0, 0, -0.12)), b + Vector((0, 0, -0.12)), 0.13, mat('cloth_cream'), segs=8, uv=0.5); zw.wobble(o, 0.025, 6.0, i)
        lash(tuple(b + Vector((0, 0, -0.07))), 0.1, axis='X', turns=1, t=0.014)
    lash((0.5, 0, 2.66), 0.06, turns=3)
    for s in (-1, 1): zw.rod('stay', (0.5, 0, 3.05), (s * 2.4 if s < 0 else 2.5, 0, 1.25 if s < 0 else 1.3), 0.012, mat('rope'), segs=5)
    for s in (-1, 1): zw.rod('oar', (-1.6, s * 0.5, 0.36), (1.0, s * 0.62, 0.42), 0.028, mat('wood'), segs=6, uv=0.4); zw.box('blade', (0.6, 0.14, 0.025), (1.25, s * 0.63, 0.425), mat('wood'), bevel=0.008, uv=0.4)
    n = zw.blob('net', (0.55, 0.42, 0.22), (-0.85, 0, 0.36), mat('net'), 10, 6); zw.wobble(n, 0.06, 5.0, 3)
    basket((1.9, 0.1, 0.02), 0.9, 'net'); basket((-2.1, -0.05, 0.1), 0.75); coil((1.75, -0.35, -0.12), 0.18)


# ---------------------------------------------------------------- 6. the jetty (8 x 2.5 m; runs out along +Y; piles go 3 m below the deck's ground line)
def jetty():
    L, W, Z = 8.0, 2.5, 0.55
    n = 26
    for i in range(n): zw.box('deck', (W + rnd.uniform(-0.08, 0.08), L / n - 0.025, 0.07), (rnd.uniform(-0.03, 0.03), -L / 2 + (i + 0.5) * L / n, Z), mat('plank'), bevel=0.008, uv=0.9)
    for s in (-1, 1): zw.beam('bearer', (s * 0.95, -L / 2, Z - 0.16), (s * 0.95, L / 2, Z - 0.16), 0.2, 0.22, mat('wood_dark'), uv=0.8)
    for j, y in enumerate((-3.6, -1.2, 1.2, 3.6)):
        zw.beam('cross', (-1.35, y, Z - 0.34), (1.35, y, Z - 0.34), 0.18, 0.16, mat('wood_dark'), uv=0.8)
        for s in (-1, 1):
            top = Z + (0.85 if j in (0, 3) else 0.35) + rnd.uniform(-0.05, 0.05)
            zw.rod('pile', (s * 1.32, y, -3.0), (s * 1.3, y, top), 0.15, mat('wood_dark'), segs=9, r2=0.13, uv=0.7)
            if j in (0, 3): lash((s * 1.3, y, top - 0.22), 0.14, turns=4, t=0.022)
    ladder((1.5, 2.2, -1.6), (1.46, 2.2, Z + 0.5), w=0.45, rungs=7)
    # a net drying on a rack, a creel, coiled rope
    for x in (-0.9, 0.3): zw.rod('rack', (x, 2.9, Z), (x, 2.9, Z + 1.25), 0.035, mat('wood'), segs=6, uv=0.4)
    zw.rod('rack', (-1.05, 2.9, Z + 1.2), (0.45, 2.9, Z + 1.2), 0.03, mat('wood'), segs=6, uv=0.4)
    o = zw.box('net', (1.15, 0.04, 0.85), (-0.3, 2.9, Z + 0.75), mat('net'), uv=0.3); zw.refine(o, 0.2); zw.wobble(o, 0.04, 4.0, 2)
    basket((-0.6, 1.0, Z + 0.035), 1.0); coil((0.6, -0.8, Z + 0.035)); coil((0.8, 2.0, Z + 0.035), 0.18)
    zw.prism('ramp', [(-L / 2 - 1.8, 0.0), (-L / 2 + 0.1, Z + 0.03), (-L / 2 + 0.1, -0.6), (-L / 2 - 1.8, -0.6)], W, mat('drystone'), axis='X', uv=1.4)   # a stone ramp up from the bank


# ---------------------------------------------------------------- 7. the hay cart
def wheel(x, y, z, R=0.62):
    zw.cylinder('wheel', R, R, 0.11, (x, y, z), mat('plank'), axis='X', segs=22, uv=0.7, bevel=0.012)
    zw.torus('tyre', R, 0.035, (x, y, z), mat('bronze'), axis='X', seg=22, tube=5)
    s = 1 if x > 0 else -1
    zw.cylinder('hub', 0.15, 0.11, 0.2, (x + s * 0.08, y, z), mat('bronze'), axis='X', segs=12)
    for a in (0.5, 2.07, 3.64, 5.2): zw.beam('batten', (x + s * 0.065, y + 0.2 * math.cos(a), z + 0.2 * math.sin(a)), (x + s * 0.065, y + 0.56 * math.cos(a + 0.5), z + 0.56 * math.sin(a + 0.5)), 0.08, 0.03, mat('wood_dark'), uv=0.6)

def cart():
    Z = 0.78
    zw.box('bed', (1.5, 2.3, 0.1), (0, 0, Z), mat('plank'), bevel=0.012, uv=0.8)
    for s in (-1, 1):
        zw.beam('sill', (s * 0.7, -1.2, Z - 0.1), (s * 0.7, 1.2, Z - 0.1), 0.12, 0.14, mat('wood_dark'), bevel=0.01, uv=0.7)
        for y in (-1.08, -0.36, 0.36, 1.08): P.post(s * 0.74, y, Z, 0.8, 0.09, 'wood_dark')
        for z in (0.3, 0.62): zw.beam('slat', (s * 0.76, -1.15, Z + z), (s * 0.76, 1.15, Z + z), 0.04, 0.12, mat('wood'), uv=0.7)
        wheel(s * 0.92, 0.1, 0.62)
    for y in (-1.12, 1.12):
        for z in (0.3, 0.62): zw.beam('slat', (-0.72, y, Z + z), (0.72, y, Z + z), 0.04, 0.12, mat('wood'), uv=0.7)
    zw.cylinder('axle', 0.06, 0.06, 2.0, (0, 0.1, 0.62), mat('wood_dark'), axis='X', segs=8)
    zw.beam('pole', (0, -1.1, Z - 0.12), (0, -3.3, 0.72), 0.11, 0.11, mat('wood_dark'), bevel=0.01, uv=0.7)
    zw.beam('yoke', (-0.55, -3.25, 0.74), (0.55, -3.25, 0.74), 0.09, 0.09, mat('wood'), bevel=0.01, uv=0.7)
    for s in (-1, 1): zw.beam('leg', (0, -3.1, 0.7), (s * 0.25, -3.15, 0), 0.07, 0.07, mat('wood_dark'), uv=0.7)
    for i, (x, y, z, r) in enumerate(((0, 0, 1.25, (0.82, 1.2, 0.6)), (0.1, -0.3, 1.75, (0.7, 0.85, 0.5)), (-0.1, 0.4, 1.8, (0.66, 0.8, 0.48)), (0, 0.05, 2.12, (0.5, 0.62, 0.36)))):
        o = zw.blob('hay', r, (x, y, z), mat('hay'), 12, 7); zw.refine(o, 0.25); zw.wobble(o, 0.085, 3.5, i); zw.box_uv(o, 0.8)
    for y in (-0.45, 0.5):
        pts = [(-0.78, y, 1.2), (-0.62, y, 2.0), (0, y, 2.42), (0.62, y, 2.0), (0.78, y, 1.2)]
        for a, b in zip(pts, pts[1:]): zw.rod('tie', a, b, 0.016, mat('rope'), segs=5)
    fork((0.2, 0.2, 2.2), (0.42, 0.1, 3.25))


# ---------------------------------------------------------------- 8. the haystack (3 m high)
def haystack():
    lay = [(1.7, 1.66, 0.12, 0.9), (1.9, 1.42, 0.7, 1.5), (1.66, 1.05, 1.3, 2.05), (1.3, 0.62, 1.85, 2.5), (0.86, 0.16, 2.35, 2.85)]
    for i, (r0, r1, z0, z1) in enumerate(lay): skirt('hay', r0, r1, z0, z1, 'hay', seed=i + 3, shag=0.15, segs=22)
    zw.rod('pole', (0, 0, 0), (0.03, 0, 3.25), 0.07, mat('wood_dark'), segs=8, r2=0.05, uv=0.5)
    zw.cylinder('base', 1.95, 1.95, 0.1, (0, 0, 0.05), mat('earth'), segs=22, uv=1.0)
    stone_ring(1.95, 20, 0.2, seed=70)
    for a in (0.4, 2.0, 3.55, 5.2):                          # ropes over the top, each held down by a stone
        c, s = math.cos(a), math.sin(a); pts = [(0.1 * c, 0.1 * s, 2.9), (0.85 * c, 0.85 * s, 2.5), (1.4 * c, 1.4 * s, 1.9), (1.76 * c, 1.76 * s, 1.2), (1.84 * c, 1.84 * s, 0.75)]
        for p, q in zip(pts, pts[1:]): zw.rod('tie', p, q, 0.02, mat('rope'), segs=5)
        stone((1.86 * c, 1.86 * s, 0.6), 0.14, int(a * 9), 'rock', 1.1)


# ---------------------------------------------------------------- 9. a length of field fence (3 m; posts at -1.5, 0, 1.5 so that lengths join)
def fence():
    for x in (-1.5, 0, 1.5):
        zw.rod('post', (x, 0, 0), (x + rnd.uniform(-0.02, 0.02), 0, 1.22 + rnd.uniform(-0.04, 0.04)), 0.09, mat('wood_dark'), segs=9, r2=0.075, uv=0.5)
        for i in range(5): a = i * 1.26 + x; stone((x + 0.17 * math.cos(a), 0.17 * math.sin(a), 0.07), rnd.uniform(0.08, 0.12), int(x * 3 + i))
    for z in (0.5, 0.98):
        for x0 in (-1.56, -0.02):
            zw.rod('rail', (x0, -0.1, z + rnd.uniform(-0.03, 0.03)), (x0 + 1.6, -0.1, z + rnd.uniform(-0.03, 0.03)), 0.055, mat('wood'), segs=8, r2=0.045, uv=0.5)
        for x in (-1.5, 0, 1.5): lash((x, -0.04, z), 0.1, axis='X', turns=2, t=0.016)


# ---------------------------------------------------------------- 10. the beehives (terracotta hives on a stone shelf under a thatch lean-to)
def beehives():
    o = zw.box('shelf', (2.3, 1.2, 0.5), (0, 0, 0.25), mat('drystone'), bevel=0.04, uv=1.2); zw.refine(o, 0.4); zw.wobble(o, 0.02, 2.5, 4); zw.box_uv(o, 1.2)
    for i, (x, z) in enumerate(((-0.75, 0.74), (-0.25, 0.74), (0.25, 0.74), (0.75, 0.74), (-0.5, 1.16), (0.5, 1.16))[:5] if False else ((-0.6, 0.76), (0, 0.76), (0.6, 0.76), (-0.3, 1.22), (0.3, 1.22))):
        zw.lathe('hive', [(0.0, 0), (0.2, 0), (0.25, 0.08), (0.27, 0.5), (0.25, 0.9), (0.27, 0.95), (0.27, 1.0), (0.0, 1.0)], mat('terracotta'), segs=14, uv=0.5).data.transform(Matrix.Translation((x, 0.5, z)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        zw.cylinder('lid', 0.24, 0.24, 0.035, (x, -0.515, z), mat('wicker'), axis='Y', segs=14, uv=0.2)
        zw.torus('lidrim', 0.24, 0.02, (x, -0.52, z), mat('wicker'), axis='Y', seg=14, tube=5)
        zw.cylinder('door', 0.03, 0.03, 0.02, (x, -0.54, z - 0.16), mat('dark'), axis='Y', segs=8)
    for s in (-1, 1):
        P.post(s * 1.25, -0.72, 0, 1.75, 0.11, 'wood_dark'); P.post(s * 1.25, 0.72, 0, 2.15, 0.11, 'wood_dark')
        zw.beam('rafter', (s * 1.25, -0.95, 1.7), (s * 1.25, 0.95, 2.2), 0.09, 0.1, mat('wood_dark'), uv=0.6)
    for y, z in ((-0.72, 1.74), (0.72, 2.14)): zw.beam('purlin', (-1.45, y, z), (1.45, y, z), 0.09, 0.09, mat('wood_dark'), uv=0.6)
    for i in range(3):                                       # three courses of thatch, the lowest hanging over the front
        y = -0.75 + i * 0.62; o = zw.box('thatch', (3.0, 0.86, 0.16), (0, 0, 0), mat('thatch'), bevel=0.04, uv=0.9); zw.refine(o, 0.25); zw.wobble(o, 0.05, 4.0, i)
        o.data.transform(Matrix.Translation((0, y, 1.9 + (y + 0.75) * 0.27 + i * 0.03)) @ Matrix.Rotation(0.26, 4, 'X')); zw.box_uv(o, 0.9)
    zw.rod('bind', (-1.5, 0.95, 2.36), (1.5, 0.95, 2.36), 0.035, mat('wood'), segs=6, uv=0.5)
    P.pot(1.55, -0.85, 0, 0.8); zw.cylinder('cloth_cream', 0.15, 0.17, 0.05, (1.55, -0.85, 0.32), mat('cloth_cream'), segs=10); basket((1.95, -0.45, 0), 1.1)


# ---------------------------------------------------------------- 11. the threshing floor (8 m across)
def threshing():
    zw.cylinder('floor', 4.0, 4.0, 0.16, (0, 0, 0.08), mat('paving'), segs=40, uv=2.0, bevel=0.02)
    stone_ring(4.05, 46, 0.24, seed=90)
    zw.rod('post', (0, 0, 0), (0, 0, 1.35), 0.1, mat('wood_dark'), segs=9, r2=0.085, uv=0.5); lash((0, 0, 0.42), 0.1, turns=4, t=0.02)
    def sheaf(x, y, rz, lying):
        def b():
            zw.lathe('hay', [(0.0, 0), (0.17, 0), (0.1, 0.42), (0.11, 0.5), (0.2, 0.8), (0.24, 0.98), (0.0, 0.93)], mat('hay'), segs=10, uv=0.4); lash((0, 0, 0.46), 0.1, turns=2, t=0.014)
        P.moved(b, Matrix.Translation((x, y, 0.3 if lying else 0.16)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(1.45 if lying else 0.12, 4, 'X'))
    for i, (x, y, rz, ly) in enumerate(((-2.2, 1.6, 0.4, False), (-1.85, 1.95, 1.9, False), (-2.5, 2.0, 3.5, False), (-1.3, 1.2, 0.9, True), (-2.6, 0.9, 2.2, True))): sheaf(x, y, rz, ly)
    for i in range(46):                                      # straw scattered where the grain is trodden out
        a, r = rnd.uniform(0, 6.28), rnd.uniform(0.5, 2.4); x, y = -0.9 + r * math.cos(a) * 0.9, 0.8 + r * math.sin(a) * 0.7; d = rnd.uniform(0, 3.14)
        zw.rod('hay', (x, y, 0.175), (x + 0.4 * math.cos(d), y + 0.4 * math.sin(d), 0.18), 0.012, mat('hay'), segs=4)
    basket((2.2, -1.5, 0.16), 1.3, 'grain'); basket((2.75, -1.0, 0.16), 1.1, 'grain'); sack((1.7, -2.2, 0.16), 0.9, 4)
    fork((2.9, 0.2, 0.16), (2.3, 0.5, 1.6)); zw.rod('shovel', (3.1, 0.6, 0.16), (2.5, 0.85, 1.5), 0.022, mat('wood'), segs=6, uv=0.4)
    zw.box('blade', (0.24, 0.3, 0.02), (3.14, 0.58, 0.2), mat('wood'), bevel=0.006, uv=0.4)


# ---------------------------------------------------------------- 12. the roadside shrine (3 m: a small temple with an altar flame)
def shrine():
    P.steps(2.0, 2.0, 3, rise=0.17, tread=0.26, m='step')
    Z = 0.51
    for x in (-0.72, 0.72):
        for y in (-0.72, 0.72): P.doric(x, y, Z, 1.55, r=0.15, segs=16, flutes=10)
    P.entablature(1.9, 1.9, Z + 1.55, h=0.3, accent='paint_azure', t=0.34)
    P.gable_roof(2.2, 2.25, Z + 1.85, pitch=24, axis='Y', k=0.62, tymp='paint_azure', bolt=True, finial='gold')
    zw.box('altar', (0.5, 0.5, 0.75), (0, 0.1, Z + 0.375), mat('marble'), bevel=0.02, uv=1.2); zw.box('altarcap', (0.62, 0.62, 0.08), (0, 0.1, Z + 0.79), mat('marble'), bevel=0.015, uv=1.2)
    zw.lathe('bowl', [(0.05, 0), (0.1, 0.02), (0.19, 0.1), (0.2, 0.13), (0.16, 0.12), (0.0, 0.08)], mat('bronze'), centre=(0, 0.1, Z + 0.83), segs=12, uv=0.4)
    P.fire(0, 0.1, Z + 0.93, 0.13)
    for i in range(9):                                       # a laurel garland hung across the front
        u = i / 8; x = -0.66 + 1.32 * u; z = Z + 1.5 - 0.3 * math.sin(u * math.pi)
        o = zw.blob('leafs', (0.11, 0.07, 0.08), (x, -0.86, z), mat('leaf' if i % 2 else 'leaf_dark'), 7, 5); zw.wobble(o, 0.02, 9.0, i)
    P.pot(-0.62, -1.25, 0.17, 0.9); P.pot(0.7, -1.2, 0.17, 0.7, plant='leaf', seed=3)


# ---------------------------------------------------------------- 13. ruins in the forest: what is left of an older temple (10 x 7 m)
def ruin():
    for i, (w, d) in enumerate(((10.0, 7.0), (9.3, 6.3), (8.6, 5.6))):
        o = zw.box('steps', (w, d, 0.24), (0, 0, 0.12 + i * 0.24), mat('hall'), bevel=0.03, segs=1, uv=1.6); zw.refine(o, 0.6); zw.wobble(o, 0.025, 1.3, i + 2); zw.box_uv(o, 1.6)
    Z, R = 0.72, 0.34
    def drum(c, h, r=R, tilt=None, m='marble'):
        o = zw.lathe('drum', [(r, 0), (r * 0.97, h), (0, h)], mat(m), centre=(0, 0, 0), segs=20, uv=1.2, flutes=12, flute_depth=0.08)
        o.data.transform(Matrix.Translation(c) @ (tilt or Matrix.Identity(4))); return o
    cols = [(-3.6, -2.2, 4.3), (-1.2, -2.2, 4.3), (1.2, -2.2, 2.1), (3.6, -2.2, 0.8), (-3.6, 2.2, 3.0), (3.6, 2.2, 1.4), (-1.2, 2.2, 0.5)]
    for i, (x, y, h) in enumerate(cols):
        n = max(1, round(h / 0.72))
        for k in range(n): drum((x + rnd.uniform(-0.015, 0.015), y + rnd.uniform(-0.015, 0.015), Z + k * h / n), h / n - 0.012, R * (1 - 0.04 * k / max(1, n)))
        zw.box('base', (0.9, 0.9, 0.14), (x, y, Z + 0.0), mat('marble'), bevel=0.02, uv=1.2)
        if h > 4:                                          # the two whole columns still carry their capitals and a length of the beam
            zw.lathe('echinus', [(R * 0.82, 0), (R * 0.95, 0.06), (R * 1.3, 0.2), (R * 1.3, 0.26)], mat('marble'), centre=(x, y, Z + h), segs=14, uv=1.2); zw.box('abacus', (0.9, 0.9, 0.16), (x, y, Z + h + 0.34), mat('marble'), bevel=0.02, uv=1.2)
        elif h > 1:                                        # a broken top: a slanted, chipped drum
            o = drum((x, y, Z + h - 0.02), 0.3, R * 0.93, Matrix.Rotation(0.2 + 0.1 * i, 4, 'X')); zw.wobble(o, 0.03, 4.0, i)
    b = zw.box('beam', (3.3, 0.8, 0.55), (-2.4, -2.2, Z + 4.3 + 0.7), mat('hall'), bevel=0.03, uv=1.4); zw.refine(b, 0.5); zw.wobble(b, 0.02, 1.5, 9); zw.box_uv(b, 1.4)
    for x in (-3.4, -2.4, -1.4): zw.box('triglyph', (0.34, 0.06, 0.36), (x, -2.62, Z + 5.05), mat('paint_azure'), uv=1.0)
    fallen = [((1.9, -3.9, 0.36), 0.9, 1.3), ((3.0, -4.3, 0.36), 0.8, 1.8), ((4.6, -0.2, Z + 0.34), 1.0, 0.4), ((0.6, 0.6, Z + 0.34), 0.85, 2.6), ((5.6, 3.2, 0.34), 0.9, 0.9), ((-5.7, -1.0, 0.34), 0.7, 2.0)]
    for c, h, rz in fallen: drum(c, h, R, Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Translation((0, 0, -h / 2)))
    for i, (x, y, z, r) in enumerate(((2.6, 1.0, Z, 0.5), (-4.9, 3.9, 0, 0.6), (5.4, -3.0, 0, 0.45), (0.2, -4.2, 0, 0.4), (-0.4, 3.0, Z, 0.35))): stone((x, y, z + r * 0.35), r, 30 + i, 'rock', 0.7)
    zw.box('altar', (1.1, 0.8, 0.8), (0.0, 0.2, Z + 0.4), mat('marble'), bevel=0.04, uv=1.2).data.transform(Matrix.Translation((2.3, 0.3, 0)))
    for i, (x, y, z, r) in enumerate(((-3.6, -2.3, Z + 0.5, 0.5), (-3.9, 2.2, Z + 0.3, 0.55), (4.9, -3.4, 0.2, 0.7), (-5.2, -3.3, 0.2, 0.8), (3.7, 2.4, Z + 1.3, 0.4), (-1.3, -2.3, Z + 2.2, 0.38), (0.9, 3.5, 0.3, 0.7))): P.shrub(x, y, z, r, 'leaf', 50 + i, 6)


BUILD = {'ruin': ruin, 'hut': hut, 'barn': barn, 'mill': mill, 'bridge': bridge, 'boat': boat, 'jetty': jetty, 'cart': cart, 'haystack': haystack, 'fence': fence, 'beehives': beehives, 'threshing': threshing, 'shrine': shrine}
BUILD[ITEM]()
P.finish(OUT, dist=0.6 if ITEM in ('barn', 'mill', 'bridge', 'shrine', 'hut', 'ruin') else 0.4, keep=('deck', 'thatch', 'hay', 'floor'))
