# Homes, shops, market stalls and garden furniture, all scripted.   python town.py <item> out.glb
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, zw
zw.reset()
from parts import *

ITEM, OUT = sys.argv[-2], sys.argv[-1]
rnd = random.Random(21)
PI = math.pi


def goods(kind, x, y, z, n=6, r=0.07, spread=0.22):
    m = {'apple': 'cloth_red', 'orange': 'cloth_gold', 'olive': 'leaf_dark', 'bread': 'bread', 'lemon': 'cloth_gold', 'fig': 'paint_azure'}[kind]
    for i in range(n):
        a = i * 2.4; d = spread * math.sqrt((i + 0.5) / n)
        zw.blob('goods', (r, r * (1.5 if kind == 'bread' else 1), r * (0.7 if kind == 'bread' else 1)), (x + d * math.cos(a), y + d * math.sin(a), z + r * 0.8), mat(m), 6, 4)


def crate(x, y, z, w=0.55, d=0.4, h=0.22, fill=None):
    zw.box('crate', (w, d, h), (x, y, z + h / 2), mat('wood'), bevel=0.01, segs=1, uv=0.7)
    zw.box('crate_in', (w - 0.06, d - 0.06, 0.02), (x, y, z + h), mat('wood_dark'))
    if fill: goods(fill, x, y, z + h - 0.02, 9, 0.06, min(w, d) * 0.42)


def table(x, y, z, w=1.5, d=0.8, h=0.75, m='wood'):
    zw.box('table', (w, d, 0.06), (x, y, z + h - 0.03), mat(m), bevel=0.01, segs=1, uv=0.7)
    for sx in (-1, 1):
        for sy in (-1, 1): zw.box('leg', (0.07, 0.07, h - 0.06), (x + sx * (w / 2 - 0.1), y + sy * (d / 2 - 0.1), z + (h - 0.06) / 2), mat('wood_dark'), uv=0.7)


def stool(x, y, z):
    zw.cylinder('stool', 0.18, 0.18, 0.05, (x, y, z + 0.44), mat('wood'), segs=10, uv=0.7)
    for a in (0.3, 2.4, 4.5): zw.rod('leg', (x + 0.16 * math.cos(a), y + 0.16 * math.sin(a), z), (x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), z + 0.42), 0.025, mat('wood_dark'), segs=5)


def jug(x, y, z, s=1.0, m='terracotta'):
    zw.lathe('jug', [(0, 0), (0.06 * s, 0), (0.1 * s, 0.1 * s), (0.08 * s, 0.2 * s), (0.04 * s, 0.26 * s), (0.055 * s, 0.3 * s), (0, 0.29 * s)], mat(m), centre=(x, y, z), segs=8, uv=0.5)


def amphora(x, y, z, s=0.8):
    zw.lathe('amphora', [(0, 0), (0.04 * s, 0), (0.1 * s, 0.16 * s), (0.24 * s, 0.5 * s), (0.2 * s, 0.75 * s), (0.08 * s, 0.9 * s), (0.07 * s, 1.0 * s), (0.11 * s, 1.06 * s), (0, 1.04 * s)], mat('terracotta'), centre=(x, y, z), segs=10, uv=0.6)
    zw.lathe('band', [(0.243 * s, 0.47 * s), (0.243 * s, 0.53 * s)], mat('black_glaze'), centre=(x, y, z), segs=10)


def barrel(x, y, z, s=1.0):
    zw.lathe('barrel', [(0, 0), (0.24 * s, 0), (0.3 * s, 0.35 * s), (0.24 * s, 0.7 * s), (0, 0.7 * s)], mat('wood'), centre=(x, y, z), segs=12, uv=0.5)
    for h in (0.12, 0.58): zw.torus('hoop', (0.262 if h < 0.3 else 0.262) * s, 0.012 * s, (x, y, z + h * s), mat('iron'), axis='Z', seg=12, tube=4)


def sign(x, y, z, color='azure_wood', face='Y'):
    def b():
        zw.rod('bracket', (0, 0, 0), (0, -0.7, 0), 0.02, mat('iron'), segs=5)
        zw.box('board', (0.06, 0.5, 0.4), (0, -0.4, -0.26), mat(color), bevel=0.01, segs=1, uv=0.9)
        for yy in (-0.58, -0.22): zw.rod('chain', (0, yy, 0), (0, yy, -0.07), 0.008, mat('iron'), segs=4)
        bo = zw.bolt('bolt', 0.24, (0, 0, 0), mat('gold'), depth=0.07); zw.turn(bo, z=PI / 2); bo.data.transform(Matrix.Translation((0, -0.4, -0.27)))
    at(b, x, y, z)


