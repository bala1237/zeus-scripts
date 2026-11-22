# civic_temple-zeus_stage<1-4>: the Temple of Zeus, a Doric temple with columns all round, on a stone podium.
# About 15 x 28 m on the ground and 12.5 m tall; the front (stairs, doors) faces the viewer.
# Stages for the live build: 1 podium and column stumps, 2 columns and half-height hall, 3 entablature, 4 complete.
#   python temple.py <stage> out.glb
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, zw
from mathutils import Matrix

STAGE, OUT = int(sys.argv[-2]), sys.argv[-1]
zw.reset(); P = zw.PALETTE
marble = zw.material('marble', *zw.tex_marble(512, seed=5), rough=0.4)
step = zw.material('step', *zw.tex_marble(512, seed=11), rough=0.45)
stone = zw.material('stone', *zw.tex_photo('castle_wall_slates', 'stone', 1024, tint=P['stone'], mix=0.5, gain=0.9), rough=0.9)
hall = zw.material('hall', *zw.tex_photo('marble_01', 'hall', 1024, tint=P['marble'], mix=0.9, gain=0.95, contrast=1.6), rough=0.45)
azure = zw.material('azure', *zw.tex_mottled('azure', P['azure'], seed=3, amount=0.2), rough=0.5)
red = zw.material('red', *zw.tex_mottled('red', P['red'], seed=4, amount=0.2), rough=0.6)
gold = zw.material('gold', P['gold'], rough=0.25, metal=1.0)
bronze = zw.material('bronze', *zw.tex_mottled('bronze', P['bronze'], seed=5, amount=0.3, bump=0.25), rough=0.38, metal=1.0)
flame = zw.material('flame', (1.0, 0.72, 0.30), rough=0.6)
tiles = [zw.material(f'tile{i}', *zw.tex_mottled(f'tile{i}', tuple(c * g for c in P['terracotta']), seed=20 + i, amount=0.3, grain=0.12), rough=0.8) for i, g in enumerate((1.0, 0.9, 1.1))]

PZ = 1.0                                     # podium height
SP = 1.9                                     # column spacing
NX, NY = 6, 11                               # columns across the front and down the side
CW, CL = (NX - 1) * SP, (NY - 1) * SP        # colonnade centre lines: 9.5 x 19.0 m
FLOOR = PZ + 0.9                             # top of the three temple steps
HC = 5.6                                     # column height
TOP = FLOOR + HC

# podium of rough stone with a marble kerb, and a broad stair up the front between two cheek blocks
PW, PL = 15.0, 25.5
zw.wobble(zw.refine(zw.box('podium', (PW, PL, PZ - 0.12), (0, 0, (PZ - 0.12) / 2), stone, uv=3.4), 1.2), 0.03, 0.5, 1)
zw.box('kerb', (PW + 0.16, PL + 0.16, 0.14), (0, 0, PZ - 0.07), step, bevel=0.03, segs=1, uv=1.0)
SW, NS = 6.4, 7
for i in range(NS):
    d = 0.36 * (NS - i)
    zw.box('stair', (SW, d, PZ / NS), (0, -PL / 2 - d / 2, (i + 0.5) * PZ / NS), step, bevel=0.02, segs=1, uv=1.0)
for s in (-1, 1):
    zw.box('cheek', (1.3, 0.36 * NS + 0.2, PZ + 0.25), (s * (SW / 2 + 0.65), -PL / 2 - 0.36 * NS / 2, (PZ + 0.25) / 2), stone, bevel=0.04, segs=1, uv=3.4)
    zw.box('cheek_cap', (1.46, 0.36 * NS + 0.36, 0.14), (s * (SW / 2 + 0.65), -PL / 2 - 0.36 * NS / 2, PZ + 0.32), step, bevel=0.03, segs=1, uv=1.0)
# the three steps of the temple platform
for i in range(3):
    g = (2 - i) * 0.42
    zw.box('platform', (CW + 1.5 + 2 * g, CL + 1.5 + 2 * g, 0.30), (0, 0, PZ + 0.15 + i * 0.30), step, bevel=0.02, segs=1, uv=1.0)

