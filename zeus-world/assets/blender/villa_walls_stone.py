# home_villa-walls_t1_stone: the villa wall body in rough stone with marble dressings. Fits the walls socket:
# 6.4 x 3.0 x 4.4 m (W x H x D), open top for the roof, door at the front centre.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import zw

zw.reset()
# stone and wood are CC0 Poly Haven scans, graded to the palette (see textures/README.md)
stone = zw.material('stone', *zw.tex_photo('castle_wall_slates', 'stone', 1024, tint=zw.PALETTE['stone'], mix=0.5, gain=0.98, contrast=1.0), rough=0.9)
base = zw.material('stone_base', *zw.tex_photo('castle_wall_slates', 'stone_base', 512, tint=zw.PALETTE['stone'], mix=0.5, gain=0.74, contrast=1.0), rough=0.9)
trim = zw.material('trim', *zw.tex_marble(512, seed=5), rough=0.4)
wood = zw.material('azure_wood', *zw.tex_photo('blue_painted_planks', 'azure_wood', 512, tint=zw.PALETTE['azure'], mix=0.85, gain=1.05, contrast=1.1, rot=True), rough=0.6)
dark = zw.material('interior', (0.05, 0.06, 0.09), rough=0.9)
bronze = zw.material('bronze', zw.PALETTE['bronze'], rough=0.35, metal=1.0)
gold = zw.material('gold', zw.PALETTE['gold'], rough=0.25, metal=1.0)
flame = zw.material('flame', (1.0, 0.72, 0.30), rough=0.6)

W, H, D, TH = 6.4, 3.0, 4.4, 0.32
IN = 0.10                                    # the stone face sits this far inside the socket, leaving room for dressings
TILE = 3.4                                   # metres per stone tile: scaled up from the scan's 2.5 m for chunkier stones
PL = 0.34                                    # plinth height
BW, BD = W - 2 * IN, D - 2 * IN              # body size
body = zw.box('walls', (BW, BD, H - 0.02), (0, 0, (H - 0.02) / 2), stone, uv=TILE)

WIN_W, WIN_H, SILL = 0.80, 1.05, 1.12
DOOR_W, DOOR_H = 1.30, 2.22
front_x = [-2.02, 2.02]; side_y = [0.0]; back_x = [-1.6, 1.6]
cutters = [zw.box('c', (BW - 2 * TH, BD - 2 * TH, H), (0, 0, H / 2 + 0.3), None)]      # hollow, open top
cutters += [zw.box('c', (WIN_W, 1.0, WIN_H), (x, -D / 2, SILL + WIN_H / 2), None) for x in front_x]
cutters += [zw.box('c', (WIN_W, 1.0, WIN_H), (x, D / 2, SILL + WIN_H / 2), None) for x in back_x]
cutters += [zw.box('c', (1.0, WIN_W, WIN_H), (s * W / 2, y, SILL + WIN_H / 2), None) for s in (-1, 1) for y in side_y]
cutters += [zw.box('c', (DOOR_W, 1.0, DOOR_H), (0, -D / 2, PL + DOOR_H / 2 - 0.02), None)]
zw.cut(body, cutters)
zw.refine(body, 0.55); zw.box_uv(body, TILE); zw.wobble(body, 0.012, 0.9, 1)        # walls that are not ruler-straight


class Wall:
    """Places parts in wall space: x along the wall, y outwards from the stone face, z up."""
    def __init__(self, face):
        self.face = face
        self.s = {'F': -1, 'B': 1, 'L': -1, 'R': 1}[face]
        self.plane = {'F': -BD / 2, 'B': BD / 2, 'L': -BW / 2, 'R': BW / 2}[face]

    def pos(self, x, y, z):
        if self.face in 'FB': return (-self.s * x, self.plane + self.s * y, z)
        return (self.plane + self.s * y, self.s * x, z)

    def box(self, name, size, at, mat, bevel=0.0, uv=1.0, wob=0.0):
        sx, sy, sz = size
        o = zw.box(name, (sx, sy, sz) if self.face in 'FB' else (sy, sx, sz), self.pos(*at), mat, bevel=bevel, segs=1, uv=uv)
        if wob: zw.wobble(o, wob, 2.5, int(abs(at[0]) * 10 + at[2] * 7) % 50)
        return o


