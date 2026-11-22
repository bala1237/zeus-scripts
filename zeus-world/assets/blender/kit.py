# Street, construction and garden pieces, all scripted. One file, one builder per item:
#   python kit.py <item> out.glb
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import zw

ITEM, OUT = sys.argv[-2], sys.argv[-1]
zw.reset()
P = zw.PALETTE
_m = {}
def mat(name):
    """Materials are made on first use, so each model only carries the textures it needs."""
    if name in _m: return _m[name]
    T = zw.tex_photo
    make = {
        'marble': lambda: zw.material('marble', *zw.tex_marble(512, seed=5), rough=0.4),
        'stone': lambda: zw.material('stone', *T('castle_wall_slates', 'stone', 512, tint=P['stone'], mix=0.5, gain=0.95), rough=0.9),
        'stone_dark': lambda: zw.material('stone_dark', *T('castle_wall_slates', 'stone_dark', 512, tint=P['stone'], mix=0.5, gain=0.72), rough=0.9),
        'road': lambda: zw.material('road', *T('cobblestone_floor_08', 'road', 1024, tint=P['stone'], mix=0.45, gain=1.05, contrast=1.1), rough=0.9),
        'plaza': lambda: zw.material('plaza', *T('cobblestone_square', 'plaza', 1024, tint=P['cream'], mix=0.55, gain=0.92, contrast=1.25), rough=0.85),
        'mosaic': lambda: zw.material('mosaic', *T('marble_mosaic_tiles', 'mosaic', 1024, tint=P['terracotta'], mix=0.3, gain=1.08, contrast=1.35), rough=0.6),
        'wood': lambda: zw.material('wood', *T('brown_planks_09', 'wood', 512, tint=(0.58, 0.42, 0.27), mix=0.75, gain=0.95, contrast=0.75, rot=True), rough=0.75),
        'wood_dark': lambda: zw.material('wood_dark', *T('old_planks_02', 'wood_dark', 512, tint=(0.42, 0.30, 0.20), mix=0.6, gain=1.0, contrast=1.2), rough=0.8),
        'azure_wood': lambda: zw.material('azure_wood', *T('blue_painted_planks', 'azure_wood', 512, tint=P['azure'], mix=0.85, gain=1.05, contrast=1.1, rot=True), rough=0.6),
        'plaster': lambda: zw.material('plaster', *T('painted_plaster_wall', 'plaster', 512, tint=P['plaster'], mix=0.92, gain=1.0, contrast=2.2, nstrength=2.0), rough=0.85),
        'terracotta': lambda: zw.material('terracotta', *zw.tex_mottled('terracotta', P['terracotta'], seed=3, amount=0.28), rough=0.75),
        'bronze': lambda: zw.material('bronze', *zw.tex_mottled('bronze', P['bronze'], seed=5, amount=0.3, grain=0.08, bump=0.25), rough=0.38, metal=1.0),
        'rope': lambda: zw.material('rope', *zw.tex_mottled('rope', (0.72, 0.62, 0.44), seed=7, amount=0.3, grain=0.3), rough=0.95),
        'gold': lambda: zw.material('gold', P['gold'], rough=0.25, metal=1.0),
        'red_cloth': lambda: zw.material('red_cloth', *zw.tex_mottled('red_cloth', P['red'], seed=9, amount=0.25, grain=0.2), rough=0.9),
        'black_glaze': lambda: zw.material('black_glaze', (0.07, 0.06, 0.06), rough=0.4),
        'flame': lambda: zw.material('flame', (1.0, 0.72, 0.30), rough=0.6),
        'earth': lambda: zw.material('earth', *zw.tex_mottled('earth', (0.30, 0.22, 0.15), seed=11, amount=0.4, grain=0.3), rough=1.0),
    }
    _m[name] = make[name](); return _m[name]

rnd = random.Random(3)


def lashing(p, r=0.07, axis='Z'):
    """Rope wound round a joint."""
    for k in (-1, 0, 1):
        c = list(p); c['XYZ'.index(axis)] += k * 0.022
        zw.torus('lash', r, 0.012, c, mat('rope'), axis=axis, seg=10, tube=4)


