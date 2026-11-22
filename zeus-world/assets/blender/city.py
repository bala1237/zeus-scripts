# Civic buildings, city walls, monuments and the water kit, all scripted.   python city.py <item> out.glb
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh, zw
zw.reset()
from parts import *

ITEM, OUT = sys.argv[-2], sys.argv[-1]
rnd = random.Random(11)
PI = math.pi


def slab(name, pts, z0, z1, m, uv=1.0):
    """Extrude a flat outline (x, y) upwards."""
    bm = bmesh.new()
    lo = [bm.verts.new((x, y, z0)) for x, y in pts]; hi = [bm.verts.new((x, y, z1)) for x, y in pts]; n = len(pts)
    bm.faces.new(lo[::-1]); bm.faces.new(hi)
    for i in range(n): bm.faces.new([lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    o = zw.obj_from_bm(name, bm, mat(m)); zw.box_uv(o, uv); return o


def rock(x, y, z, w, d, h, m='stone', seed=0, rz=0.0):
    o = zw.box('rock', (w, d, h), (x, y, z + h / 2 - 0.03), mat(m), bevel=min(w, d, h) * 0.32, segs=2, uv=1.8)
    zw.turn(o, z=rz); zw.wobble(o, min(w, d, h) * 0.12, 4.0, seed); zw.box_uv(o, 1.8)


# ---------------------------------------------------------------- civic buildings
def stoa():
    """Stoa: a long covered colonnade for the agora, 16 x 5.6 m. Shops and shade behind a row of columns."""
    L, D, H, Z = 16.0, 5.0, 3.6, 0.3
    steps(L + 0.3, D + 0.3, 2)
    f = block('wall', L, 0.5, H, c=(0, D / 2 - 0.25), z=Z, m='cream')['F']
    for s in (-1, 1): zw.box('endwall', (0.5, D * 0.55, H), (s * (L / 2 - 0.25), D / 2 - D * 0.275, Z + H / 2), mat('cream'), uv=2.6)
    n = 9
    for i in range(n): doric((i - (n - 1) / 2) * (L - 0.9) / (n - 1), -D / 2 + 0.4, Z, H, 0.25)
    for u in (-5.2, 0, 5.2): door(f, u, Z, 1.3, 2.3, 'red_wood')
    for u in (-2.6, 2.6): window(f, u, Z + 1.2, 0.9, 1.0, wood='red_wood')
    entablature(L, D, Z + H, 0.55, accent='paint_red')
    gable_roof(L + 0.7, D + 1.0, Z + H + 0.55, pitch=20, k=1.2, tymp='paint_azure', finial='terracotta')
    for u in (-6.5, 6.5): banner(u, -D / 2 + 0.1, Z + H - 0.2, 1.5, 0.6, 'azure')


def fountain():
    """Plaza fountain: round marble basin, two bowls, gold bolt."""
    zw.lathe('basin', [(2.45, 0), (2.45, 0.14), (2.3, 0.18), (2.3, 0.52), (2.4, 0.58), (2.4, 0.66), (2.08, 0.66), (2.08, 0.25), (0, 0.25)], mat('step'), segs=28, uv=1.0)
    zw.cylinder('water', 2.08, 2.08, 0.03, (0, 0, 0.55), mat('water'), segs=28)
    zw.lathe('stem', [(0.5, 0.25), (0.5, 0.4), (0.3, 0.55), (0.22, 1.1), (0.34, 1.3), (1.0, 1.5), (1.05, 1.62), (0.9, 1.62), (0.3, 1.45), (0, 1.45)], mat('marble'), segs=20, uv=1.0)
    zw.cylinder('water', 0.9, 0.9, 0.03, (0, 0, 1.585), mat('water'), segs=20)
    zw.lathe('top', [(0.16, 1.45), (0.13, 2.0), (0.2, 2.12), (0.5, 2.25), (0.52, 2.33), (0.42, 2.33), (0.1, 2.22), (0, 2.22)], mat('marble'), segs=16, uv=1.0)
    zw.cylinder('water', 0.42, 0.42, 0.03, (0, 0, 2.30), mat('water'), segs=16)
    zw.lathe('finial', [(0.07, 2.22), (0.05, 2.5), (0.1, 2.56), (0, 2.62)], mat('gold'), segs=8)
    zw.bolt('bolt', 0.5, (0, 0, 2.86), mat('gold'), depth=0.04)
    for i in range(4):
        a = i * PI / 2 + PI / 4
        zw.blob('spout', (0.12, 0.12, 0.1), (1.0 * math.cos(a), 1.0 * math.sin(a), 1.52), mat('gold'), 8, 5)


def tholos():
    """Round shrine: ring of columns, drum, conical tiled roof."""
    R, Z, H = 3.0, 0.45, 3.4
    zw.lathe('steps', [(R + 0.9, 0), (R + 0.9, 0.15), (R + 0.6, 0.15), (R + 0.6, 0.3), (R + 0.3, 0.3), (R + 0.3, 0.45), (0, 0.45)], mat('step'), segs=32, uv=1.0)
    for i in range(12):
        a = i * PI / 6 + PI / 12; doric((R - 0.25) * math.cos(a), (R - 0.25) * math.sin(a), Z, H, 0.21, segs=16, flutes=8)
    zw.lathe('drum', [(1.75, Z), (1.75, Z + H)], mat('hall'), segs=24, uv=2.4)
    door(Face(0, 0, 3.5, 3.5, 'F'), 0, Z, 1.1, 2.4, 'azure_wood', metal='gold')
    zw.lathe('ent', [(R - 0.55, Z + H), (R + 0.05, Z + H), (R + 0.05, Z + H + 0.26), (R - 0.55, Z + H + 0.26)], mat('marble'), segs=32, uv=1.2)
    zw.lathe('fillet', [(R + 0.08, Z + H + 0.26), (R + 0.08, Z + H + 0.34)], mat('paint_red'), segs=32)
    zw.lathe('cornice', [(R - 0.5, Z + H + 0.34), (R + 0.3, Z + H + 0.34), (R + 0.36, Z + H + 0.5), (R - 0.5, Z + H + 0.5)], mat('marble'), segs=32, uv=1.2)
    zr = Z + H + 0.5
    zw.lathe('roof', [(R + 0.45, zr), (R + 0.45, zr + 0.06), (R * 0.55, zr + 0.95), (0.25, zr + 1.75), (0, zr + 1.8)], mat('terracotta0'), segs=32, uv=1.0)
    for i in range(24):
        a = i * PI / 12
        zw.rod('rib', ((R + 0.45) * math.cos(a), (R + 0.45) * math.sin(a), zr + 0.1), (0.3 * math.cos(a), 0.3 * math.sin(a), zr + 1.78), 0.07, mat('terracotta1'), segs=5, r2=0.04)
    zw.lathe('finial', [(0.3, zr + 1.7), (0.34, zr + 1.85), (0.14, zr + 2.0), (0.22, zr + 2.2), (0, zr + 2.45)], mat('gold'), segs=10)
    zw.bolt('bolt', 0.6, (0, 0, zr + 2.75), mat('gold'), depth=0.05)


def amphitheatre():
    """Theatre: half ring of stone seating round a sand floor, with a stage building. About 31 x 25 m."""
    N, R0, TW, TH = 9, 7.0, 0.85, 0.42
    for k in range(N):
        ring_segment('tier', R0 + k * TW, R0 + (k + 1) * TW + 0.02, 0, (k + 1) * TH, 0, PI, 'step', n=22, uv=1.0)
        for a in (PI / 4, PI / 2, 3 * PI / 4):
            ring_segment('aisle', R0 + k * TW - 0.01, R0 + (k + 0.5) * TW, (k + 0.5) * TH, (k + 0.5) * TH + 0.0 + TH * 0.02 + 0.2 * 0, a - 0.045, a + 0.045, 'stone', n=2)
            ring_segment('aisle', R0 + k * TW - 0.01, R0 + (k + 1) * TW + 0.03, 0, (k + 1) * TH + 0.012, a - 0.045, a + 0.045, 'paving', n=2)
    RO = R0 + N * TW
    ring_segment('backwall', RO, RO + 0.6, 0, N * TH + 1.0, 0, PI, 'stone', n=24, uv=2.6)
    ring_segment('backcap', RO - 0.05, RO + 0.7, N * TH + 1.0, N * TH + 1.14, 0, PI, 'marble', n=24, uv=1.2)
    for s in (-1, 1): zw.box('endwall', (N * TW + 0.6, 0.6, N * TH + 1.0), (s * (R0 + (N * TW + 0.6) / 2), -0.3, (N * TH + 1.0) / 2), mat('stone'), uv=2.6)
    zw.cylinder('floor', R0 - 0.1, R0 - 0.1, 0.05, (0, 0, 0.025), mat('sand'), segs=32, uv=1.5)
    ring_segment('kerb', R0 - 0.2, R0 + 0.02, 0, 0.1, 0, PI, 'marble', n=22)
    zw.cylinder('altar', 0.45, 0.5, 0.8, (0, 0, 0.4), mat('marble'), segs=14)
    for i in range(7):
        a = PI * (i + 0.5) / 7
        zw.rod('pole', (RO * math.cos(a) + 0.3 * math.cos(a), (RO + 0.3) * math.sin(a), N * TH + 1.1), ((RO + 0.3) * math.cos(a), (RO + 0.3) * math.sin(a), N * TH + 3.6), 0.05, mat('wood_dark'), segs=6)
        at(lambda: banner(0, 0, 0, 1.3, 0.55, ('red', 'azure')[i % 2]), (RO + 0.3) * math.cos(a) * 0.985, (RO + 0.3) * math.sin(a) * 0.985, N * TH + 3.45, a - PI / 2)
    # stage building facing the seats
    SW, SD, SH, SY = 15.0, 2.6, 3.4, -5.6
    zw.box('stage', (SW, 2.6, 0.6), (0, SY + 2.5, 0.3), mat('wood'), bevel=0.02, segs=1, uv=0.7)
    f = block('skene', SW, SD, SH, c=(0, SY), m='cream')
    for u in (-4.5, 0, 4.5): door(f['B'], u, 0.6, 1.3, 2.3, 'red_wood')
    for u in (-5.6, -1.9, 1.9, 5.6): window(f['F'], u, 1.3, 0.8, 1.0, wood='red_wood')
    for i in range(6): doric((i - 2.5) * 2.6, SY + SD / 2 + 0.5, 0.6, SH - 0.6, 0.2, segs=16, flutes=8)
    entablature(SW, SD + 1.4, SH, 0.5, accent='paint_azure', c=(0, SY + 0.35), tri=None)
    gable_roof(SW + 0.6, SD + 2.2, SH + 0.5, c=(0, SY + 0.35), pitch=20, k=1.2, tymp='paint_azure', finial='terracotta')


def civic_hall(w, l, h, ncol, order, accent, tymp, wallm, wood, tile='terracotta', finial='gold', banners=('red', 'azure')):
    Z = 0.75
    zw.box('podium', (w + 1.2, l + 1.2, Z - 0.1), (0, 0, (Z - 0.1) / 2), mat('stone'), uv=2.6)
    zw.box('cap', (w + 1.4, l + 1.4, 0.12), (0, 0, Z - 0.06), mat('step'), bevel=0.02, segs=1)
    for i in range(5): zw.box('steps', (w * 0.62, 0.34 * (5 - i), Z / 5), (0, -l / 2 - 0.6 - 0.17 * (5 - i), (i + 0.5) * Z / 5), mat('step'), bevel=0.015, segs=1)
    PD = 2.6
    f = block('hall', w - 0.9, l - PD - 0.5, h, c=(0, PD / 2), z=Z, m=wallm, wob=0.004, plinth='marble')
    for i in range(ncol):
        x = (i - (ncol - 1) / 2) * (w - 0.9) / (ncol - 1)
        (doric if order == 'doric' else ionic)(x, -l / 2 + 0.5, Z, h, 0.30 if order == 'doric' else 0.24)
    door(f['F'], 0, Z, 1.9, 3.2, wood, metal='gold')
    nw = max(2, int((l - PD) / 2.6))
    for s in 'LR':
        for i in range(nw): window(f[s], (i - (nw - 1) / 2) * (l - PD - 0.5) / nw, Z + 1.5, 0.9, 1.5, wood=wood, shutters=False)
    entablature(w, l, Z + h, 0.7, accent=accent)
    gable_roof(l + 0.9, w + 0.9, Z + h + 0.7, pitch=20, axis='Y', k=1.4, tymp=tymp, finial=finial, tile=tile)
    for i, s in enumerate((-1, 1)): banner(s * 1.9, -l / 2 + PD + 0.2, Z + h - 0.5, 2.0, 0.7, banners[i])
    for s in (-1, 1): brazier(s * (w * 0.31 + 0.9), -l / 2 - 1.3, 0.0, 0.9)


def library():
    """Library: Ionic porch, azure trim. 10.4 x 15 m."""
    civic_hall(9.0, 13.0, 4.6, 4, 'ionic', 'paint_azure', 'paint_azure', 'hall', 'azure_wood', banners=('azure', 'azure'))


def council_hall():
    """Council hall: six Doric columns, red trim. 12.4 x 13 m."""
    civic_hall(11.0, 11.0, 5.0, 6, 'doric', 'paint_red', 'paint_red', 'cream', 'red_wood', banners=('red', 'red'))


def bathhouse():
    """Bathhouse: ochre hall with three tiled domes, a small porch and a pool in front."""
    W, D, H = 12.0, 8.0, 4.0
    steps(W + 0.4, D + 0.4, 2)
    f = block('hall', W, D, H, z=0.3, m='ochre', cap='cream')
    zw.box('roofslab', (W + 0.3, D + 0.3, 0.16), (0, 0, 0.3 + H + 0.08), mat('cream'), bevel=0.02, segs=1)
    for x in (-3.9, 0, 3.9):
        zw.cylinder('drum', 1.75, 1.75, 0.5, (x, 0.3, 0.3 + H + 0.4), mat('cream'), segs=18)
        dome(1.85, 0.3 + H + 0.65, (x, 0.3), 'terracotta0', h=1.45, segs=18, ribs=8)
        zw.lathe('finial', [(0.12, 0), (0.06, 0.2), (0.12, 0.32), (0, 0.5)], mat('gold'), centre=(x, 0.3, 0.3 + H + 2.08), segs=8)
    for u in (-4.2, -2.4, 2.4, 4.2): window(f['F'], u, 1.9, 0.8, 1.3, trim='cream', wood='azure_wood', shutters=False)
    for s in 'LR':
        for u in (-2.2, 2.2): window(f[s], u, 1.9, 0.8, 1.3, trim='cream', shutters=False)
    door(f['F'], 0, 0.3, 1.6, 2.6, 'azure_wood')
    for x in (-1.5, 1.5): doric(x, -D / 2 - 1.5, 0.3, 3.0, 0.2, segs=16, flutes=8)
    entablature(3.8, 1.9, 3.3, 0.4, c=(0, -D / 2 - 0.85), tri=None, open_back=False)
    gable_roof(2.3, 4.2, 3.7, c=(0, -D / 2 - 0.9), axis='Y', pitch=22, tymp='paint_azure')
    zw.box('chimney', (0.7, 0.7, 1.6), (4.8, 3.0, 0.3 + H + 0.8), mat('ochre'), uv=2.6); zw.box('chimney_cap', (0.9, 0.9, 0.12), (4.8, 3.0, 0.3 + H + 1.66), mat('cream'))
    at(lambda: pool_shape(6.5, 2.6), 0, -D / 2 - 4.6)


def gymnasium():
    """Gymnasium: a sand court ringed by colonnades, 20 x 20 m."""
    S, H = 20.0, 3.2
    def wing(gate=False):
        f = Face(0, S / 2 - 0.25, S, 0.5, 'B')
        if gate:
            for s in (-1, 1): zw.box('wall', (S / 2 - 1.2, 0.5, H), (s * (S / 4 + 0.6), S / 2 - 0.25, H / 2), mat('cream'), uv=2.6)
            zw.box('wall', (2.4, 0.5, H - 2.7), (0, S / 2 - 0.25, 2.7 + (H - 2.7) / 2), mat('cream'), uv=2.6)
            for s in (-1, 1): doric(s * 1.7, S / 2 + 0.9, 0, 3.4, 0.24)
            entablature(4.6, 1.6, 3.4, 0.45, c=(0, S / 2 + 0.75), tri=None)
            gable_roof(2.0, 5.0, 3.85, c=(0, S / 2 + 0.7), axis='Y', pitch=22, tymp='paint_red')
            door(Face(0, S / 2 - 0.25, 2.4, 0.5, 'B'), 0, 0, 2.0, 2.6, 'red_wood')
        else:
            zw.box('wall', (S, 0.5, H), (0, S / 2 - 0.25, H / 2), mat('cream'), uv=2.6)
            for u in (-6, -2, 2, 6): window(f, u, 1.5, 0.8, 1.0, wood='red_wood', shutters=False)
        zw.box('plinth', (S + 0.1, 0.62, 0.3), (0, S / 2 - 0.25, 0.15), mat('stone_dark'), uv=2.6)
        for i in range(7): doric((i - 3) * 2.2, S / 2 - 3.2, 0.15, H - 0.45, 0.2, segs=16, flutes=8)
        zw.box('ent', (15.2, 0.45, 0.3), (0, S / 2 - 3.2, H - 0.15), mat('marble'), uv=1.2)
        zw.box('paved', (15.0, 3.0, 0.15), (0, S / 2 - 2.0, 0.075), mat('paving'), uv=2.0)
        shed_roof(S - 0.2, 3.7, H + 0.75, H - 0.05, c=(0, S / 2 - 1.75), k=1.2)
    for k in range(4): at(lambda: wing(k == 2), rz=k * PI / 2)
    zw.box('court', (13.6, 13.6, 0.06), (0, 0, 0.03), mat('sand'), uv=1.5)
    for sx in (-1, 1):
        for sy in (-1, 1): zw.box('corner', (3.2, 3.2, H + 0.5), (sx * (S / 2 - 1.6), sy * (S / 2 - 1.6), (H + 0.5) / 2), mat('cream'), uv=2.6); zw.box('corner_cap', (3.5, 3.5, 0.2), (sx * (S / 2 - 1.6), sy * (S / 2 - 1.6), H + 0.6), mat('terracotta0'))
    for x, y in ((-3, 2), (3, -2)): zw.cylinder('weight', 0.3, 0.3, 0.12, (x, y, 0.12), mat('stone'), segs=12)
    post(0, 4, 0.05, 2.2, 0.1, 'wood_dark'); post(0, -4, 0.05, 2.2, 0.1, 'wood_dark')


def lighthouse():
    """Lighthouse: stone base, tapering white tower, columned lantern with a fire. 17 m."""
    f = block('base', 6.0, 6.0, 3.2, m='stone', uv=3.4, plinth=None, cap='marble')
    door(f['F'], 0, 0, 1.3, 2.3, 'azure_wood')
    merlons(5.6, 3.2, (0, -2.8)); merlons(5.6, 3.2, (0, 2.8)); merlons(5.6, 3.2, (-2.8, 0), 'Y'); merlons(5.6, 3.2, (2.8, 0), 'Y')
    zw.lathe('tower', [(2.3, 3.2), (1.75, 11.6), (1.95, 11.75), (2.35, 11.9), (2.35, 12.1), (0, 12.1)], mat('hall'), segs=8, uv=2.4)
    for z in (5.5, 8.6):
        zw.lathe('band', [(2.3 - (z - 3.2) * 0.0655 + 0.04, z), (2.3 - (z - 3.2) * 0.0655 + 0.04, z + 0.22)], mat('paint_azure'), segs=8)
    for i, z in enumerate((4.6, 7.2, 9.8)): zw.box('slit', (0.28, 0.1, 0.9), (0, -(2.3 - (z - 3.2) * 0.0655) * 0.93, z), mat('dark'))
    for i in range(8):
        a = i * PI / 4 + PI / 8
        zw.rod('rail', (2.25 * math.cos(a), 2.25 * math.sin(a), 12.1), (2.25 * math.cos(a), 2.25 * math.sin(a), 12.8), 0.04, mat('bronze'), segs=5)
        b = a + PI / 4
        zw.rod('rail', (2.25 * math.cos(a), 2.25 * math.sin(a), 12.78), (2.25 * math.cos(b), 2.25 * math.sin(b), 12.78), 0.035, mat('bronze'), segs=5)
        doric(1.25 * math.cos(a), 1.25 * math.sin(a), 12.1, 2.2, 0.15, segs=12, flutes=6)
    fire(0, 0, 12.25, 0.75)
    zw.lathe('lantern_roof', [(1.75, 14.3), (1.75, 14.45), (1.0, 15.2), (0.2, 15.9), (0, 15.95)], mat('azure0'), segs=8, uv=1.0)
    zw.lathe('lantern_ring', [(1.6, 14.3), (1.7, 14.3)], mat('gold'), segs=8)
    zw.lathe('finial', [(0.22, 15.85), (0.1, 16.1), (0.2, 16.25), (0, 16.5)], mat('gold'), segs=8)
    zw.bolt('bolt', 0.7, (0, 0, 16.85), mat('gold'), depth=0.06)


def aqueduct():
    """Aqueduct: 8 m run of two arches carrying a water channel 6.5 m up. Runs join end to end."""
    arch_wall('aqueduct', 8.0, 6.0, 1.5, [(-2.0, 1.45, 2.8), (2.0, 1.45, 2.8)], 'stone')
    for x in (-4, 0, 4):
        w = 0.55 if x else 1.1
        zw.box('impost', (w if x else 1.2, 1.66, 0.18), (x - (0.28 if x > 0 else -0.28 if x < 0 else 0), 0, 2.8), mat('marble'), uv=1.2)
    zw.box('cap', (8.0, 1.8, 0.2), (0, 0, 6.1), mat('step'), uv=1.0)
    for s in (-1, 1): zw.box('kerb', (8.0, 0.3, 0.35), (0, s * 0.75, 6.37), mat('step'), uv=1.0)
    zw.box('water', (8.0, 1.2, 0.05), (0, 0, 6.42), mat('water'))


def city_wall():
    """City wall: 8 m run, 5 m high with a walkway and battlements. Runs join end to end."""
    zw.wobble(zw.refine(zw.box('wall', (8.0, 1.6, 5.0), (0, 0, 2.5), mat('stone'), uv=3.4), 1.0), 0.03, 0.5, 2)
    for v in bpy.context.scene.objects['wall'].data.vertices:
        if abs(abs(v.co.x) - 4.0) < 0.08: v.co.x = 4.0 if v.co.x > 0 else -4.0
    zw.box('course', (8.0, 1.72, 0.22), (0, 0, 0.4), mat('stone_dark'), uv=3.4)
    zw.box('walk', (8.0, 2.0, 0.2), (0, 0, 5.1), mat('step'), uv=1.0)
    merlons(8.0, 5.2, (0, -0.8)); zw.box('parapet', (8.0, 0.4, 0.45), (0, -0.8, 5.42), mat('stone'), uv=3.4)


def wall_tower():
    """Round wall tower, 9 m, with battlements, a door and a flag."""
    zw.lathe('tower', [(2.9, 0), (2.75, 0.5), (2.6, 7.4), (2.95, 7.9), (2.95, 8.2), (0, 8.2)], mat('stone'), segs=18, uv=3.4)
    zw.lathe('course', [(2.98, 7.9), (2.98, 8.2)], mat('step'), segs=18)
    for i in range(9):
        a = i * 2 * PI / 9
        at(lambda: zw.box('merlon', (0.85, 0.4, 0.7), (0, -2.72, 8.55), mat('stone'), bevel=0.03, segs=1, uv=3.4), rz=a)
    at(lambda: door(Face(0, 0, 5.3, 5.3, 'F'), 0, 0, 1.1, 2.2, 'wood_dark', trim='step', double=False), rz=PI)
    for z, a in ((3.4, 0.0), (5.6, 0.5), (4.4, -0.6)):
        at(lambda: zw.box('slit', (0.24, 0.12, 0.9), (0, -2.66, z), mat('dark')), rz=a)
    zw.rod('pole', (0, 0, 8.2), (0, 0, 11.4), 0.06, mat('wood_dark'), segs=6)
    zw.prism('flag', [(0, 11.3), (1.5, 11.0), (0, 10.5)], 0.03, mat('cloth_red'), axis='Y', centre=(0.06, 0, 0))
    zw.bolt('bolt', 0.4, (0, 0, 11.75), mat('gold'), depth=0.04)


def wall_gate():
    """Gate in the city wall: an 8 m run with a round arch, timber doors standing open, banners."""
    arch_wall('gate', 8.0, 6.4, 1.8, [(0, 1.7, 2.6)], 'stone', uv=3.4)
    zw.box('course', (8.0, 1.9, 0.22), (0, 0, 5.0), mat('step'), uv=1.0)
    merlons(8.0, 6.4, (0, -0.7)); zw.box('walk', (8.0, 2.1, 0.16), (0, 0, 6.32), mat('step'))
    for i in range(11):
        a = PI * i / 10
        zw.box('voussoir', (0.36, 1.9, 0.42), (0, 0, 0), mat('marble'), bevel=0.03, segs=1).data.transform(Matrix.Translation((1.92 * math.cos(a), 0, 2.6 + 1.92 * math.sin(a))) @ Matrix.Rotation(-(a - PI / 2), 4, 'Y'))
    for s in (-1, 1):
        zw.box('impost', (0.5, 1.96, 0.2), (s * 1.9, 0, 2.6), mat('marble'))
        l = zw.box('leaf', (1.6, 0.14, 3.6), (0, 0, 1.8), mat('wood_dark'), uv=1.3)
        for z in (0.6, 1.8, 3.0): zw.box('strap', (1.5, 0.18, 0.12), (0, 0, z), mat('iron')).data.transform(Matrix.Translation((s * 1.68, -0.9 - 0.75, 0)) @ Matrix.Rotation(s * PI / 2 * 0.92, 4, 'Z'))
        l.data.transform(Matrix.Translation((s * 1.68, -0.9 - 0.75, 0)) @ Matrix.Rotation(s * PI / 2 * 0.92, 4, 'Z'))
        banner(s * 2.9, -0.93, 4.7, 1.7, 0.7, 'red')
    zw.bolt('bolt', 0.8, (0, -0.93, 5.6), mat('gold'), depth=0.05)


def bridge():
    """Stone bridge over the river: one arch, 12 m long with its ramps, 3.6 m wide."""
    arch_wall('bridge', 8.0, 2.5, 3.6, [(0, 3.1, 0.0)], 'stone', uv=3.4)
    for s in (-1, 1):
        zw.prism('ramp', [(s * 4.0, 0), (s * 4.0, 2.5), (s * 6.4, 1.3), (s * 8.4, 0)] if s > 0 else [(s * 8.4, 0), (s * 6.4, 1.3), (s * 4.0, 2.5), (s * 4.0, 0)], 3.6, mat('stone'), axis='Y', uv=3.4)
        for y in (-1.65, 1.65):
            zw.box('parapet', (8.2, 0.3, 0.75), (0, y, 2.87), mat('stone'), uv=3.4) if s > 0 else None
            zw.beam('parapet', (s * 4.0, y, 2.87), (s * 6.4, y, 1.67), 0.3, 0.75, mat('stone'), uv=3.4)
            zw.beam('parapet', (s * 6.4, y, 1.67), (s * 8.4, y, 0.37), 0.3, 0.75, mat('stone'), uv=3.4)
            zw.box('pier', (0.5, 0.5, 1.2), (s * 4.0, y, 2.9), mat('marble'), bevel=0.04, segs=1)
            zw.blob('ball', (0.2, 0.2, 0.2), (s * 4.0, y, 3.68), mat('marble'), 8, 6)
    zw.box('deck', (8.0, 3.0, 0.08), (0, 0, 2.52), mat('paving'), uv=2.0)
    for s in (-1, 1):
        zw.beam('deck', (s * 4.0, 0, 2.52), (s * 6.4, 0, 1.32), 3.0, 0.08, mat('paving'), uv=2.0); zw.beam('deck', (s * 6.4, 0, 1.32), (s * 8.4, 0, 0.02), 3.0, 0.08, mat('paving'), uv=2.0)


# ---------------------------------------------------------------- monuments and street furniture
def signpost():
    """District signpost: timber post, two painted boards (names added in code), gold bolt."""
    zw.box('foot', (0.5, 0.5, 0.16), (0, 0, 0.08), mat('stone'), bevel=0.03, segs=1)
    post(0, 0, 0.1, 2.6, 0.14, 'wood_dark')
    for z, s, c in ((2.25, 1, 'azure_wood'), (1.85, -1, 'red_wood')):
        zw.prism('board', [(-0.1 * s, z - 0.14), (0.95 * s, z - 0.14), (1.15 * s, z), (0.95 * s, z + 0.14), (-0.1 * s, z + 0.14)][::s], 0.05, mat(c), axis='Y', centre=(0, -0.09, 0), uv=0.9)
    zw.bolt('bolt', 0.3, (0, 0, 2.95), mat('gold'), depth=0.03)


def obelisk():
    zw.box('base', (1.3, 1.3, 0.3), (0, 0, 0.15), mat('step'), bevel=0.03, segs=1); zw.box('base2', (0.95, 0.95, 0.5), (0, 0, 0.55), mat('marble'), bevel=0.03, segs=1)
    zw.lathe('shaft', [(0.5, 0.8), (0.3, 5.2), (0, 5.75)], mat('hall'), segs=4, uv=2.4).data.transform(Matrix.Rotation(PI / 4, 4, 'Z'))
    zw.lathe('tip', [(0.31, 5.18), (0, 5.77)], mat('gold'), segs=4).data.transform(Matrix.Rotation(PI / 4, 4, 'Z'))
    zw.bolt('bolt', 0.5, (0, -0.31, 2.2), mat('gold'), depth=0.03)


def victory_column():
    """Monument column: for a statue or the gold bolt, with a plaque face on the pedestal."""
    steps(1.6, 1.6, 2, rise=0.14, tread=0.25)
    zw.box('pedestal', (1.3, 1.3, 1.1), (0, 0, 0.83), mat('marble'), bevel=0.03, segs=1, uv=1.2); zw.box('pedcap', (1.5, 1.5, 0.14), (0, 0, 1.45), mat('step'), bevel=0.02, segs=1)
    zw.box('plaque', (0.9, 0.04, 0.6), (0, -0.66, 0.85), mat('bronze'))
    ionic(0, 0, 1.52, 5.0, 0.36)
    zw.lathe('orb', [(0.2, 6.52), (0.34, 6.75), (0.2, 6.98), (0, 7.02)], mat('gold'), segs=12)
    zw.bolt('bolt', 0.9, (0, 0, 7.6), mat('gold'), depth=0.07)


def altar():
    steps(1.8, 1.2, 2, rise=0.14, tread=0.25)
    zw.box('altar', (1.5, 0.9, 0.8), (0, 0, 0.68), mat('marble'), bevel=0.03, segs=1, uv=1.2)
    zw.box('altar_top', (1.7, 1.1, 0.14), (0, 0, 1.15), mat('step'), bevel=0.03, segs=1)
    for s in (-1, 1): zw.cylinder('scroll', 0.12, 0.12, 1.12, (s * 0.76, 0, 1.3), mat('marble'), axis='Y', segs=10)
    zw.box('band', (1.52, 0.92, 0.1), (0, 0, 0.95), mat('paint_red')); zw.bolt('bolt', 0.34, (0, -0.47, 0.62), mat('gold'), depth=0.03)
    fire(0, 0, 1.24, 0.3)


def sundial():
    zw.lathe('pedestal', [(0.34, 0), (0.34, 0.1), (0.2, 0.2), (0.15, 0.8), (0.22, 0.92), (0.42, 1.0), (0.42, 1.08), (0, 1.08)], mat('marble'), segs=14, uv=1.0)
    zw.cylinder('dial', 0.36, 0.36, 0.02, (0, 0, 1.09), mat('bronze'), segs=14)
    zw.prism('gnomon', [(0, 1.1), (0.26, 1.1), (0, 1.36)], 0.02, mat('gold'), axis='Y')
    for i in range(12):
        a = i * PI / 6; zw.box('tick', (0.02, 0.06, 0.012), (0.3 * math.cos(a), 0.3 * math.sin(a), 1.105), mat('gold'))


def shrine():
    """Small roadside shrine: two columns, a pediment and a niche with the gold bolt."""
    steps(1.5, 1.0, 2, rise=0.13, tread=0.22)
    zw.box('back', (1.3, 0.3, 1.9), (0, 0.3, 0.26 + 0.95), mat('hall'), uv=2.4)
    zw.box('niche', (0.8, 0.06, 1.3), (0, 0.13, 1.1), mat('paint_azure'))
    for s in (-1, 1): doric(s * 0.52, -0.25, 0.26, 1.9, 0.11, segs=12, flutes=6)
    entablature(1.5, 1.0, 2.16, 0.26, accent='paint_red', tri=None, t=0.3)
    gable_roof(1.0, 1.7, 2.42, axis='Y', pitch=24, k=0.6, tymp='paint_azure', finial='gold')
    zw.bolt('bolt', 0.7, (0, 0.08, 1.15), mat('gold'), depth=0.04)
    zw.lathe('bowl', [(0.08, 0.26), (0.06, 0.5), (0.2, 0.62), (0.2, 0.66), (0, 0.6)], mat('bronze'), centre=(0, -0.15, 0), segs=10); fire(0, -0.15, 0.64, 0.12)


def banner_pole(color='red'):
    zw.box('foot', (0.5, 0.5, 0.2), (0, 0, 0.1), mat('step'), bevel=0.03, segs=1)
    zw.rod('pole', (0, 0, 0.2), (0, 0, 4.6), 0.06, mat('wood_dark'), segs=8, r2=0.045)
    zw.rod('arm', (-0.1, 0, 4.2), (0.95, 0, 4.2), 0.03, mat('wood_dark'), segs=6)
    banner(0.5, 0, 4.18, 2.2, 0.75, color)
    zw.lathe('finial', [(0.05, 4.6), (0.1, 4.72), (0, 4.9)], mat('gold'), segs=8)


# ---------------------------------------------------------------- water
def pond():
    """Garden pond: irregular stone rim, lily pads, reeds. About 7 x 6 m. The water surface is animated in code."""
    out = [((3.0 + 0.55 * math.sin(2 * a) + 0.35 * math.cos(3 * a)) * math.cos(a), (2.5 + 0.4 * math.sin(2 * a + 1) + 0.3 * math.cos(3 * a)) * math.sin(a)) for a in [i * 2 * PI / 28 for i in range(28)]]
    slab('water', out, 0.0, 0.07, 'water')
    slab('bed', [(x * 1.12, y * 1.12) for x, y in out], 0.0, 0.03, 'sand', uv=1.5)
    for i, (x, y) in enumerate(out):
        w = rnd.uniform(0.5, 0.85); rock(x * 1.04, y * 1.04, 0, w, rnd.uniform(0.35, 0.5), rnd.uniform(0.18, 0.34), 'stone', i, math.atan2(y, x) + PI / 2)
    for x, y, r in ((-1.2, 0.6, 0.28), (-0.8, 0.9, 0.2), (1.3, -0.7, 0.26), (0.9, -1.1, 0.18), (0.2, 1.3, 0.22)):
        zw.cylinder('lily', r, r, 0.015, (x, y, 0.08), mat('leaf'), segs=9)
    zw.blob('flower', (0.07, 0.07, 0.05), (-1.2, 0.6, 0.11), mat('cloth_cream'), 6, 4)
    for cx, cy in ((2.2, 1.2), (-2.4, -0.9), (1.8, -1.5)):
        for i in range(7):
            dx, dy = rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, 0.25)
            zw.rod('reed', (cx + dx, cy + dy, 0.05), (cx + dx * 1.6, cy + dy * 1.6, rnd.uniform(0.8, 1.4)), 0.018, mat('leaf_dark'), segs=4, r2=0.006)


def river_straight():
    """River, 4 m straight run: water 3 m wide between stone banks. Runs join end to end along X."""
    zw.box('water', (4.0, 3.0, 0.06), (0, 0, 0.03), mat('water'))
    for s in (-1, 1):
        zw.box('bed', (4.0, 0.7, 0.04), (0, s * 1.75, 0.02), mat('sand'), uv=1.5)
        x = -1.95
        while x < 1.7:
            w = rnd.uniform(0.45, 0.8); rock(x + w / 2, s * 1.62, 0, w, rnd.uniform(0.35, 0.5), rnd.uniform(0.2, 0.36), 'stone', int(x * 30) + s); x += w * 0.95
    for x, y in ((-0.8, 0.5), (1.1, -0.6)): rock(x, y, 0, 0.5, 0.4, 0.2, 'stone', int(x * 9))


def river_bend():
    """River, quarter-turn bend to match the straight run (centre line radius 4 m)."""
    ring_segment('water', 2.5, 5.5, 0, 0.06, 0, PI / 2, 'water', n=10, c=(-4, -4))
    for r, sgn in ((2.38, -1), (5.62, 1)):
        ring_segment('bed', r - 0.35, r + 0.35, 0, 0.04, 0, PI / 2, 'sand', n=10, c=(-4, -4), uv=1.5)
        n = int(r * PI / 2 / 0.6)
        for i in range(n):
            a = (i + 0.5) / n * PI / 2
            rock(-4 + r * math.cos(a), -4 + r * math.sin(a), 0, rnd.uniform(0.45, 0.75), rnd.uniform(0.35, 0.5), rnd.uniform(0.2, 0.36), 'stone', i + int(r), a + PI / 2)


def stepping_stones():
    for i in range(5):
        rock(rnd.uniform(-0.12, 0.12), -1.3 + i * 0.65, 0.02, 0.6, 0.5, 0.2, 'stone', i, rnd.uniform(-0.5, 0.5))


def quay():
    """Harbour quay, 4 m run: stone wall with a marble kerb, a bollard and a mooring ring. Sea side is the front."""
    zw.wobble(zw.refine(zw.box('quay', (4.0, 2.4, 1.3), (0, 0, 0.65), mat('stone'), uv=3.4), 0.8), 0.02, 0.6, 4)
    for v in bpy.context.scene.objects['quay'].data.vertices:
        if abs(abs(v.co.x) - 2.0) < 0.06: v.co.x = 2.0 if v.co.x > 0 else -2.0
    zw.box('deck', (4.0, 2.4, 0.1), (0, 0, 1.35), mat('paving'), uv=2.0)
    zw.box('kerb', (4.0, 0.4, 0.2), (0, -1.05, 1.44), mat('step'), bevel=0.03, segs=1)
    zw.lathe('bollard', [(0.16, 1.5), (0.13, 1.85), (0.2, 1.95), (0.2, 2.02), (0, 2.05)], mat('bronze'), centre=(1.0, -0.6, 0), segs=10)
    for k in range(3): zw.torus('coil', 0.2, 0.03, (1.0, -0.6, 1.56 + k * 0.05), mat('rope'), axis='Z', seg=12, tube=4)
    zw.torus('ring', 0.13, 0.025, (-1.0, -1.22, 0.9), mat('iron'), axis='Y', seg=10, tube=5)
    for x in (-1.5, -0.5): zw.box('crate', (0.6, 0.5, 0.45), (x, 0.5, 1.62), mat('wood'), bevel=0.02, segs=1, uv=0.7)
    at(lambda: pot(0, 0, 0, 1.3), -1.0, 0.45, 1.85)


def pier():
    """Timber pier, 2.4 x 7 m, on posts; lands on the quay at its back end."""
    for i in range(14): zw.box('deck', (2.4, 0.46, 0.06), (0, -3.25 + i * 0.5, 1.38 + rnd.uniform(-0.005, 0.005)), mat('wood'), bevel=0.01, segs=1, uv=0.7)
    for y in (-3.2, -1.1, 1.0, 3.1):
        for s in (-1, 1):
            zw.rod('pile', (s * 1.05, y, -0.3), (s * 1.05, y, 1.9 if y < -3 else 1.36), 0.1, mat('wood_dark'), segs=8, uv=0.7)
        zw.beam('joist', (-1.2, y, 1.28), (1.2, y, 1.28), 0.14, 0.14, mat('wood_dark'), uv=0.7)
    for s in (-1, 1): zw.beam('stringer', (s * 1.05, -3.4, 1.3), (s * 1.05, 3.4, 1.3), 0.12, 0.1, mat('wood_dark'), uv=0.7)
    for k in range(3): zw.torus('coil', 0.2, 0.03, (-0.6, -2.6, 1.44 + k * 0.05), mat('rope'), axis='Z', seg=12, tube=4)
    zw.lathe('barrel', [(0.2, 0), (0.27, 0.3), (0.2, 0.6), (0, 0.6)], mat('wood'), centre=(0.6, -2.4, 1.41), segs=10, uv=0.5)


def well():
    """Village well: stone ring, timber frame with a small tiled roof, bucket on a rope."""
    zw.lathe('well', [(1.0, 0), (1.0, 0.12), (0.85, 0.14), (0.85, 0.8), (0.95, 0.86), (0.95, 0.95), (0.62, 0.95), (0.62, 0.3), (0, 0.3)], mat('stone'), segs=18, uv=1.8)
    zw.cylinder('water', 0.62, 0.62, 0.02, (0, 0, 0.5), mat('water'), segs=18)
    for s in (-1, 1): post(s * 0.9, 0, 0.0, 2.3, 0.13, 'wood_dark')
    zw.rod('windlass', (-1.0, 0, 1.75), (1.0, 0, 1.75), 0.07, mat('wood'), segs=8, uv=0.7)
    zw.rod('crank', (1.0, 0, 1.75), (1.22, 0, 1.75), 0.025, mat('iron'), segs=5); zw.rod('crank', (1.22, 0, 1.75), (1.22, 0.02, 1.48), 0.025, mat('iron'), segs=5)
    for k in range(5): zw.torus('wrap', 0.08, 0.016, (-0.1 + k * 0.035, 0, 1.75), mat('rope'), axis='X', seg=10, tube=4)
    zw.rod('rope', (0, 0, 1.68), (0, 0, 1.15), 0.014, mat('rope'), segs=5)
    zw.lathe('bucket', [(0.1, 0), (0.13, 0.24), (0.14, 0.24), (0.11, 0.0)], mat('wood'), centre=(0, 0, 0.9), segs=10, uv=0.5)
    gable_roof(1.5, 2.4, 2.3, axis='Y', pitch=28, k=0.7, ends=False)
    zw.beam('ridge_beam', (0, -0.75, 2.3), (0, 0.75, 2.3), 2.2, 0.08, mat('wood_dark'), uv=0.7)


def pool_shape(w=6.0, d=3.0):
    zw.box('rim', (w + 0.7, d + 0.7, 0.34), (0, 0, 0.17), mat('step'), bevel=0.04, segs=1, uv=1.0)
    zw.box('water', (w, d, 0.04), (0, 0, 0.345), mat('water'))
    zw.box('rim_in', (w + 0.1, d + 0.1, 0.02), (0, 0, 0.33), mat('paint_azure'))


def reflecting_pool():
    """Reflecting pool, 6.7 x 3.7 m, marble rim, a laurel pot at each corner."""
    pool_shape()
    for sx in (-1, 1):
        for sy in (-1, 1): pot(sx * 3.7, sy * 2.2, 0, 1.4, plant='leaf', seed=sx + 2 * sy)


BUILD = {
    'stoa': stoa, 'fountain': fountain, 'tholos': tholos, 'amphitheatre': amphitheatre, 'library': library, 'council_hall': council_hall,
    'bathhouse': bathhouse, 'gymnasium': gymnasium, 'lighthouse': lighthouse, 'aqueduct': aqueduct, 'city_wall': city_wall,
    'wall_tower': wall_tower, 'wall_gate': wall_gate, 'bridge': bridge, 'signpost': signpost, 'obelisk': obelisk,
    'victory_column': victory_column, 'altar': altar, 'sundial': sundial, 'shrine': shrine,
    'banner_red': lambda: banner_pole('red'), 'banner_azure': lambda: banner_pole('azure'),
    'pond': pond, 'river_straight': river_straight, 'river_bend': river_bend, 'stepping_stones': stepping_stones,
    'quay': quay, 'pier': pier, 'well': well, 'reflecting_pool': reflecting_pool,
}
BUILD[ITEM]()
BIG = ('amphitheatre', 'library', 'council_hall', 'bathhouse', 'gymnasium', 'lighthouse', 'aqueduct', 'city_wall', 'wall_tower', 'wall_gate', 'bridge', 'stoa', 'tholos')
finish(OUT, dist=1.0 if ITEM in BIG else 0.4, keep=('tier', 'aisle', 'backwall', 'backcap', 'water', 'bed', 'floor', 'court', 'aqueduct', 'gate', 'bridge', 'ramp', 'deck', 'podium', 'roofslab', 'walk', 'course', 'kerb', 'hall', 'wall', 'skene', 'stage', 'base', 'tower', 'drum', 'roof', 'basin'))