def window(wall, x):
    zc = SILL + WIN_H / 2
    # marble surround: sill on two corbels, jambs, lintel with a keystone
    wall.box('sill', (WIN_W + 0.36, 0.24, 0.10), (x, 0.07, SILL - 0.05), trim, 0.02, wob=0.004)
    for s in (-1, 1):
        wall.box('corbel', (0.11, 0.14, 0.16), (x + s * (WIN_W / 2 + 0.02), 0.05, SILL - 0.17), trim, 0.03)
        wall.box('jamb', (0.11, 0.10, WIN_H), (x + s * (WIN_W / 2 + 0.055), 0.02, zc), trim, 0.02)
    wall.box('lintel', (WIN_W + 0.40, 0.14, 0.17), (x, 0.03, SILL + WIN_H + 0.085), trim, 0.025, wob=0.004)
    wall.box('lintel_cap', (WIN_W + 0.50, 0.19, 0.06), (x, 0.045, SILL + WIN_H + 0.20), trim, 0.02)
    wall.box('keystone', (0.17, 0.19, 0.24), (x, 0.05, SILL + WIN_H + 0.10), trim, 0.03)
    # opening: dark interior, wooden frame and cross bars
    wall.box('pane', (WIN_W, 0.04, WIN_H), (x, -0.22, zc), dark)
    for s in (-1, 1):
        wall.box('frame', (0.05, 0.06, WIN_H), (x + s * (WIN_W / 2 - 0.025), -0.15, zc), wood)
        wall.box('frame', (WIN_W, 0.06, 0.05), (x, -0.15, zc + s * (WIN_H / 2 - 0.025)), wood)
    wall.box('bar', (0.04, 0.045, WIN_H), (x, -0.15, zc), wood)
    wall.box('bar', (WIN_W, 0.045, 0.04), (x, -0.15, zc + 0.12), wood)
    # louvred shutters folded back against the wall, on bronze hinges
    SW = WIN_W / 2 + 0.02
    for s in (-1, 1):
        cx = x + s * (WIN_W / 2 + 0.11 + SW / 2)
        for t in (-1, 1):
            wall.box('stile', (0.055, 0.05, WIN_H), (cx + t * (SW / 2 - 0.0275), 0.045, zc), wood, 0.008, 0.9)
        for zz in (zc - WIN_H / 2 + 0.035, zc, zc + WIN_H / 2 - 0.035):
            wall.box('rail', (SW - 0.10, 0.05, 0.07), (cx, 0.045, zz), wood, 0.008, 0.9)
        for half in (-1, 1):
            for i in range(5):
                zz = zc + half * (0.09 + i * 0.085)
                wall.box('slat', (SW - 0.11, 0.022, 0.06), (cx, 0.036 + 0.008 * (i % 2), zz), wood, 0.0, 0.9)
        for zz in (zc - 0.33, zc + 0.33):
            wall.box('hinge', (0.13, 0.02, 0.035), (cx - s * (SW / 2 - 0.03), 0.075, zz), bronze, 0.006)


for x in front_x: window(Wall('F'), x)
for x in back_x: window(Wall('B'), x)
for y in side_y:
    window(Wall('L'), y); window(Wall('R'), y)

# plinth: two stepped courses of darker stone, broken by the doorway on the front
F = Wall('F')
def course(z, h, out, mat, bevel, wob):
    Wall('B').box('plinth', (BW + 2 * out, out + 0.05, h), (0, out / 2 - 0.025, z), mat, bevel, TILE, wob)
    for wl in (Wall('L'), Wall('R')):
        wl.box('plinth', (BD + 2 * out, out + 0.05, h), (0, out / 2 - 0.025, z), mat, bevel, TILE, wob)
    side = (BW + 2 * out - DOOR_W - 0.5) / 2
    for s in (-1, 1):
        F.box('plinth', (side, out + 0.05, h), (s * (DOOR_W / 2 + 0.25 + side / 2), out / 2 - 0.025, z), mat, bevel, TILE, wob)
course(0.11, 0.22, 0.09, base, 0.035, 0.008)
course(0.28, 0.12, 0.055, base, 0.03, 0.006)

# cornice: stepped marble mouldings with a row of dentils
WALLS = ((Wall('F'), BW), (Wall('B'), BW), (Wall('L'), BD), (Wall('R'), BD))
def ring(z, h, out, bevel):
    for wl, length in WALLS:
        wl.box('cornice', (length + 2 * out, out + 0.06, h), (0, out / 2 - 0.03, z), trim, bevel, 1.2)
ring(H - 0.34, 0.05, 0.03, 0.012)
ring(H - 0.17, 0.10, 0.055, 0.02)
ring(H - 0.05, 0.10, 0.10, 0.025)
for wl, length in WALLS:
    n = int(length / 0.20)
    for i in range(n):
        wl.box('dentil', (0.085, 0.07, 0.085), ((i - (n - 1) / 2) * (length / n), 0.035, H - 0.265), trim)

# corner quoins: alternating long and short dressed blocks, each slightly different
rnd = random.Random(7)
for sx in (-1, 1):
    for sy in (-1, 1):
        for i in range(6):
            z = PL + 0.24 + i * 0.385
            a, b = (0.60, 0.36) if i % 2 == 0 else (0.36, 0.60)
            a += rnd.uniform(-0.04, 0.04); b += rnd.uniform(-0.04, 0.04)
            q = zw.box('quoin', (a, b, 0.335), (sx * (BW / 2 - a / 2 + 0.045), sy * (BD / 2 - b / 2 + 0.045), z), trim, bevel=0.03, segs=1, uv=1.2)
            zw.wobble(q, 0.006, 3.0, i + 10 * (sx + 2) + 100 * (sy + 2))