def lantern(c, s=1.0, metal='bronze'):
    """Hanging oil lantern centred at c (top of its roof ring)."""
    x, y, z = c; m = mat(metal)
    zw.torus('lantern_ring', 0.03 * s, 0.007 * s, (x, y, z + 0.03 * s), m, axis='X', seg=10, tube=4)
    zw.cylinder('lantern_roof', 0.105 * s, 0.02 * s, 0.09 * s, (x, y, z - 0.045 * s), m, segs=6)
    zw.cylinder('lantern_glow', 0.062 * s, 0.062 * s, 0.17 * s, (x, y, z - 0.175 * s), mat('flame'), segs=6)
    for i in range(6):
        a = i * math.pi / 3 + math.pi / 6
        zw.box('lantern_bar', (0.014 * s, 0.014 * s, 0.18 * s), (x + 0.074 * s * math.cos(a), y + 0.074 * s * math.sin(a), z - 0.175 * s), m)
    zw.cylinder('lantern_band', 0.082 * s, 0.082 * s, 0.018 * s, (x, y, z - 0.175 * s), m, segs=6)
    zw.cylinder('lantern_foot', 0.09 * s, 0.07 * s, 0.03 * s, (x, y, z - 0.275 * s), m, segs=6)
    zw.cylinder('lantern_drop', 0.02 * s, 0.004 * s, 0.05 * s, (x, y, z - 0.315 * s), m, segs=6)


def scroll_arm(base, reach, side, metal='bronze', r=0.022):
    """A curled bracket: rises from the post, sweeps out, and ends in a small scroll. Returns the hang point."""
    x0, y0, z0 = base; pts = []
    for i in range(11):
        t = i / 10
        pts.append((x0 + side * reach * math.sin(t * math.pi / 2), y0, z0 + 0.34 * (1 - math.cos(t * math.pi / 2)) * 0.9 + 0.10 * math.sin(t * math.pi)))
    cx, cz = pts[-1][0], pts[-1][2] - 0.07
    for i in range(1, 10):                                  # the end curls under itself
        a = math.pi / 2 - i / 9 * math.pi * 1.5; rr = 0.07 * (1 - i / 14)
        pts.append((cx + side * rr * math.cos(a), y0, cz + rr * math.sin(a)))
    for a, b in zip(pts, pts[1:]):
        zw.rod('arm', a, b, r, mat(metal), segs=6)
    return (x0 + side * reach, y0, z0 + 0.20)


# ---------------------------------------------------------------- street
def tile(kind):
    """2 x 2 m ground tile; the pattern repeats exactly once across it, so tiles join without a seam."""
    top = zw.box('tile', (2.0, 2.0, 0.07), (0, 0, 0.035), mat(kind), uv=2.0)
    zw.refine(top, 0.5); zw.box_uv(top, 2.0)

def boundary():
    """Low boundary stones for a 2 m stretch of plot edge."""
    x = -0.96
    while x < 0.86:
        w = rnd.uniform(0.34, 0.56); h = rnd.uniform(0.16, 0.26); d = rnd.uniform(0.24, 0.32)
        o = zw.box('stone', (w, d, h), (x + w / 2, rnd.uniform(-0.03, 0.03), h / 2 - 0.02), mat('stone'), bevel=min(w, d, h) * 0.32, segs=3, uv=1.8)
        zw.turn(o, z=rnd.uniform(-0.2, 0.2)); zw.wobble(o, 0.025, 4.0, int(x * 50)); zw.box_uv(o, 1.8)
        x += w * 0.95

def street_lamp():
    """Street lamp, 3.4 m: stepped marble base, fluted bronze post, two scroll arms with lanterns, gold bolt."""
    zw.box('base', (0.62, 0.62, 0.16), (0, 0, 0.08), mat('marble'), bevel=0.03, uv=0.9)
    zw.box('base2', (0.46, 0.46, 0.14), (0, 0, 0.23), mat('marble'), bevel=0.025, uv=0.9)
    prof = [(0.17, 0.30), (0.17, 0.36), (0.12, 0.42), (0.10, 0.50), (0.125, 0.56), (0.10, 0.62), (0.075, 0.72),
            (0.068, 1.5), (0.06, 2.55), (0.085, 2.60), (0.085, 2.66), (0.06, 2.72), (0.052, 2.95), (0.085, 3.02), (0.06, 3.08), (0.03, 3.14)]
    zw.lathe('post', prof, mat('bronze'), segs=12, uv=0.5)
    for i in range(8):                                       # flutes read as ribs on the shaft
        a = i * math.pi / 4
        zw.rod('rib', (0.07 * math.cos(a), 0.07 * math.sin(a), 0.74), (0.058 * math.cos(a), 0.058 * math.sin(a), 2.54), 0.012, mat('bronze'), segs=5)
    for side in (-1, 1):
        hang = scroll_arm((side * 0.05, 0, 2.66), 0.52, side)
        zw.rod('chain', hang, (hang[0], hang[1], hang[2] - 0.10), 0.006, mat('bronze'), segs=5)
        lantern((hang[0], hang[1], hang[2] - 0.13), 1.15)
    zw.bolt('bolt', 0.30, (0, 0, 3.30), mat('gold'), depth=0.03)