# Doric columns all round: fluted shafts that swell slightly, cushion capitals, square abacus
def column(x, y, h):
    full = h >= HC
    zs = h - 0.46 if full else h
    r0, r1 = 0.50, 0.50 - 0.11 * (zs / (HC - 0.46))
    prof = [(r0 - (r0 - r1) * ((t / 6) ** 1.5), zs * t / 6) for t in range(7)]
    zw.lathe('shaft', prof, marble, centre=(x, y, FLOOR), segs=32, uv=1.6, flutes=16, flute_depth=0.085)
    if not full:
        zw.cylinder('drum_top', r1 * 0.97, r1 * 0.97, 0.02, (x, y, FLOOR + zs), marble, segs=16)
        return
    z = FLOOR + zs
    zw.torus('annulet', r1 + 0.012, 0.018, (x, y, z - 0.06), marble, axis='Z', seg=14, tube=3)
    zw.lathe('echinus', [(r1, 0), (r1 + 0.08, 0.05), (0.60, 0.20), (0.60, 0.25)], marble, centre=(x, y, z), segs=16, uv=1.2)
    zw.box('abacus', (1.24, 1.24, 0.21), (x, y, z + 0.355), marble, bevel=0.02, segs=1, uv=1.2)

cols = [(-CW / 2 + i * SP, -CL / 2 + j * SP) for i in range(NX) for j in range(NY) if i in (0, NX - 1) or j in (0, NY - 1)]
for k, (x, y) in enumerate(cols):
    column(x, y, HC if STAGE >= 2 else (0.9 if k % 3 else 1.7))

# the hall inside the colonnade
HW, HL, HY = 6.2, 13.6, 0.6
if STAGE >= 2:
    hh = HC if STAGE >= 3 else 2.7
    zw.box('hall', (HW, HL, hh), (0, HY, FLOOR + hh / 2), hall, uv=2.4)
    zw.box('hall_base', (HW + 0.24, HL + 0.24, 0.36), (0, HY, FLOOR + 0.18), marble, bevel=0.04, segs=1, uv=1.2)
    for sx in (-1, 1):
        for sy in (-1, 1):                       # corner pilasters
            zw.box('anta', (0.62, 0.62, hh), (sx * (HW / 2 - 0.2), HY + sy * (HL / 2 - 0.2), FLOOR + hh / 2), marble, bevel=0.03, segs=1, uv=1.2)
if STAGE >= 3:
    zw.box('hall_band', (HW + 0.16, HL + 0.16, 0.10), (0, HY, TOP - 0.62), red, uv=1.2)
    zw.box('hall_cap', (HW + 0.30, HL + 0.30, 0.30), (0, HY, TOP - 0.15), marble, bevel=0.03, segs=1, uv=1.2)

# entablature: plain beam, red fillet, frieze of azure triglyphs, projecting cornice with a gold edge
def ring(name, z, h, out, t, mat, bevel=0.0):
    w, l = CW + 1.24 + 2 * out, CL + 1.24 + 2 * out
    for s in (-1, 1):
        zw.box(name, (w, t, h), (0, s * (l / 2 - t / 2), z + h / 2), mat, bevel=bevel, segs=1, uv=1.6)
        zw.box(name, (t, l - 2 * t, h), (s * (w / 2 - t / 2), 0, z + h / 2), mat, bevel=bevel, segs=1, uv=1.6)
EZ = TOP + 0.60 + 0.09 + 0.62 + 0.26            # top of the entablature
if STAGE >= 3:
    ring('ent', TOP, 0.60, 0.0, 1.2, marble, 0.02)
    ring('ent', TOP + 0.60, 0.09, 0.05, 1.3, red)
    ring('ent', TOP + 0.69, 0.62, -0.03, 1.15, marble)
    fx, fy = CW / 2 + 0.62 - 0.03, CL / 2 + 0.62 - 0.03
    zt = TOP + 0.69 + 0.31
    for i in range(2 * NX - 1):
        x = -CW / 2 + i * SP / 2
        for s in (-1, 1):
            for k in (-1, 0, 1): zw.box('triglyph', (0.11, 0.07, 0.62), (x + k * 0.16, s * fy, zt), azure)
            if i < 2 * NX - 2: zw.blob('rosette', (0.15, 0.04, 0.15), (x + SP / 4, s * (fy + 0.01), zt), gold, 8, 4)
    for j in range(1, 2 * NY - 2):
        y = -CL / 2 + j * SP / 2
        for s in (-1, 1):
            for k in (-1, 0, 1): zw.box('triglyph', (0.07, 0.11, 0.62), (s * fx, y + k * 0.16, zt), azure)
    zw.box('cornice', (CW + 2.3, CL + 2.3, 0.16), (0, 0, TOP + 1.31 + 0.08), marble, bevel=0.03, segs=1, uv=1.6)
    zw.box('cornice', (CW + 2.5, CL + 2.5, 0.10), (0, 0, EZ - 0.05), gold if STAGE >= 4 else marble, bevel=0.02, segs=1, uv=1.6)