# doorway: engaged Doric columns carrying a small pediment with the gold bolt
zd = PL - 0.02
CX, CR = DOOR_W / 2 + 0.24, 0.115
for s in (-1, 1):
    x = s * CX
    F.box('col_base', (0.34, 0.30, 0.10), (x, 0.11, zd + 0.05), trim, 0.02)
    zw.cylinder('col_torus', CR + 0.035, CR + 0.01, 0.07, F.pos(x, 0.12, zd + 0.135), trim, bevel=0.02)
    zw.cylinder('col_shaft', CR, CR * 0.86, DOOR_H - 0.36, F.pos(x, 0.12, zd + 0.17 + (DOOR_H - 0.36) / 2), trim, segs=20, uv=0.8)
    zw.cylinder('col_echinus', CR * 0.9, CR + 0.05, 0.09, F.pos(x, 0.12, zd + DOOR_H - 0.145), trim, bevel=0.015)
    F.box('col_abacus', (0.35, 0.31, 0.08), (x, 0.11, zd + DOOR_H - 0.06), trim, 0.015)
    F.box('door_jamb', (0.10, 0.12, DOOR_H), (s * (DOOR_W / 2 + 0.05), 0.0, zd + DOOR_H / 2), trim, 0.015)
ze = zd + DOOR_H
F.box('architrave', (2 * CX + 0.42, 0.30, 0.16), (0, 0.11, ze + 0.08), trim, 0.02)
F.box('arch_cap', (2 * CX + 0.52, 0.36, 0.06), (0, 0.13, ze + 0.19), trim, 0.015)
# no pediment here: the porch module stands in front of the door and the roof sits at 3.0 m
zw.bolt('bolt', 0.15, F.pos(0, 0.265, ze + 0.085), gold, depth=0.02)

# two panelled door leaves: stiles and rails, raised panels, bronze studs and ring knockers
LW = DOOR_W / 2 - 0.008
for s in (-1, 1):
    cx = s * DOOR_W / 4
    F.box('leaf', (LW, 0.05, DOOR_H), (cx, -0.16, zd + DOOR_H / 2), wood, 0.0, 1.3)
    for t in (-1, 1):
        F.box('stile', (0.085, 0.035, DOOR_H), (cx + t * (LW / 2 - 0.0425), -0.125, zd + DOOR_H / 2), wood, 0.008, 1.3)
    for zz in (0.07, 0.78, 1.50, DOOR_H - 0.07):
        F.box('rail', (LW - 0.16, 0.035, 0.13), (cx, -0.125, zd + zz), wood, 0.008, 1.3)
    for z0, z1 in ((0.135, 0.715), (0.845, 1.435), (1.565, DOOR_H - 0.135)):
        F.box('panel', (LW - 0.24, 0.03, (z1 - z0) - 0.07), (cx, -0.125, zd + (z0 + z1) / 2), wood, 0.018, 1.3)
    for zz in (0.78, 1.50):
        for t in (-0.18, 0.0, 0.18):
            zw.blob('stud', (0.022, 0.014, 0.022), F.pos(cx + t, -0.103, zd + zz), bronze, 6, 4)
    zw.blob('boss', (0.055, 0.03, 0.055), F.pos(s * 0.12, -0.10, zd + 1.16), bronze)
    zw.torus('knocker', 0.062, 0.012, F.pos(s * 0.12, -0.075, zd + 1.10), bronze, axis='Y')
F.box('threshold', (DOOR_W, 0.34, 0.04), (0, -0.14, zd + 0.02), trim, 0.008)
F.box('step', (2 * CX + 0.60, 0.50, 0.17), (0, 0.19, 0.085), trim, 0.03, wob=0.004)
F.box('step', (2 * CX + 0.30, 0.34, 0.14), (0, 0.11, 0.24), trim, 0.025, wob=0.004)

# bronze lantern on a bracket beside the door (the light itself is added in code)
lx = CX + 0.62
F.box('lamp_plate', (0.10, 0.02, 0.22), (lx, 0.01, 1.95), bronze, 0.006)
F.box('lamp_arm', (0.03, 0.20, 0.03), (lx, 0.11, 2.03), bronze, 0.006)
zw.cylinder('lamp_roof', 0.085, 0.012, 0.07, F.pos(lx, 0.20, 1.975), bronze, segs=6)
zw.cylinder('lamp_glow', 0.055, 0.055, 0.13, F.pos(lx, 0.20, 1.875), flame, segs=6)
for i in range(6):
    a = i * math.pi / 3
    F.box('lamp_bar', (0.012, 0.012, 0.14), (lx + 0.062 * math.cos(a), 0.20 + 0.062 * math.sin(a), 1.875), bronze)
zw.cylinder('lamp_foot', 0.07, 0.07, 0.02, F.pos(lx, 0.20, 1.80), bronze, segs=6)

zw.bake_shading()
zw.export(sys.argv[-1])