def plaque():
    """Name plaque for a gifted item: bronze plate with a laurel border on a short marble post. Text is added in code."""
    zw.box('foot', (0.30, 0.22, 0.08), (0, 0, 0.04), mat('marble'), bevel=0.02, uv=0.9)
    zw.box('post', (0.12, 0.10, 0.46), (0, 0, 0.30), mat('marble'), bevel=0.015, uv=0.9)
    tilt = math.radians(28)
    o = zw.box('plate', (0.52, 0.03, 0.32), (0, 0, 0), mat('bronze'), bevel=0.008)
    f = zw.box('frame', (0.46, 0.012, 0.26), (0, -0.018, 0), mat('gold'), bevel=0.004)
    p = zw.box('panel', (0.42, 0.012, 0.22), (0, -0.024, 0), mat('black_glaze'))
    b = zw.bolt('bolt', 0.06, (0, -0.032, 0.125), mat('gold'), depth=0.01)
    for i in range(7):                                       # laurel leaves along the bottom edge
        for s in (-1, 1):
            l = zw.blob('leaf', (0.022, 0.006, 0.011), (s * (0.03 + i * 0.026), -0.03, -0.128 + 0.004 * i), mat('gold'), 6, 4)
            zw.turn(l, y=s * -0.5)
    import bpy
    from mathutils import Matrix
    for ob in list(bpy.context.scene.objects):
        if ob.name.split('.')[0] in ('plate', 'frame', 'panel', 'bolt', 'leaf'):
            ob.matrix_basis = Matrix.Translation((0, -0.01, 0.66)) @ Matrix.Rotation(-tilt, 4, 'X') @ ob.matrix_basis
    zw.apply_transforms()

# ---------------------------------------------------------------- construction
def scaffolding():
    """One bay of timber scaffolding, 2 m wide, 1 m deep, 3.3 m tall: stand bays side by side along a wall."""
    W, D, H = 2.0, 1.0, 3.3; xs = (-W / 2 + 0.06, W / 2 - 0.06); ys = (-D / 2 + 0.06, D / 2 - 0.06)
    for x in xs:
        for y in ys:
            zw.rod('pole', (x, y, 0), (x + rnd.uniform(-0.02, 0.02), y, H + rnd.uniform(-0.1, 0.1)), 0.05, mat('wood'), segs=8, r2=0.042, uv=0.7)
    for z in (1.05, 2.15, 3.05):
        for y in ys:
            zw.rod('ledger', (-W / 2 - 0.12, y, z), (W / 2 + 0.12, y, z + rnd.uniform(-0.015, 0.015)), 0.04, mat('wood'), segs=7, uv=0.7)
            for x in xs: lashing((x, y, z), 0.062, 'Z')
        for x in xs:
            zw.rod('putlog', (x, -D / 2 - 0.10, z + 0.075), (x, D / 2 + 0.10, z + 0.075), 0.036, mat('wood'), segs=7, uv=0.7)
    for z in (1.05, 2.15):                                    # plank decks
        for i in range(4):
            y = -D / 2 + 0.16 + i * 0.225
            o = zw.box('plank', (W + 0.16 + rnd.uniform(-0.1, 0.1), 0.20, 0.035), (rnd.uniform(-0.03, 0.03), y, z + 0.13), mat('wood'), bevel=0.006, segs=1, uv=0.7)
            zw.turn(o, z=rnd.uniform(-0.012, 0.012))
    zw.rod('brace', (xs[0], ys[0], 0.15), (xs[1], ys[0], 2.1), 0.032, mat('wood'), segs=6, uv=0.7)
    zw.rod('brace', (xs[1], ys[0], 2.2), (xs[0], ys[0], 3.2), 0.032, mat('wood'), segs=6, uv=0.7)
    # ladder leaning on the front
    for s in (-1, 1):
        zw.rod('ladder', (0.45 + s * 0.20, -D / 2 - 0.75, 0), (0.45 + s * 0.20, -D / 2 - 0.08, 2.35), 0.028, mat('wood_dark'), segs=6, uv=0.7)
    for i in range(8):
        t = 0.08 + i * 0.115
        zw.rod('rung', (0.25, -D / 2 - 0.75 + 0.67 * t, 2.35 * t), (0.65, -D / 2 - 0.75 + 0.67 * t, 2.35 * t), 0.02, mat('wood_dark'), segs=5, uv=0.7)
    # a bucket and a coil of rope on the upper deck
    zw.lathe('bucket', [(0.11, 0), (0.14, 0.24), (0.15, 0.24), (0.12, 0.0)], mat('wood_dark'), centre=(-0.55, 0.1, 2.30), segs=10, uv=0.5)
    for k in range(3):
        zw.torus('coil', 0.13 - k * 0.012, 0.022, (0.55, 0.1, 2.31 + k * 0.035), mat('rope'), axis='Z', seg=12, tube=5)
    zw.apply_transforms()