# ---------------------------------------------------------------- market stalls
def stall(kind):
    """Market stall, 2.8 x 1.9 m: timber frame, striped awning, a table of goods."""
    col = {'fruit': ('red', 'cream'), 'cloth': ('azure', 'cream'), 'pottery': ('ochre', 'cream'), 'fish': ('olive', 'cream')}[kind]
    for sx in (-1, 1):
        post(sx * 1.25, 0.75, 0, 2.5, 0.09, 'wood_dark'); post(sx * 1.25, -0.75, 0, 2.05, 0.09, 'wood_dark')
        zw.beam('rail', (sx * 1.25, 0.75, 2.45), (sx * 1.25, -0.75, 2.02), 0.07, 0.07, mat('wood_dark'), uv=0.7)
    zw.beam('rail', (-1.3, 0.75, 2.46), (1.3, 0.75, 2.46), 0.07, 0.07, mat('wood_dark'), uv=0.7)
    zw.beam('rail', (-1.3, -0.75, 2.03), (1.3, -0.75, 2.03), 0.07, 0.07, mat('wood_dark'), uv=0.7)
    awning(2.8, 0.9, 2.56, -0.98, 2.04, col)
    table(0, -0.1, 0, 2.3, 1.0, 0.85)
    zw.box('skirt', (2.3, 0.02, 0.5), (0, -0.61, 0.57), mat('cloth_' + col[0]), uv=0.6)
    if kind == 'fruit':
        for i, f in enumerate(('apple', 'orange', 'olive', 'lemon')): crate(-0.85 + i * 0.57, -0.2, 0.85, 0.5, 0.42, 0.16, f)
        crate(-0.5, 0.25, 0.85, 0.5, 0.36, 0.2, 'fig'); crate(0.4, 0.25, 0.85, 0.5, 0.36, 0.2, 'apple')
        crate(1.6, -0.6, 0, 0.55, 0.45, 0.3, 'orange'); barrel(-1.7, -0.5, 0, 0.8)
    elif kind == 'cloth':
        for i, c in enumerate(('red', 'azure', 'ochre', 'olive', 'cream', 'gold', 'red')):
            zw.cylinder('bolt_cloth', 0.09, 0.09, 0.8, (-0.9 + (i % 4) * 0.55 + (0.27 if i > 3 else 0), -0.15, 0.94 + (0.16 if i > 3 else 0)), mat('cloth_' + c), axis='Y', segs=8, uv=0.6)
        for i, c in enumerate(('azure', 'red', 'gold', 'olive')):
            zw.box('hanging', (0.5, 0.03, 1.1), (-0.85 + i * 0.57, 0.72, 1.85), mat('cloth_' + c), uv=0.6)
        zw.box('folded', (0.5, 0.4, 0.14), (0.85, 0.2, 0.92), mat('cloth_cream'), bevel=0.03, segs=1)
    elif kind == 'pottery':
        for i in range(4): pot(-0.85 + i * 0.55, -0.3, 0.85, 0.7 + 0.1 * (i % 2))
        for i in range(3): jug(-0.6 + i * 0.55, 0.15, 0.85, 1.1, 'terracotta' if i % 2 else 'black_glaze')
        amphora(1.65, -0.4, 0, 0.9); amphora(-1.65, -0.3, 0, 0.75); pot(1.7, 0.3, 0, 1.2)
        for i in range(3): zw.cylinder('plate', 0.14, 0.1, 0.03, (0.85, 0.15, 0.865 + i * 0.03), mat('terracotta'), segs=10)
    else:
        for i in range(3): crate(-0.75 + i * 0.75, -0.15, 0.85, 0.65, 0.5, 0.14)
        for i in range(8):
            f = zw.blob('fish', (0.16, 0.05, 0.04), (-0.9 + (i % 4) * 0.5 + rnd.uniform(-0.05, 0.05), -0.25 + (i // 4) * 0.25, 1.02), mat('iron'), 6, 4); zw.turn(f, z=rnd.uniform(-0.5, 0.5))
        barrel(1.7, -0.4, 0, 0.9); zw.cylinder('water', 0.2, 0.2, 0.02, (1.7, -0.4, 0.6), mat('water'), segs=10)


# ---------------------------------------------------------------- shops
def shop_shell(W=5.4, D=4.2, H=3.0, wall='plaster', wood='azure_wood', aw=('red', 'cream'), tile='terracotta', counter_w=2.2, door_u=-1.6):
    f = block('shop', W, D, H, z=0, m=wall, cap='cream' if wall != 'cream' else 'marble')
    door(f['F'], door_u, 0.0, 1.0, 2.15, wood, double=False)
    cu = W / 2 - counter_w / 2 - 0.55
    f['F'].box('opening', (counter_w, 0.05, 1.25), (cu, 0.0, 1.0 + 0.625), 'dark')
    f['F'].box('counter', (counter_w + 0.3, 0.5, 0.09), (cu, 0.2, 0.98), 'wood', 0.015, 0.7)
    for s in (-1, 1): f['F'].box('cjamb', (0.1, 0.1, 1.3), (cu + s * (counter_w / 2 + 0.05), 0.04, 1.63), 'wood_dark', 0.0, 0.7)
    f['F'].box('clintel', (counter_w + 0.3, 0.12, 0.12), (cu, 0.05, 2.3), 'wood_dark', 0.0, 0.7)
    awning(counter_w + 0.7, -D / 2 - 0.02, 2.75, -D / 2 - 1.25, 2.2, aw, cx=cu)
    for s in (-1, 1): zw.rod('strut', (cu + s * (counter_w / 2 + 0.3), -D / 2 - 0.03, 2.1), (cu + s * (counter_w / 2 + 0.3), -D / 2 - 1.22, 2.19), 0.02, mat('wood_dark'), segs=5)
    for s in 'LR': window(f[s], 0, 1.2, 0.7, 0.9, trim='cream' if wall != 'cream' else 'marble', wood=wood)
    window(f['B'], 0, 1.2, 0.7, 0.9, trim='cream' if wall != 'cream' else 'marble', wood=wood)
    gable_roof(W + 0.7, D + 0.8, H, pitch=24, tile=tile, tymp='cream')
    sign(door_u, -D / 2 - 0.05, 2.75, wood)
    return f, cu


def bakery():
    """Bakery: bread on the counter, a domed oven and chimney at the side."""
    f, cu = shop_shell(wall='ochre', wood='olive_wood', aw=('ochre', 'cream'))
    for i in range(5): goods('bread', cu - 0.8 + i * 0.4, -2.3, 1.02, 3, 0.09, 0.1)
    zw.box('oven_base', (1.9, 1.9, 0.8), (3.75, 0.6, 0.4), mat('stone'), bevel=0.04, segs=1, uv=2.6)
    dome(0.9, 0.8, (3.75, 0.6), 'terracotta1', h=0.85, segs=14)
    zw.box('oven_mouth', (0.5, 0.1, 0.45), (3.75, -0.28, 1.05), mat('dark')); zw.box('oven_glow', (0.4, 0.06, 0.2), (3.75, -0.26, 0.95), mat('coal'))
    zw.box('chimney', (0.5, 0.5, 2.2), (3.75, 1.1, 2.3), mat('ochre'), uv=2.6); zw.box('chimney_cap', (0.66, 0.66, 0.1), (3.75, 1.1, 3.45), mat('terracotta0'))
    zw.rod('peel', (2.6, -0.6, 0.02), (2.75, 0.3, 1.5), 0.02, mat('wood'), segs=5); zw.box('peel_head', (0.3, 0.04, 0.34), (2.76, 0.34, 1.62), mat('wood'))
    for x in (-0.2, 0.25): zw.lathe('sack', [(0, 0), (0.2, 0), (0.24, 0.25), (0.14, 0.5), (0.16, 0.56), (0, 0.54)], mat('rope'), centre=(x, -2.5, 0), segs=9, uv=0.4)


def flower_shop():
    """Flower shop: stepped stands of potted flowers and a garland over the door."""
    f, cu = shop_shell(wall='cream', wood='olive_wood', aw=('olive', 'cream'))
    cols = ('cloth_red', 'cloth_gold', 'cloth_cream', 'cloth_red', 'paint_azure')
    for row, (y, z) in enumerate(((-2.75, 0.0), (-2.45, 0.3))):
        zw.box('stand', (2.6, 0.32, 0.3 + z), (cu, y, (0.3 + z) / 2), mat('wood'), uv=0.7)
        for i in range(5):
            x = cu - 1.05 + i * 0.52; pot(x, y, 0.3 + z, 0.7, plant='leaf', seed=i + row * 5)
            for k in range(4): zw.blob('bloom', (0.06, 0.06, 0.05), (x + 0.09 * math.cos(k * 1.7), y + 0.09 * math.sin(k * 1.7), 0.3 + z + 0.42 + 0.03 * k), mat(cols[(i + row) % 5]), 6, 4)
    for i in range(3): pot(cu - 0.7 + i * 0.7, -2.28, 1.02, 0.6, plant='leaf', seed=20 + i)
    for i in range(9):
        a = PI * i / 8
        zw.blob('garland', (0.1, 0.07, 0.08), (-1.6 + 0.75 * math.cos(a), -2.2, 2.3 + 0.28 * math.sin(a) * -1 + 0.3), mat('leaf' if i % 2 else 'cloth_red'), 6, 4)
    pot(-2.4, -2.5, 0, 1.5, plant='leaf_dark', seed=3)


def pottery():
    """Pottery workshop: kiln at the side, a potter's wheel, pots on the counter and the ground."""
    f, cu = shop_shell(wall='plaster', wood='red_wood', aw=('red', 'cream'))
    for i in range(4): pot(cu - 0.75 + i * 0.5, -2.3, 1.02, 0.6 + 0.1 * (i % 2), 'terracotta' if i % 2 else 'black_glaze')
    zw.lathe('kiln', [(1.0, 0), (1.0, 0.9), (0.85, 1.6), (0.45, 2.3), (0.3, 2.5), (0.3, 2.7), (0.2, 2.7)], mat('stone'), centre=(3.9, 0.4, 0), segs=14, uv=1.8)
    zw.box('kiln_mouth', (0.5, 0.12, 0.5), (3.9, -0.6, 0.45), mat('dark')); zw.box('kiln_glow', (0.4, 0.06, 0.22), (3.9, -0.58, 0.32), mat('coal'))
    zw.cylinder('wheel_base', 0.3, 0.34, 0.5, (-2.2, -3.0, 0.25), mat('wood_dark'), segs=10); zw.cylinder('wheel', 0.36, 0.36, 0.06, (-2.2, -3.0, 0.55), mat('stone'), segs=14)
    jug(-2.2, -3.0, 0.58, 1.3); stool(-2.9, -3.1, 0)
    amphora(-0.6, -2.5, 0, 0.9); amphora(-0.15, -2.6, 0, 0.75); pot(0.35, -2.8, 0, 1.3); pot(2.9, -2.6, 0, 1.6)


def scroll_shop():
    """Scroll shop: racks of scrolls behind the counter, azure awning."""
    f, cu = shop_shell(wall='cream', wood='azure_wood', aw=('azure', 'cream'))
    for r in range(3):
        for i in range(9 - r % 2):
            zw.cylinder('scroll', 0.07, 0.07, 0.3, (cu - 0.9 + i * 0.22 + (0.11 if r % 2 else 0), -2.02, 1.5 + r * 0.19), mat('parchment'), axis='Y', segs=7)
    for i in range(3): zw.cylinder('scroll', 0.05, 0.05, 0.5, (cu - 0.5 + i * 0.4, -2.32, 1.075), mat('parchment'), axis='X', segs=7)
    zw.box('open_scroll', (0.5, 0.34, 0.01), (cu + 0.7, -2.32, 1.03), mat('parchment'))
    f['F'].box('shelf', (2.2, 0.3, 0.04), (cu, -0.12, 1.42), 'wood_dark')
    zw.box('bench', (1.4, 0.4, 0.45), (-2.0 + 0.4, -2.75, 0.225), mat('marble'), bevel=0.03, segs=1)


def olive_press():
    """Olive press: a stone crushing basin with its millstone and beam, baskets and oil jars."""
    f, cu = shop_shell(wall='plaster', wood='olive_wood', aw=('olive', 'cream'))
    for i in range(3): jug(cu - 0.6 + i * 0.5, -2.3, 1.02, 1.3)
    c = (4.0, -0.6)
    zw.lathe('basin', [(1.05, 0), (1.05, 0.5), (0.9, 0.55), (0.8, 0.4), (0.25, 0.4), (0.22, 0.75), (0, 0.75)], mat('stone'), centre=(c[0], c[1], 0), segs=16, uv=1.8)
    zw.cylinder('millstone', 0.5, 0.5, 0.22, (c[0] + 0.52, c[1], 0.9), mat('stone'), axis='X', segs=14, uv=1.8)
    zw.rod('axle', (c[0], c[1], 0.9), (c[0] + 1.7, c[1], 0.9), 0.045, mat('wood_dark'), segs=6); zw.rod('pivot', (c[0], c[1], 0.7), (c[0], c[1], 1.25), 0.05, mat('wood_dark'), segs=6)
    goods('olive', c[0] - 0.4, c[1] + 0.2, 0.4, 14, 0.045, 0.4)
    for x, y in ((2.9, -2.2), (3.4, -2.5)):
        zw.lathe('basket', [(0, 0), (0.2, 0), (0.28, 0.3), (0.26, 0.32), (0, 0.28)], mat('rope'), centre=(x, y, 0), segs=10, uv=0.3); goods('olive', x, y, 0.26, 10, 0.045, 0.18)
    amphora(-0.5, -2.5, 0, 0.95); amphora(0.0, -2.6, 0, 0.8); barrel(-2.5, -2.6, 0)


def taverna():
    """Taverna (the café): counter under a striped awning, tables and stools on a terrace, a vine pergola."""
    f, cu = shop_shell(W=6.6, D=4.4, wall='plaster', wood='azure_wood', aw=('red', 'cream'), counter_w=2.6, door_u=-2.2)
    for i in range(3): jug(cu - 0.8 + i * 0.6, -2.4, 1.02, 1.2)
    goods('bread', cu + 0.9, -2.4, 1.02, 4, 0.08, 0.12)
    zw.box('terrace', (6.6, 3.4, 0.08), (0, -4.0, 0.04), mat('paving'), uv=2.0)
    for x in (-1.9, 1.9):
        zw.cylinder('ttop', 0.5, 0.5, 0.05, (x, -4.4, 0.76), mat('wood'), segs=14, uv=0.7); zw.cylinder('tleg', 0.06, 0.1, 0.72, (x, -4.4, 0.4), mat('wood_dark'), segs=8)
        jug(x, -4.4, 0.78, 1.0); 
        for a in (0.4, 2.5, 4.6): stool(x + 0.78 * math.cos(a), -4.4 + 0.78 * math.sin(a), 0.08)
    amphora(-3.0, -2.5, 0, 0.9); amphora(-2.75, -2.75, 0, 0.75); pot(3.0, -5.4, 0.08, 1.5, plant='leaf', seed=5); pot(-3.0, -5.4, 0.08, 1.5, plant='leaf', seed=6)


def forge():
    """Forge: an open-fronted stone smithy with a glowing hearth, anvil, bellows and a quenching barrel."""
    W, D, H = 5.0, 4.0, 2.9
    for s in (-1, 1): zw.box('wall', (0.45, D, H), (s * (W / 2 - 0.22), 0, H / 2), mat('stone'), uv=3.4)
    zw.box('wall', (W, 0.45, H), (0, D / 2 - 0.22, H / 2), mat('stone'), uv=3.4)
    for s in (-1, 1): post(s * (W / 2 - 0.22), -D / 2 + 0.1, 0, H, 0.2, 'wood_dark')
    zw.beam('lintel', (-W / 2, -D / 2 + 0.1, H - 0.1), (W / 2, -D / 2 + 0.1, H - 0.1), 0.2, 0.2, mat('wood_dark'), uv=0.7)
    gable_roof(W + 0.7, D + 0.8, H, pitch=24, tile='slate', tymp='stone_dark', bolt=True)
    zw.box('hearth', (1.6, 1.1, 0.9), (-1.2, 1.0, 0.45), mat('stone_dark'), bevel=0.03, segs=1, uv=2.6)
    fire(-1.2, 1.0, 0.9, 0.32)
    zw.prism('hood', [(-0.9, 1.9), (0.9, 1.9), (0.3, 2.9), (-0.3, 2.9)], 1.0, mat('stone_dark'), axis='Y', centre=(-1.2, 1.15, 0), uv=2.6)
    zw.box('flue', (0.6, 0.6, 1.9), (-1.2, 1.3, 3.6), mat('stone'), uv=3.4); zw.box('flue_cap', (0.8, 0.8, 0.1), (-1.2, 1.3, 4.6), mat('stone_dark'))
    zw.cylinder('stump', 0.3, 0.34, 0.55, (0.6, -0.4, 0.275), mat('wood'), segs=10, uv=0.7)
    zw.box('anvil', (0.6, 0.2, 0.16), (0.6, -0.4, 0.75), mat('iron'), bevel=0.02, segs=1); zw.box('anvil_waist', (0.3, 0.14, 0.14), (0.6, -0.4, 0.62), mat('iron'))
    zw.cylinder('horn', 0.02, 0.08, 0.3, (0.98, -0.4, 0.76), mat('iron'), axis='X', segs=8)
    zw.rod('hammer', (0.45, -0.45, 0.85), (0.75, -0.3, 0.87), 0.018, mat('wood'), segs=5); zw.box('hammer_head', (0.07, 0.14, 0.07), (0.76, -0.3, 0.87), mat('iron'))
    zw.prism('bellows', [(0, 0.95), (0.9, 1.05), (0.9, 1.35), (0, 1.1)], 0.5, mat('wood_dark'), axis='Y', centre=(-0.3, 1.0, 0)); 
    barrel(1.7, 0.9, 0, 1.0); zw.cylinder('water', 0.22, 0.22, 0.02, (1.7, 0.9, 0.66), mat('water'), segs=10)
    for i in range(4): zw.rod('tool', (1.2 + i * 0.22, 1.72, 1.0), (1.2 + i * 0.22, 1.72, 1.9), 0.015, mat('iron'), segs=4)
    zw.box('rack', (1.1, 0.05, 0.08), (1.53, 1.74, 1.8), mat('wood_dark'))
    sign(-2.6, -D / 2 + 0.1, 2.5, 'red_wood')


# ---------------------------------------------------------------- homes
def cottage(tier):
    """Starter cottage, 6.8 x 4.8 m. Tier 1 is bare and simple; tier 2 adds shutters, a porch and planters."""
    W, D, H = 6.6, 4.6, 2.7
    f = block('cottage', W, D, H, m='plaster', wob=0.02 if tier == 1 else 0.012, cap=None)
    wood = 'wood_dark' if tier == 1 else 'azure_wood'
    door(f['F'], 0, 0.0, 1.0, 2.1, wood, trim='cream', double=False)
    for u in (-2.1, 2.1): window(f['F'], u, 1.15, 0.7, 0.8, trim='cream', wood=wood, shutters=tier > 1)
    for s in 'LR': window(f[s], 0, 1.15, 0.7, 0.8, trim='cream', wood=wood, shutters=tier > 1)
    gable_roof(W + 0.7, D + 0.8, H, pitch=24, tymp='plaster', trim='cream')
    zw.box('chimney', (0.5, 0.5, 1.5), (2.2, 0.9, H + 1.1), mat('plaster'), uv=2.6); zw.box('chimney_cap', (0.64, 0.64, 0.1), (2.2, 0.9, H + 1.9), mat('terracotta0'))
    zw.box('doorstep', (1.6, 0.6, 0.14), (0, -D / 2 - 0.3, 0.07), mat('stone'), bevel=0.03, segs=1)
    pot(-0.95, -D / 2 - 0.35, 0, 1.2, plant='leaf', seed=1)
    if tier > 1:
        for s in (-1, 1): post(s * 1.3, -D / 2 - 1.3, 0, 2.2, 0.12, 'wood_dark')
        zw.beam('porch_beam', (-1.5, -D / 2 - 1.3, 2.2), (1.5, -D / 2 - 1.3, 2.2), 0.12, 0.12, mat('wood_dark'), uv=0.7)
        shed_roof(3.2, 1.6, 2.75, 2.25, c=(0, -D / 2 - 0.75), k=0.8)
        pot(0.95, -D / 2 - 0.35, 0, 1.2, plant='leaf', seed=2)
        zw.box('planter', (1.5, 0.3, 0.3), (-2.1, -D / 2 - 0.25, 0.15), mat('wood'), uv=0.7); shrub(-2.1, -D / 2 - 0.25, 0.25, 0.3, 'leaf', 4, 5)
        zw.box('bench', (1.3, 0.36, 0.42), (2.1, -D / 2 - 0.3, 0.21), mat('wood'), bevel=0.02, segs=1, uv=0.7)


def insula(tier):
    """Apartment block (insula), 10 x 8 m. Tier 1 two floors of plaster; tier 2 three floors, ochre, balconies;
    tier 3 three floors of marble with gold trim. Shops with awnings on the ground floor."""
    W, D, FH = 10.0, 8.0, 3.0; floors = 2 if tier == 1 else 3
    wall = ('plaster', 'ochre', 'hall')[tier - 1]; wood = ('wood_dark', 'olive_wood', 'azure_wood')[tier - 1]
    trim = 'cream' if tier < 3 else 'marble'
    for k in range(floors):
        f = block('floor', W - k * 0.0, D, FH, z=k * FH, m=wall, wob=0.008, plinth='stone_dark' if k == 0 else None, cap=None)
        zw.box('string', (W + 0.16, D + 0.16, 0.14), (0, 0, (k + 1) * FH - 0.07), mat('gold' if tier == 3 and k == floors - 1 else trim), bevel=0.02, segs=1, uv=1.2)
        if k == 0:
            door(f['F'], 0, 0.0, 1.3, 2.3, wood, trim=trim)
            for s in (-1, 1):
                u = s * 3.1
                f['F'].box('opening', (2.2, 0.05, 1.3), (u, 0.0, 1.65), 'dark'); f['F'].box('counter', (2.5, 0.45, 0.09), (u, 0.18, 0.98), 'wood', 0.015, 0.7)
                awning(2.8, -D / 2 - 0.02, 2.75, -D / 2 - 1.2, 2.2, (('red', 'cream'), ('azure', 'cream'))[s > 0], cx=u)
            for u in (-2.6, 0, 2.6): window(f['B'], u, 1.2, 0.8, 1.0, trim=trim, wood=wood)
        else:
            for u in (-3.4, -1.15, 1.15, 3.4): window(f['F'], u, k * FH + 1.0, 0.8, 1.1, trim=trim, wood=wood); window(f['B'], u, k * FH + 1.0, 0.8, 1.1, trim=trim, wood=wood)
            if tier > 1 and k == 1:
                f['F'].box('balcony', (5.2, 0.9, 0.12), (0, 0.45, k * FH + 0.06), trim, 0.02)
                for i in range(11): f['F'].box('baluster', (0.06, 0.06, 0.8), (-2.5 + i * 0.5, 0.82, k * FH + 0.5), 'gold' if tier == 3 else wood)
                f['F'].box('rail', (5.2, 0.08, 0.07), (0, 0.82, k * FH + 0.92), 'gold' if tier == 3 else wood)
                for s in (-1, 1): f['F'].box('bracket', (0.14, 0.7, 0.3), (s * 2.3, 0.35, k * FH - 0.15), trim)
        for s in 'LR':
            for u in (-2.2, 0, 2.2): window(f[s], u, k * FH + 1.0, 0.8, 1.1, trim=trim, wood=wood)
    gable_roof(W + 0.8, D + 0.9, floors * FH, pitch=22, k=1.2, tile='terracotta' if tier < 3 else 'azure', tymp=trim, finial='gold' if tier == 3 else None)
    for i, c in enumerate(('red', 'azure')): banner((-1.15, 1.15)[i], -D / 2 - 0.05, floors * FH - 0.4, 1.4, 0.55, c) if tier > 1 else None


def upper_storey(style):
    """Second-storey module for the villa: stacks on the wall body (place it at y = 3.0 m), 6.4 x 4.4 x 3.0 m."""
    wall, wood, trim = (('plaster', 'azure_wood', 'cream'), ('hall', 'azure_wood', 'marble'))[style == 'marble']
    f = block('upper', 6.2, 4.2, 3.0, m=wall, wob=0.008, plinth=None, cap='marble')
    zw.box('string', (6.4, 4.4, 0.16), (0, 0, 0.08), mat(trim), bevel=0.02, segs=1, uv=1.2)
    for u in (-2.0, 2.0): window(f['F'], u, 1.0, 0.8, 1.1, trim=trim, wood=wood); window(f['B'], u, 1.0, 0.8, 1.1, trim=trim, wood=wood)
    for s in 'LR': window(f[s], 0, 1.0, 0.8, 1.1, trim=trim, wood=wood)
    door(f['F'], 0, 0.16, 1.0, 2.1, wood, trim=trim)
    f['F'].box('balcony', (2.6, 0.8, 0.12), (0, 0.4, 0.1), trim, 0.02)
    for i in range(6): f['F'].box('baluster', (0.06, 0.06, 0.8), (-1.25 + i * 0.5, 0.74, 0.56), 'gold' if style == 'marble' else wood)
    f['F'].box('rail', (2.6, 0.08, 0.07), (0, 0.74, 0.98), 'gold' if style == 'marble' else wood)


def roof_garden():
    """Flat roof with a garden for the villa (place it at the wall top): parapet, planters, a small pergola."""
    zw.box('roofslab', (6.9, 4.9, 0.2), (0, 0, 0.1), mat('cream'), bevel=0.02, segs=1, uv=2.6)
    zw.box('deck', (6.2, 4.2, 0.03), (0, 0, 0.215), mat('paving'), uv=2.0)
    for s in (-1, 1):
        zw.box('parapet', (6.9, 0.25, 0.7), (0, s * 2.32, 0.55), mat('cream'), uv=2.6); zw.box('parapet', (0.25, 4.4, 0.7), (s * 3.32, 0, 0.55), mat('cream'), uv=2.6)
        zw.box('coping', (7.0, 0.35, 0.08), (0, s * 2.32, 0.94), mat('terracotta0')); zw.box('coping', (0.35, 4.9, 0.08), (s * 3.32, 0, 0.94), mat('terracotta0'))
        zw.box('planter', (2.2, 0.5, 0.45), (s * 1.8, 1.75, 0.44), mat('terracotta'), bevel=0.03, segs=1); shrub(s * 1.8 - 0.6, 1.75, 0.6, 0.3, 'leaf', s + 3); shrub(s * 1.8 + 0.5, 1.75, 0.6, 0.34, 'leaf_dark', s + 6)
    at(lambda: pergola_shape(3.0, 2.2, 2.1), -1.2, -0.6, 0.22)
    table(-1.2, -0.6, 0.22, 1.2, 0.7); stool(-1.2, -1.25, 0.22); stool(-1.2, 0.05, 0.22)
    pot(2.6, -1.5, 0.22, 1.5, plant='leaf', seed=9); pot(2.0, -1.7, 0.22, 1.0, plant='leaf_dark', seed=8)


def grand_villa():
    """Grand villa (tier 4 home): two-storey marble main block, two wings round a colonnaded court. 14 x 12 m."""
    f = block('main', 13.0, 5.0, 3.2, c=(0, 3.0), m='hall', wob=0.006, plinth='marble')
    f2 = block('main2', 13.0, 5.0, 3.0, c=(0, 3.0), z=3.2, m='hall', wob=0.006, plinth=None)
    zw.box('string', (13.2, 5.2, 0.16), (0, 3.0, 3.2), mat('gold'), bevel=0.02, segs=1)
    for u in (-5, -3, -1, 1, 3, 5): window(f2['F'], u, 4.2, 0.8, 1.2); window(f2['B'], u, 4.2, 0.8, 1.2); window(f['B'], u, 1.1, 0.8, 1.2)
    for s in 'LR': window(f2[s], 0, 4.2, 0.8, 1.2); window(f[s], 1.2, 1.1, 0.8, 1.2)
    door(f['F'], 0, 0.0, 1.8, 2.7, 'azure_wood', metal='gold')
    for u in (-2.6, 2.6): window(f['F'], u, 1.1, 0.8, 1.2)
    entablature(13.0, 5.0, 6.2, 0.5, accent='gold', c=(0, 3.0), tri=None)
    gable_roof(13.8, 6.0, 6.7, c=(0, 3.0), pitch=22, k=1.3, tile='azure', tymp='paint_azure', finial='gold')
    for s in (-1, 1):
        w = block('wing', 3.6, 6.4, 3.0, c=(s * 4.7, -2.6), m='hall', wob=0.006, plinth='marble')
        for u in (-1.6, 1.6): window(w['L' if s < 0 else 'R'], u, 1.1, 0.8, 1.1)
        window(w['F'], 0, 1.1, 0.8, 1.1)
        gable_roof(7.2, 4.4, 3.0, c=(s * 4.7, -2.6), axis='Y', pitch=22, tile='azure', tymp='paint_azure', finial='gold')
    zw.box('court', (5.8, 6.4, 0.1), (0, -2.6, 0.05), mat('paving'), uv=2.0)
    for i in range(4): ionic(-2.4 + i * 1.6, -5.4, 0.1, 2.9, 0.2)
    entablature(5.8, 0.8, 3.0, 0.4, accent='gold', c=(0, -5.4), tri=None, t=0.4)
    steps(6.2, 0.6, 2, c=(0, -6.1), three_sided=False)
    at(lambda: pool_small(), 0, -2.4)
    for s in (-1, 1): pot(s * 2.4, -4.6, 0.1, 1.6, plant='leaf', seed=s + 4); banner(s * 1.6, 0.45, 2.9, 1.5, 0.6, 'azure')


def pool_small():
    zw.box('rim', (3.2, 2.0, 0.3), (0, 0, 0.25), mat('step'), bevel=0.03, segs=1); zw.box('water', (2.7, 1.5, 0.03), (0, 0, 0.405), mat('water'))
    zw.lathe('jet', [(0.12, 0.4), (0.08, 0.8), (0.22, 0.9), (0, 0.92)], mat('gold'), segs=8)


# ---------------------------------------------------------------- garden and street furniture
def pergola_shape(w=4.0, d=3.0, h=2.4, vines=True):
    for sx in (-1, 1):
        for y in (-d / 2, 0, d / 2) if d > 2.5 else (-d / 2, d / 2): post(sx * w / 2, y, 0, h, 0.12, 'wood_dark')
        zw.beam('beam', (sx * w / 2, -d / 2 - 0.3, h + 0.06), (sx * w / 2, d / 2 + 0.3, h + 0.06), 0.1, 0.14, mat('wood_dark'), uv=0.7)
    n = max(4, int(d / 0.45))
    for i in range(n):
        y = -d / 2 + (i + 0.5) * d / n
        zw.beam('rafter', (-w / 2 - 0.35, y, h + 0.17), (w / 2 + 0.35, y, h + 0.17), 0.07, 0.09, mat('wood'), uv=0.7)
    if vines:
        r = random.Random(int(w * 10 + d))
        for i in range(int(w * d * 2.2)):
            x, y = r.uniform(-w / 2 - 0.2, w / 2 + 0.2), r.uniform(-d / 2 - 0.2, d / 2 + 0.2)
            o = zw.blob('vine', (r.uniform(0.2, 0.34), r.uniform(0.2, 0.34), 0.1), (x, y, h + 0.26 + r.uniform(0, 0.06)), mat('leaf' if i % 3 else 'leaf_dark'), 6, 4); zw.wobble(o, 0.04, 8.0, i)
        for sx in (-1, 1):
            for k in range(6):
                o = zw.blob('vine', (0.16, 0.16, 0.2), (sx * w / 2 + r.uniform(-0.06, 0.06), -d / 2 + r.uniform(-0.06, 0.06), 0.3 + k * 0.38), mat('leaf'), 6, 4); zw.wobble(o, 0.04, 8.0, k)
        for i in range(5): goods('fig', r.uniform(-w / 2, w / 2), r.uniform(-d / 2, d / 2), h - 0.12, 5, 0.035, 0.07)


def pergola():
    """Pergola with vines, 4.7 x 3.6 m."""
    pergola_shape()


def dining_set():
    """Outdoor dining set: timber table, four stools, a jug, cups and bread."""
    table(0, 0, 0, 1.7, 0.85)
    for x, y in ((-0.5, -0.75), (0.5, -0.75), (-0.5, 0.75), (0.5, 0.75)): stool(x, y, 0)
    jug(0, 0, 0.75, 1.3); goods('bread', 0.45, 0.05, 0.75, 3, 0.08, 0.1); goods('fig', -0.45, -0.1, 0.75, 6, 0.035, 0.08)
    for x, y in ((-0.5, -0.25), (0.5, -0.25), (-0.5, 0.25), (0.5, 0.25)): zw.cylinder('cup', 0.035, 0.045, 0.08, (x, y, 0.79), mat('terracotta'), segs=8)
    zw.cylinder('bowl', 0.12, 0.16, 0.06, (-0.45, -0.1, 0.78), mat('terracotta'), segs=10)


def planter():
    """Stone planter, 2 m, with shrubs and flowers."""
    zw.box('planter', (2.0, 0.7, 0.5), (0, 0, 0.25), mat('step'), bevel=0.04, segs=1, uv=1.0)
    zw.box('earth', (1.8, 0.5, 0.04), (0, 0, 0.5), mat('earth'))
    for i, x in enumerate((-0.65, 0, 0.65)): shrub(x, 0, 0.45, 0.3, 'leaf', i + 1, 5)
    for i in range(8): zw.blob('bloom', (0.06, 0.06, 0.05), (-0.8 + i * 0.23, (-0.2, 0.2)[i % 2], 0.6), mat(('cloth_red', 'cloth_gold', 'cloth_cream')[i % 3]), 6, 4)


def garden_bed():
    """Kitchen garden bed, 2.4 x 1.6 m: timber edging, rows of herbs and greens."""
    for s in (-1, 1):
        zw.box('edge', (2.4, 0.08, 0.22), (0, s * 0.8, 0.11), mat('wood'), uv=0.7); zw.box('edge', (0.08, 1.6, 0.22), (s * 1.2, 0, 0.11), mat('wood'), uv=0.7)
    zw.box('earth', (2.3, 1.5, 0.16), (0, 0, 0.08), mat('earth'), uv=0.6)
    for r in range(4):
        for i in range(7):
            o = zw.blob('plant', (0.13, 0.13, 0.1 + 0.05 * (r % 2)), (-0.95 + i * 0.32, -0.55 + r * 0.37, 0.2 + 0.03 * (r % 2)), mat('leaf' if r % 2 else 'leaf_dark'), 6, 4); zw.wobble(o, 0.03, 9.0, r * 7 + i)
    for i in range(4): zw.blob('fruit', (0.05, 0.05, 0.05), (-0.8 + i * 0.5, -0.18, 0.27), mat('cloth_red'), 6, 4)


def statue_plinth():
    """Plinth for a statue: marble pedestal with a bronze plaque (the figure itself is a generated model)."""
    steps(1.3, 1.3, 2, rise=0.12, tread=0.2)
    zw.box('pedestal', (1.1, 1.1, 1.0), (0, 0, 0.74), mat('marble'), bevel=0.03, segs=1, uv=1.2)
    zw.box('pedcap', (1.3, 1.3, 0.14), (0, 0, 1.31), mat('step'), bevel=0.03, segs=1); zw.box('plaque', (0.75, 0.04, 0.5), (0, -0.56, 0.78), mat('bronze'))
    zw.box('fillet', (1.12, 1.12, 0.07), (0, 0, 1.18), mat('gold'))


def cart():
    """Hand cart loaded with amphorae and sacks."""
    zw.box('bed', (1.6, 0.9, 0.08), (0, 0, 0.62), mat('wood'), uv=0.7)
    for s in (-1, 1):
        zw.box('side', (1.6, 0.05, 0.3), (0, s * 0.45, 0.8), mat('wood'), uv=0.7)
        zw.cylinder('wheel', 0.5, 0.5, 0.07, (0.1, s * 0.56, 0.5), mat('wood_dark'), axis='Y', segs=14, uv=0.7); zw.cylinder('hub', 0.09, 0.09, 0.12, (0.1, s * 0.58, 0.5), mat('iron'), axis='Y', segs=8)
        zw.rod('shaft', (0.8, s * 0.4, 0.62), (1.9, s * 0.4, 0.85), 0.03, mat('wood_dark'), segs=6)
    zw.box('end', (0.05, 0.9, 0.3), (-0.8, 0, 0.8), mat('wood'), uv=0.7); zw.rod('handle', (1.9, -0.4, 0.85), (1.9, 0.4, 0.85), 0.03, mat('wood_dark'), segs=6)
    zw.rod('prop', (-0.6, 0, 0.6), (-0.7, 0, 0.0), 0.03, mat('wood_dark'), segs=5)
    amphora(-0.4, -0.15, 0.66, 0.75); amphora(0.0, 0.15, 0.66, 0.7); amphora(-0.45, 0.2, 0.66, 0.6)
    zw.lathe('sack', [(0, 0), (0.2, 0), (0.24, 0.22), (0.14, 0.42), (0, 0.44)], mat('rope'), centre=(0.45, -0.1, 0.66), segs=9, uv=0.4)


def barrels():
    barrel(0, 0, 0); barrel(0.62, 0.1, 0); barrel(0.3, 0.55, 0, 0.9); barrel(0.3, 0.2, 0.7, 0.85); amphora(-0.5, 0.45, 0, 0.8)


BUILD = {
    'stall_fruit': lambda: stall('fruit'), 'stall_cloth': lambda: stall('cloth'), 'stall_pottery': lambda: stall('pottery'), 'stall_fish': lambda: stall('fish'),
    'bakery': bakery, 'flower_shop': flower_shop, 'pottery': pottery, 'scroll_shop': scroll_shop, 'olive_press': olive_press, 'taverna': taverna, 'forge': forge,
    'cottage1': lambda: cottage(1), 'cottage2': lambda: cottage(2), 'insula1': lambda: insula(1), 'insula2': lambda: insula(2), 'insula3': lambda: insula(3),
    'upper_plaster': lambda: upper_storey('plaster'), 'upper_marble': lambda: upper_storey('marble'), 'roof_garden': roof_garden, 'grand_villa': grand_villa,
    'pergola': pergola, 'dining_set': dining_set, 'planter': planter, 'garden_bed': garden_bed, 'statue_plinth': statue_plinth, 'cart': cart, 'barrels': barrels,
    'brazier': lambda: brazier(0, 0, 0),
}
BUILD[ITEM]()
BIG = ('insula1', 'insula2', 'insula3', 'grand_villa', 'cottage1', 'cottage2', 'bakery', 'flower_shop', 'pottery', 'scroll_shop', 'olive_press', 'taverna', 'forge', 'upper_plaster', 'upper_marble', 'roof_garden')
finish(OUT, dist=0.8 if ITEM in BIG else 0.35, keep=('floor', 'shop', 'main', 'main2', 'wing', 'string', 'court', 'terrace', 'roofslab', 'upper', 'cottage', 'wall', 'parapet', 'coping'))