# roof, built with its ridge along X and then turned so the pediments face front and back
if STAGE >= 4:
    before = set(bpy.data.objects)
    FW, FD = CL + 2.5, CW + 2.5; Y0 = FD / 2; PITCH = math.radians(18)
    RISE = Y0 * math.tan(PITCH); SL = Y0 / math.cos(PITCH)
    def on_slope(o, s):
        o.data.transform(Matrix(((1, 0, 0, 0), (0, -s * math.cos(PITCH), s * math.sin(PITCH), s * Y0), (0, math.sin(PITCH), math.cos(PITCH), EZ), (0, 0, 0, 1)))); return o
    K, PX = 7, 0.56; COLS = int((FW - 0.9) / PX); LC = SL / K
    for s in (-1, 1):
        for k in range(K):
            c = zw.box('pan', (FW - 1.0, LC + 0.08, 0.06), (0, (k + 0.5) * LC, 0.05), tiles[k % 3], uv=1.2)
            zw.turn(c, x=0.04); on_slope(c, s)
            on_slope(zw.box('lip', (FW - 1.0, 0.06, 0.08), (0, k * LC + 0.03, 0.07), tiles[(k + 1) % 3], uv=1.2), s)
            for i in range(COLS):
                x = (i - (COLS - 1) / 2) * PX
                on_slope(zw.rod('cover', (x, k * LC - 0.03, 0.13), (x, (k + 1) * LC + 0.02, 0.10), 0.12, tiles[(i + k) % 3], segs=6, r2=0.10, uv=1.2), s)
        for i in range(COLS):
            on_slope(zw.blob('antefix', (0.13, 0.07, 0.13), ((i - (COLS - 1) / 2) * PX, 0.0, 0.17), gold, 6, 4), s)
    n = 24
    for i in range(n):
        zw.cylinder('ridge', 0.19, 0.16, (FW - 1.0) / n + 0.04, ((i - (n - 1) / 2) * (FW - 1.0) / n, 0, EZ + RISE + 0.04), tiles[1], axis='X', segs=8, uv=1.2)
    TY = Y0 - 0.5; TZ = TY * math.tan(PITCH)
    for s in (-1, 1):
        zw.prism('tympanum', [(-TY, EZ), (TY, EZ), (0, EZ + TZ)], 0.5, azure, axis='X', centre=(s * (FW / 2 - 0.85), 0, 0), uv=1.6)
        for t in (-1, 1):
            r = zw.box('rake', (1.0, SL + 0.2, 0.26), (s * (FW / 2 - 0.5), SL / 2 - 0.05, -0.10), marble, bevel=0.03, segs=1, uv=1.6); on_slope(r, t)
            g = zw.box('rake_trim', (1.08, SL + 0.24, 0.07), (s * (FW / 2 - 0.5), SL / 2 - 0.05, 0.06), gold, uv=1.6); on_slope(g, t)
            zw.lathe('acroterion', [(0, 0), (0.22, 0), (0.26, 0.10), (0.14, 0.22), (0.24, 0.45), (0.12, 0.72), (0, 0.9)], gold, centre=(s * (FW / 2 - 0.5), t * (Y0 - 0.3), EZ + 0.2), segs=8, uv=0.5)
            zw.blob('disc', (0.05, 0.26, 0.26), (s * (FW / 2 - 0.58), t * TY * 0.5, EZ + TZ * 0.26), gold, 10, 4)
        b = zw.bolt('bolt', TZ * 0.78, (0, 0, 0), gold, depth=0.10)
        zw.turn(b, z=s * math.pi / 2); b.data.transform(Matrix.Translation((s * (FW / 2 - 0.56), 0, EZ + TZ * 0.44)))
        zw.lathe('acroterion', [(0, 0), (0.26, 0), (0.30, 0.12), (0.16, 0.26), (0.30, 0.55), (0.14, 0.95), (0, 1.2)], gold, centre=(s * (FW / 2 - 0.5), 0, EZ + RISE + 0.1), segs=8, uv=0.5)
    turn = Matrix.Rotation(math.pi / 2, 4, 'Z')
    for o in set(bpy.data.objects) - before: o.data.transform(turn)

    # great gold doors in a marble frame, bronze studs and ring handles
    dy = HY - HL / 2
    DW, DH = 2.5, 4.3
    for s in (-1, 1):
        zw.box('door_jamb', (0.36, 0.3, DH + 0.2), (s * (DW / 2 + 0.18), dy - 0.1, FLOOR + (DH + 0.2) / 2), marble, bevel=0.03, segs=1, uv=1.2)
        zw.box('door_leaf', (DW / 2 - 0.02, 0.12, DH), (s * DW / 4, dy - 0.05, FLOOR + DH / 2), gold)
        for i in range(4):
            zw.box('door_panel', (DW / 2 - 0.34, 0.06, DH / 4 - 0.22), (s * DW / 4, dy - 0.12, FLOOR + (i + 0.5) * DH / 4), gold, bevel=0.03, segs=1)
            for t in (-1, 1):
                zw.blob('door_stud', (0.045, 0.03, 0.045), (s * DW / 4 + t * 0.42, dy - 0.12, FLOOR + i * DH / 4 + 0.05), bronze, 6, 4)
        zw.torus('door_ring', 0.13, 0.025, (s * 0.2, dy - 0.17, FLOOR + 1.5), bronze, axis='Y', seg=12, tube=5)
    zw.box('door_lintel', (DW + 1.3, 0.36, 0.42), (0, dy - 0.12, FLOOR + DH + 0.41), marble, bevel=0.04, segs=1, uv=1.2)
    zw.box('door_cap', (DW + 1.6, 0.44, 0.12), (0, dy - 0.14, FLOOR + DH + 0.68), gold, bevel=0.02, segs=1)
    # bronze braziers on the stair cheeks
    for s in (-1, 1):
        c = (s * (SW / 2 + 0.65), -PL / 2 - 0.36 * NS / 2, PZ + 0.39)
        for a in (0.5, 2.6, 4.7):
            zw.rod('tripod', (c[0] + 0.34 * math.cos(a), c[1] + 0.34 * math.sin(a), c[2]), (c[0] + 0.12 * math.cos(a), c[1] + 0.12 * math.sin(a), c[2] + 0.95), 0.035, bronze, segs=6)
        zw.lathe('bowl', [(0.10, 0.80), (0.30, 0.92), (0.44, 1.10), (0.46, 1.18), (0.40, 1.18), (0.0, 1.06)], bronze, centre=c, segs=14, uv=0.5)
        zw.blob('coals', (0.34, 0.34, 0.09), (c[0], c[1], c[2] + 1.14), zw.material('coal', (1.0, 0.42, 0.12), rough=0.7) if s < 0 else bpy.data.materials['coal'], 8, 4)
        for dx, dy, hh in ((0, 0, 1.5), (0.4, 0.2, 1.0), (-0.35, 0.25, 0.9), (0.1, -0.4, 1.1), (-0.3, -0.3, 0.75)):
            zw.lathe('flame', [(0, 0), (0.12, 0.085 * hh), (0.09, 0.24 * hh), (0.03, 0.41 * hh), (0, 0.51 * hh)], flame, centre=(c[0] + dx * 0.34, c[1] + dy * 0.34, c[2] + 1.14), segs=6, uv=0.5)

zw.bake_shading(dist=1.4, keep=('pan', 'lip', 'ent', 'cornice', 'rake', 'rake_trim', 'platform', 'kerb', 'stair', 'hall', 'hall_base', 'hall_band', 'hall_cap', 'tympanum'))
zw.export(OUT)