def stone_blocks():
    """Dressed marble blocks waiting on timber skids."""
    for y in (-0.42, 0.42):
        zw.beam('skid', (-1.05, y, 0.06), (1.05, y, 0.06), 0.12, 0.14, mat('wood_dark'), bevel=0.012, uv=0.7)
    blocks = [((0.92, 0.62, 0.50), (-0.50, 0.0, 0.37)), ((0.86, 0.60, 0.48), (0.48, 0.02, 0.36)),
              ((0.80, 0.56, 0.44), (-0.08, -0.02, 0.84)), ((0.5, 0.42, 0.36), (0.62, 0.05, 0.78))]
    for i, (size, c) in enumerate(blocks):
        o = zw.box('block', size, c, mat('marble'), bevel=0.028, segs=2, uv=0.9)
        zw.turn(o, z=rnd.uniform(-0.09, 0.09)); zw.wobble(o, 0.006, 3.0, i)
    zw.rod('lever', (-1.0, -0.75, 0.04), (0.2, -0.55, 0.52), 0.026, mat('wood'), segs=6, uv=0.7)   # a pry bar leaning on the stack

def timber_stack():
    """Squared beams stacked on spacers, with a few round poles on top."""
    for x in (-0.8, 0.8):
        zw.beam('spacer', (x, -0.52, 0.045), (x, 0.52, 0.045), 0.10, 0.09, mat('wood_dark'), bevel=0.01, uv=0.7)
    z = 0.09
    for row, n in enumerate((4, 3, 3)):
        for i in range(n):
            y = (i - (n - 1) / 2) * 0.235 + rnd.uniform(-0.01, 0.01); L = 2.3 + rnd.uniform(-0.25, 0.2); off = rnd.uniform(-0.1, 0.1)
            zw.beam('beam', (off - L / 2, y, z + 0.085), (off + L / 2, y + rnd.uniform(-0.02, 0.02), z + 0.085), 0.19, 0.17, mat('wood'), bevel=0.012, uv=0.7)
        z += 0.17
        if row < 2:
            for x in (-0.7, 0.7):
                zw.beam('sticker', (x, -0.45, z + 0.015), (x, 0.45, z + 0.015), 0.06, 0.03, mat('wood_dark'), uv=0.7)
            z += 0.03
    for i in range(3):
        zw.rod('pole', (-1.3 + rnd.uniform(-0.1, 0.1), (i - 1) * 0.14, z + 0.06), (1.3, (i - 1) * 0.14 + rnd.uniform(-0.03, 0.03), z + 0.06), 0.06, mat('wood'), segs=9, r2=0.05, uv=0.7)
    for x in (-0.5, 0.55):                                    # rope ties round the pole bundle
        zw.torus('tie', 0.22, 0.014, (x, 0, z + 0.05), mat('rope'), axis='X', seg=12, tube=4)

def crate(c, size, yaw=0.0, lid=True):
    x, y, z = c; w, d, h = size; t = 0.022
    parts = [zw.box('crate_core', (w - 2 * t, d - 2 * t, h - 2 * t), (0, 0, h / 2), mat('wood_dark'), uv=0.7)]
    n = max(3, round(h / 0.13))
    for i in range(n):                                        # slatted sides
        zz = (i + 0.5) * h / n
        for s in (-1, 1):
            parts.append(zw.box('slat', (w, t, h / n - 0.012), (0, s * (d / 2 - t / 2), zz), mat('wood'), bevel=0.004, segs=1, uv=0.7))
            parts.append(zw.box('slat', (t, d - 2 * t, h / n - 0.012), (s * (w / 2 - t / 2), 0, zz), mat('wood'), bevel=0.004, segs=1, uv=0.7))
    for sx in (-1, 1):                                        # corner posts and diagonal braces
        for sy in (-1, 1):
            parts.append(zw.box('corner', (0.05, 0.05, h + 0.01), (sx * (w / 2 - 0.02), sy * (d / 2 - 0.02), h / 2), mat('wood_dark'), bevel=0.006, segs=1, uv=0.7))
    for s in (-1, 1):
        parts.append(zw.beam('brace', (-w / 2 + 0.05, s * (d / 2 + 0.006), 0.04), (w / 2 - 0.05, s * (d / 2 + 0.006), h - 0.04), 0.05, 0.018, mat('wood_dark'), uv=0.7))
    if lid:
        m = max(3, round(w / 0.14))
        for i in range(m):
            parts.append(zw.box('lid', (w / m - 0.01, d + 0.02, t), ((i + 0.5) * w / m - w / 2, 0, h + t / 2), mat('wood'), bevel=0.004, segs=1, uv=0.7))
    from mathutils import Matrix
    for o in parts: o.matrix_basis = Matrix.Translation((x, y, z)) @ Matrix.Rotation(yaw, 4, 'Z') @ o.matrix_basis
    zw.apply_transforms()

def crates():
    """A small pile of shipping crates with a rope coil and a sack."""
    crate((-0.42, 0.05, 0), (0.80, 0.62, 0.58), 0.08)
    crate((0.42, -0.05, 0), (0.66, 0.56, 0.48), -0.12)
    crate((-0.30, 0.02, 0.60), (0.54, 0.46, 0.40), 0.35)
    crate((0.50, 0.62, 0), (0.44, 0.40, 0.34), 0.5, lid=False)
    s = zw.blob('sack', (0.22, 0.17, 0.20), (0.44, -0.04, 0.66), mat('rope'), 10, 7); zw.wobble(s, 0.03, 5.0, 2); zw.box_uv(s, 0.4)
    zw.cylinder('sack_neck', 0.05, 0.08, 0.08, (0.44, -0.04, 0.87), mat('rope'), segs=8)
    for k in range(3):
        zw.torus('coil', 0.15 - k * 0.012, 0.024, (-0.45, -0.60, 0.03 + k * 0.04), mat('rope'), axis='Z', seg=12, tube=5)

def crane():
    """Builder's crane: two-legged shear frame with a windlass, pulley block and a marble block on the hook."""
    wood, dark, rope = mat('wood'), mat('wood_dark'), mat('rope')
    top = (0, -0.9, 5.2)
    for s in (-1, 1):                                         # sled base
        zw.beam('sled', (s * 1.0, -1.3, 0.09), (s * 1.0, 1.7, 0.09), 0.20, 0.18, dark, bevel=0.015, uv=0.7)
    for y in (-1.0, 0.2, 1.4):
        zw.beam('cross', (-1.15, y, 0.24), (1.15, y, 0.24), 0.16, 0.12, dark, bevel=0.012, uv=0.7)
    for s in (-1, 1):                                         # the two legs
        zw.rod('leg', (s * 0.95, 0.2, 0.3), (s * 0.10, top[1], top[2] + 0.25), 0.095, wood, segs=10, r2=0.07, uv=0.7)
    for z, w in ((1.5, 0.74), (3.0, 0.47)):                   # rungs brace the frame
        yy = 0.2 + (top[1] - 0.2) * (z - 0.3) / (top[2] - 0.05)
        zw.rod('rung', (-w, yy, z), (w, yy, z), 0.04, wood, segs=7, uv=0.7)
        for s in (-1, 1): lashing((s * w * 0.97, yy, z), 0.085, 'X')
    for k in range(4):
        zw.torus('head_lash', 0.15, 0.016, (0, top[1], top[2] + 0.02 + k * 0.035), rope, axis='Z', seg=10, tube=4)
    # back stays to stakes
    for s in (-1, 1):
        stake = (s * 1.6, 2.6, 0.0)
        zw.rod('stay', (s * 0.08, top[1], top[2] + 0.1), (stake[0], stake[1], 0.25), 0.014, rope, segs=5)
        zw.rod('stake', (stake[0], stake[1] + 0.12, -0.02), (stake[0], stake[1] - 0.08, 0.42), 0.04, dark, segs=6, r2=0.03, uv=0.7)
    # windlass: drum between two posts, with capstan bars
    for s in (-1, 1):
        zw.beam('wpost', (s * 0.62, 1.0, 0.3), (s * 0.62, 1.0, 1.2), 0.14, 0.14, dark, bevel=0.012, uv=0.7)
    zw.cylinder('drum', 0.15, 0.15, 1.1, (0, 1.0, 1.02), wood, axis='X', segs=12, uv=0.7)
    for k in range(7):
        zw.torus('wrap', 0.162, 0.016, (-0.12 + k * 0.034, 1.0, 1.02), rope, axis='X', seg=12, tube=4)
    for s in (-1, 1):
        for a in (0.4, 0.4 + math.pi / 2):
            zw.rod('bar', (s * 0.80, 1.0 - 0.42 * math.cos(a), 1.02 - 0.42 * math.sin(a)), (s * 0.80, 1.0 + 0.42 * math.cos(a), 1.02 + 0.42 * math.sin(a)), 0.022, dark, segs=6, uv=0.7)
    # tackle: pulley block under the head, hoist rope down to the load and back to the drum
    hook = (0, top[1] - 0.05, 2.35)
    zw.box('block', (0.16, 0.28, 0.34), (0, top[1] - 0.05, top[2] - 0.38), dark, bevel=0.03, uv=0.7)
    zw.cylinder('sheave', 0.11, 0.11, 0.05, (0, top[1] - 0.05, top[2] - 0.40), mat('bronze'), axis='X', segs=12)
    zw.rod('sling', (0, top[1], top[2]), (0, top[1] - 0.05, top[2] - 0.22), 0.016, rope, segs=5)
    zw.rod('hoist', (0.03, top[1] - 0.05, top[2] - 0.5), (0.03, hook[1], hook[2] + 0.2), 0.014, rope, segs=5)
    zw.rod('hoist', (-0.03, top[1] + 0.03, top[2] - 0.45), (0, 1.0, 1.17), 0.014, rope, segs=5)
    zw.box('block2', (0.12, 0.2, 0.22), (0, hook[1], hook[2] + 0.12), dark, bevel=0.025, uv=0.7)
    zw.torus('hook', 0.06, 0.016, (0, hook[1], hook[2] - 0.04), mat('bronze'), axis='X', seg=10, tube=5)
    # the load: a marble block in a rope sling
    L = (0, hook[1], 1.55)
    o = zw.box('load', (0.95, 0.62, 0.52), L, mat('marble'), bevel=0.03, segs=2, uv=0.9)
    zw.turn(o, z=0.3)
    for s in (-1, 1):
        zw.rod('sling', (0, hook[1], hook[2] - 0.08), (s * 0.34, hook[1] + s * 0.10, 1.83), 0.013, rope, segs=5)
        zw.torus('girth', 0.43, 0.014, (s * 0.26, hook[1] + s * 0.08, 1.55), rope, axis='X', seg=4, tube=4)

# ---------------------------------------------------------------- garden and decor
def lantern_post():
    """Bronze lantern on a post, 2.6 m, for plots: stone base, fluted post, one scroll arm, gold bolt."""
    zw.box('base', (0.42, 0.42, 0.14), (0, 0, 0.07), mat('stone'), bevel=0.03, uv=0.8)
    prof = [(0.13, 0.14), (0.13, 0.20), (0.085, 0.27), (0.075, 0.34), (0.095, 0.40), (0.06, 0.48), (0.052, 1.3), (0.045, 2.05),
            (0.07, 2.10), (0.07, 2.15), (0.045, 2.20), (0.04, 2.36), (0.062, 2.41), (0.04, 2.46), (0.02, 2.50)]
    zw.lathe('post', prof, mat('bronze'), segs=10, uv=0.5)
    for i in range(6):
        a = i * math.pi / 3
        zw.rod('rib', (0.054 * math.cos(a), 0.054 * math.sin(a), 0.5), (0.044 * math.cos(a), 0.044 * math.sin(a), 2.04), 0.010, mat('bronze'), segs=5)
    hang = scroll_arm((0.04, 0, 2.15), 0.42, 1)
    zw.rod('chain', hang, (hang[0], hang[1], hang[2] - 0.08), 0.006, mat('bronze'), segs=5)
    lantern((hang[0], hang[1], hang[2] - 0.11), 1.0)
    zw.bolt('bolt', 0.22, (0, 0, 2.62), mat('gold'), depth=0.025)

AMPHORA = [(0.0, 0.0), (0.035, 0.0), (0.045, 0.03), (0.10, 0.16), (0.20, 0.36), (0.25, 0.52), (0.24, 0.66), (0.18, 0.78),
           (0.10, 0.86), (0.075, 0.92), (0.07, 1.0), (0.085, 1.04), (0.11, 1.06), (0.11, 1.08), (0.075, 1.085), (0.06, 1.05)]

def amphora(c, s=1.0, tilt=None, band=True, cap=False):
    x, y, z = c; prof = [(r * s, h * s) for r, h in AMPHORA]
    t = (tilt, 'Y') if tilt else None
    zw.lathe('amphora', prof, mat('terracotta'), centre=c, segs=14, uv=0.6, tilt=t)
    parts = []
    if band:
        parts.append(zw.lathe('band', [(0.2525 * s, 0.545 * s), (0.2545 * s, 0.57 * s), (0.2525 * s, 0.595 * s)], mat('black_glaze'), segs=14))
        parts.append(zw.lathe('band2', [(0.19 * s, 0.75 * s), (0.185 * s, 0.765 * s)], mat('black_glaze'), segs=14))
        parts.append(zw.lathe('band3', [(0.246 * s, 0.47 * s), (0.249 * s, 0.482 * s)], mat('black_glaze'), segs=14))
        parts.append(zw.lathe('band4', [(0.246 * s, 0.655 * s), (0.242 * s, 0.667 * s)], mat('black_glaze'), segs=14))
    for sgn in (-1, 1):                                       # two handles from shoulder to neck
        pts = [(sgn * 0.17 * s, 0, 0.80 * s), (sgn * 0.215 * s, 0, 0.90 * s), (sgn * 0.20 * s, 0, 1.0 * s), (sgn * 0.085 * s, 0, 1.02 * s)]
        for a, b in zip(pts, pts[1:]): parts.append(zw.rod('handle', a, b, 0.022 * s, mat('terracotta'), segs=6))
    if cap:
        parts.append(zw.lathe('cap', [(0.0, 1.14 * s), (0.10 * s, 1.12 * s), (0.135 * s, 1.06 * s), (0.125 * s, 0.99 * s), (0.10 * s, 0.97 * s)], mat('red_cloth'), segs=10))
        parts.append(zw.torus('cap_tie', 0.105 * s, 0.01 * s, (0, 0, 0.985 * s), mat('rope'), axis='Z', seg=10, tube=4))
    from mathutils import Matrix
    m = Matrix.Translation(c) @ (Matrix.Rotation(tilt, 4, 'Y') if tilt else Matrix.Identity(4))
    for o in parts: o.matrix_basis = m @ o.matrix_basis
    zw.apply_transforms()

def amphorae():
    """Three amphorae: two standing in a wooden rack, the smallest leaning against them."""
    dark = mat('wood_dark')
    for y in (-0.26, 0.26):
        zw.beam('rail', (-0.62, y, 0.07), (0.42, y, 0.07), 0.07, 0.09, dark, bevel=0.01, uv=0.7)
        zw.beam('rail', (-0.62, y, 0.34), (0.42, y, 0.34), 0.06, 0.07, dark, bevel=0.01, uv=0.7)
        for x in (-0.60, -0.10, 0.40):
            zw.beam('post', (x, y, 0.0), (x, y, 0.42), 0.07, 0.07, dark, bevel=0.01, uv=0.7)
    for x in (-0.60, -0.10, 0.40):
        zw.beam('tie', (x, -0.26, 0.34), (x, 0.26, 0.34), 0.06, 0.06, dark, bevel=0.01, uv=0.7)
    amphora((-0.35, 0, 0.06), 0.93, cap=True)
    amphora((0.15, 0, 0.06), 0.80)
    amphora((0.63, -0.02, 0.10), 0.62, tilt=-0.42, band=False)

def garden_wall():
    """2 m of low garden wall: plaster over a rough stone base, capped with terracotta tiles. Joins end to end."""
    L, T, H = 2.0, 0.30, 0.86
    zw.wobble(zw.refine(zw.box('base', (L, T + 0.06, 0.24), (0, 0, 0.12), mat('stone_dark'), uv=1.6), 0.3), 0.012, 3.0, 1)
    b = zw.box('wall', (L, T, H - 0.30), (0, 0, 0.24 + (H - 0.30) / 2), mat('plaster'), uv=1.6)
    zw.refine(b, 0.3); zw.box_uv(b, 1.6)
    for v in b.data.vertices:                                 # only bulge the faces, keep the ends flat so segments join
        if abs(abs(v.co.x) - L / 2) > 1e-4: v.co.y += 0.012 * math.sin(v.co.x * 5.1 + v.co.z * 3.3)
    capping(L, 0.0, H - 0.06, T)

def capping(L, x0, z, T):
    """A ridge of half-round terracotta tiles along a wall top."""
    n = round(L / 0.25)
    zw.box('cap_bed', (L, T + 0.10, 0.05), (x0, 0, z + 0.025), mat('terracotta'), uv=0.6)
    for i in range(n):
        x = x0 - L / 2 + (i + 0.5) * L / n
        for s in (-1, 1):                                     # sloping pan tiles each side
            o = zw.box('pan', (L / n - 0.012, 0.21, 0.022), (0, 0, 0), mat('terracotta'), bevel=0.006, segs=1, uv=0.6)
            o.rotation_euler = (s * -0.42, 0, 0); o.location = (x, s * 0.105, z + 0.075)
        zw.cylinder('ridge', 0.052, 0.058, L / n + 0.012, (x, 0, z + 0.115), mat('terracotta'), axis='X', segs=8, uv=0.6)
    zw.apply_transforms()

def garden_gate():
    """Garden gate, 2 m wide: two plaster pillars on stone bases with tiled caps, azure double gate, gold bolts."""
    PX, PW, PH = 0.78, 0.40, 1.02
    for s in (-1, 1):
        zw.wobble(zw.refine(zw.box('pbase', (PW + 0.06, PW + 0.06, 0.24), (s * PX, 0, 0.12), mat('stone_dark'), bevel=0.02, uv=1.6), 0.3), 0.01, 3.0, s + 2)
        zw.box('pillar', (PW, PW, PH - 0.24), (s * PX, 0, 0.24 + (PH - 0.24) / 2), mat('plaster'), bevel=0.02, uv=1.6)
        zw.box('pcap', (PW + 0.10, PW + 0.10, 0.06), (s * PX, 0, PH + 0.03), mat('terracotta'), bevel=0.012, uv=0.6)
        zw.turn(zw.cylinder('proof', 0.36, 0.03, 0.26, (s * PX, 0, PH + 0.19), mat('terracotta'), segs=4, uv=0.6), z=math.pi / 4)
        zw.blob('finial', (0.05, 0.05, 0.06), (s * PX, 0, PH + 0.36), mat('terracotta'), 8, 6)
        zw.bolt('bolt', 0.20, (s * PX, -PW / 2 - 0.012, 0.66), mat('gold'), depth=0.02)
        # short stubs so the garden wall meets the pillar cleanly (wall is 0.30 thick, 0.86 high)
        zw.box('stub_base', (0.03, 0.36, 0.24), (s * (PX + PW / 2 + 0.015), 0, 0.12), mat('stone_dark'), uv=1.6)
        zw.box('stub', (0.03, 0.30, 0.56), (s * (PX + PW / 2 + 0.015), 0, 0.52), mat('plaster'), uv=1.6)
    zw.apply_transforms()
    GW = PX - PW / 2 - 0.012                                  # one leaf
    wood, bronze = mat('azure_wood'), mat('bronze')
    for s in (-1, 1):
        cx = s * GW / 2
        n = 5
        for i in range(n):                                    # vertical boards rising to a curved top
            x = s * ((i + 0.5) * GW / n); h = 0.74 + 0.16 * math.cos((x / (PX - PW / 2)) * math.pi / 2)
            zw.box('board', (GW / n - 0.01, 0.035, h), (x, 0, 0.10 + h / 2), wood, bevel=0.006, segs=1, uv=0.9)
        for zz in (0.24, 0.66):
            zw.box('ledge', (GW - 0.03, 0.03, 0.09), (cx, -0.03, zz), wood, bevel=0.006, segs=1, uv=0.9)
            zw.box('strap', (GW * 0.72, 0.012, 0.045), (s * (PX - PW / 2 - GW * 0.36 - 0.01), -0.05, zz), bronze, bevel=0.004)
            zw.cylinder('pin', 0.022, 0.022, 0.13, (s * (PX - PW / 2 - 0.012), -0.045, zz), bronze, segs=8)
        zw.beam('brace', (s * 0.05, -0.03, 0.29), (s * (GW - 0.06), -0.03, 0.61), 0.07, 0.028, wood, uv=0.9)
        zw.torus('ring', 0.05, 0.010, (s * 0.085, -0.062, 0.50), bronze, axis='Y', seg=10, tube=5)
        zw.blob('boss', (0.03, 0.016, 0.03), (s * 0.085, -0.055, 0.55), bronze, 8, 5)


BUILD = {
    'tile_road': lambda: tile('road'), 'tile_plaza': lambda: tile('plaza'), 'tile_mosaic': lambda: tile('mosaic'),
    'boundary': boundary, 'street_lamp': street_lamp, 'plaque': plaque,
    'scaffolding': scaffolding, 'stone_blocks': stone_blocks, 'timber_stack': timber_stack, 'crates': crates, 'crane': crane,
    'lantern_post': lantern_post, 'amphorae': amphorae, 'garden_wall': garden_wall, 'garden_gate': garden_gate,
}
BUILD[ITEM]()
zw.apply_transforms()
zw.bake_shading(dist=0.5 if ITEM in ('crane', 'scaffolding', 'street_lamp', 'garden_gate', 'garden_wall') else 0.3)
zw.export(OUT)
