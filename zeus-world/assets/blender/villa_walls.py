# home_villa-walls_<tier>_<style>: the villa wall body. Fits the walls socket: 6.4 x 3.0 x 4.4 m (W x H x D),
# open top for the roof, door at the front centre. Nothing stands more than 0.12 m proud of the socket's front,
# so every porch module fits in front of it.
#   python villa_walls.py <stone|ochre|goldmarble> out.glb
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import zw

STYLE, OUT = sys.argv[-2], sys.argv[-1]
zw.reset()
P = zw.PALETTE
bronze = zw.material('bronze', P['bronze'], rough=0.35, metal=1.0)
gold = zw.material('gold', P['gold'], rough=0.25, metal=1.0)
dark = zw.material('interior', (0.05, 0.06, 0.09), rough=0.9)
flame = zw.material('flame', (1.0, 0.72, 0.30), rough=0.6)
marble = lambda seed=5: zw.material('marble', *zw.tex_marble(512, seed=seed), rough=0.4)
planks = lambda tint, gain=1.05: zw.material('wood', *zw.tex_photo('blue_painted_planks', 'wood', 512, tint=tint, mix=0.85, gain=gain, contrast=1.1, rot=True), rough=0.6)
# stone, plaster and wood are CC0 Poly Haven scans graded to the palette (see textures/README.md)
if STYLE == 'stone':        # rough stone, marble dressings, azure woodwork
    wall = zw.material('wall', *zw.tex_photo('castle_wall_slates', 'wall', 1024, tint=P['stone'], mix=0.5, gain=0.98), rough=0.9)
    base = zw.material('base', *zw.tex_photo('castle_wall_slates', 'base', 512, tint=P['stone'], mix=0.5, gain=0.74), rough=0.9)
    trim = marble(); wood = planks(P['azure']); metal = bronze; TILE = 3.4; WOB = 0.012; accent = None
elif STYLE == 'ochre':      # painted ochre plaster, cream dressings, olive woodwork
    wall = zw.material('wall', *zw.tex_photo('painted_plaster_wall', 'wall', 1024, tint=P['ochre'], mix=0.9, gain=0.97, contrast=2.6, nstrength=2.0), rough=0.85)
    base = zw.material('base', *zw.tex_photo('castle_wall_slates', 'base', 512, tint=P['stone'], mix=0.5, gain=0.8), rough=0.9)
    trim = zw.material('trim', *zw.tex_photo('painted_plaster_wall', 'trim', 512, tint=P['cream'], mix=0.95, gain=1.02, contrast=1.2), rough=0.8)
    wood = planks(P['olive'], 0.95); metal = bronze; TILE = 2.6; WOB = 0.016; accent = None
elif STYLE == 'goldmarble': # coursed white marble with gold trim, azure woodwork
    wall = zw.material('wall', *zw.tex_photo('marble_01', 'wall', 1024, tint=P['marble'], mix=0.9, gain=0.97, contrast=1.6), rough=0.4)
    base = zw.material('base', *zw.tex_marble(512, seed=11), rough=0.45)
    trim = marble(); wood = planks(P['azure']); metal = gold; TILE = 2.4; WOB = 0.004; accent = gold
else:
    raise SystemExit('style must be stone, ochre or goldmarble')

W, H, D, TH = 6.4, 3.0, 4.4, 0.32
IN = 0.10                                    # the wall face sits this far inside the socket, leaving room for dressings
PL = 0.34                                    # plinth height
BW, BD = W - 2 * IN, D - 2 * IN
body = zw.box('walls', (BW, BD, H - 0.02), (0, 0, (H - 0.02) / 2), wall, uv=TILE)

WIN_W, WIN_H, SILL = 0.80, 1.05, 1.12
DOOR_W, DOOR_H = 1.30, 2.22
front_x = [-2.02, 2.02]; side_y = [0.0]; back_x = [-1.6, 1.6]
cutters = [zw.box('c', (BW - 2 * TH, BD - 2 * TH, H), (0, 0, H / 2 + 0.3), None)]      # hollow, open top
cutters += [zw.box('c', (WIN_W, 1.0, WIN_H), (x, -D / 2, SILL + WIN_H / 2), None) for x in front_x]
cutters += [zw.box('c', (WIN_W, 1.0, WIN_H), (x, D / 2, SILL + WIN_H / 2), None) for x in back_x]
cutters += [zw.box('c', (1.0, WIN_W, WIN_H), (s * W / 2, y, SILL + WIN_H / 2), None) for s in (-1, 1) for y in side_y]
cutters += [zw.box('c', (DOOR_W, 1.0, DOOR_H), (0, -D / 2, PL + DOOR_H / 2 - 0.02), None)]
zw.cut(body, cutters)
zw.refine(body, 0.55); zw.box_uv(body, TILE); zw.wobble(body, WOB, 0.9, 1)          # walls that are not ruler-straight


class Wall:
    """Places parts in wall space: x along the wall, y outwards from the wall face, z up."""
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

    def prism(self, name, outline, length, x, mat, uv=0.9):
        """Extrude an (outwards, up) outline along the wall, centred at x."""
        if self.face in 'FB':
            pts = [(self.plane + self.s * o, z) for o, z in outline]
            return zw.prism(name, pts if self.s > 0 else pts[::-1], length, mat, axis='X', centre=(-self.s * x, 0, 0), uv=uv)
        pts = [(self.plane + self.s * o, z) for o, z in outline]
        return zw.prism(name, pts if self.s < 0 else pts[::-1], length, mat, axis='Y', centre=(0, self.s * x, 0), uv=uv)


def window(wall, x):
    zc = SILL + WIN_H / 2
    # surround: sill on two corbels, jambs, lintel with a keystone
    wall.box('sill', (WIN_W + 0.36, 0.20, 0.10), (x, 0.05, SILL - 0.05), trim, 0.02, wob=0.004)
    for s in (-1, 1):
        wall.box('corbel', (0.11, 0.12, 0.16), (x + s * (WIN_W / 2 + 0.02), 0.04, SILL - 0.17), trim, 0.03)
        wall.box('jamb', (0.11, 0.10, WIN_H), (x + s * (WIN_W / 2 + 0.055), 0.02, zc), trim, 0.02)
    wall.box('lintel', (WIN_W + 0.40, 0.14, 0.17), (x, 0.03, SILL + WIN_H + 0.085), trim, 0.025, wob=0.004)
    wall.box('lintel_cap', (WIN_W + 0.50, 0.17, 0.06), (x, 0.035, SILL + WIN_H + 0.20), accent or trim, 0.02)
    wall.box('keystone', (0.17, 0.17, 0.24), (x, 0.04, SILL + WIN_H + 0.10), accent or trim, 0.03)
    # opening: dark interior, wooden frame and cross bars
    wall.box('pane', (WIN_W, 0.04, WIN_H), (x, -0.22, zc), dark)
    for s in (-1, 1):
        wall.box('frame', (0.05, 0.06, WIN_H), (x + s * (WIN_W / 2 - 0.025), -0.15, zc), wood)
        wall.box('frame', (WIN_W, 0.06, 0.05), (x, -0.15, zc + s * (WIN_H / 2 - 0.025)), wood)
    wall.box('bar', (0.04, 0.045, WIN_H), (x, -0.15, zc), wood)
    wall.box('bar', (WIN_W, 0.045, 0.04), (x, -0.15, zc + 0.12), wood)
    # louvred shutters folded back against the wall, on metal hinges
    SW = WIN_W / 2 + 0.02
    for s in (-1, 1):
        cx = x + s * (WIN_W / 2 + 0.11 + SW / 2)
        wall.box('shutter_back', (SW - 0.08, 0.012, WIN_H - 0.08), (cx, 0.018, zc), dark)
        for t in (-1, 1):
            wall.box('stile', (0.055, 0.05, WIN_H), (cx + t * (SW / 2 - 0.0275), 0.045, zc), wood, 0.008, 0.9)
        for zz in (zc - WIN_H / 2 + 0.035, zc, zc + WIN_H / 2 - 0.035):
            wall.box('rail', (SW - 0.10, 0.05, 0.07), (cx, 0.045, zz), wood, 0.008, 0.9)
        for half in (-1, 1):                       # louvres: slats sloping down and out, dark gaps between
            for i in range(6):
                z0 = zc + half * (0.075 + i * 0.07)
                wall.prism('slat', [(0.026, z0 + 0.03), (0.062, z0 - 0.012), (0.062, z0 - 0.03), (0.026, z0 + 0.012)], SW - 0.11, cx, wood)
        for zz in (zc - 0.33, zc + 0.33):
            wall.box('hinge', (0.13, 0.02, 0.035), (cx - s * (SW / 2 - 0.03), 0.075, zz), metal, 0.006)


for x in front_x: window(Wall('F'), x)
for x in back_x: window(Wall('B'), x)
for y in side_y:
    window(Wall('L'), y); window(Wall('R'), y)

# plinth: two stepped courses, broken by the doorway on the front
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

# cornice: stepped mouldings with a row of dentils (and a gold fillet on the richest style)
WALLS = ((Wall('F'), BW), (Wall('B'), BW), (Wall('L'), BD), (Wall('R'), BD))
def ring(z, h, out, bevel, mat=None):
    for wl, length in WALLS:
        wl.box('cornice', (length + 2 * out, out + 0.06, h), (0, out / 2 - 0.03, z), mat or trim, bevel, 1.2)
ring(H - 0.34, 0.05, 0.03, 0.012, accent)
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

# doorway: flat pilasters with capitals carrying an entablature and the gold bolt
zd = PL - 0.02; ze = zd + DOOR_H
CX = DOOR_W / 2 + 0.20
for s in (-1, 1):
    x = s * CX
    F.box('pil_base', (0.30, 0.13, 0.12), (x, 0.045, zd + 0.06), trim, 0.02)
    F.box('pilaster', (0.22, 0.09, DOOR_H - 0.24), (x, 0.035, zd + 0.12 + (DOOR_H - 0.24) / 2), trim, 0.012, 0.8)
    for k in (-1, 0, 1):
        F.box('pil_flute', (0.028, 0.012, DOOR_H - 0.62), (x + k * 0.058, 0.082, zd + 0.12 + (DOOR_H - 0.24) / 2), trim, 0.005)
    F.box('pil_neck', (0.25, 0.11, 0.05), (x, 0.045, ze - 0.145), accent or trim, 0.012)
    F.box('pil_cap', (0.31, 0.14, 0.10), (x, 0.05, ze - 0.07), accent or trim, 0.02)
    F.box('door_jamb', (0.09, 0.10, DOOR_H), (s * (DOOR_W / 2 + 0.045), 0.0, zd + DOOR_H / 2), trim, 0.012)
F.box('architrave', (2 * CX + 0.36, 0.14, 0.16), (0, 0.05, ze + 0.08), trim, 0.02)
F.box('arch_cap', (2 * CX + 0.46, 0.18, 0.06), (0, 0.06, ze + 0.19), accent or trim, 0.015)
zw.bolt('bolt', 0.19, F.pos(0, 0.13, ze + 0.09), gold, depth=0.025)

# two panelled door leaves: stiles and rails, raised panels, metal studs and ring knockers
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
            zw.blob('stud', (0.022, 0.014, 0.022), F.pos(cx + t, -0.103, zd + zz), metal, 6, 4)
    zw.blob('boss', (0.055, 0.03, 0.055), F.pos(s * 0.12, -0.10, zd + 1.16), metal)
    zw.torus('knocker', 0.062, 0.012, F.pos(s * 0.12, -0.075, zd + 1.10), metal, axis='Y')
F.box('threshold', (DOOR_W, 0.34, 0.04), (0, -0.14, zd + 0.02), trim, 0.008)
F.box('step', (2 * CX + 0.50, 0.26, 0.16), (0, 0.03, 0.08), trim, 0.03, wob=0.004)
F.box('step', (2 * CX + 0.20, 0.20, 0.15), (0, 0.0, 0.235), trim, 0.025, wob=0.004)

# metal lantern on a bracket beside the door (the light itself is added in code)
lx = CX + 0.60
F.box('lamp_plate', (0.10, 0.02, 0.22), (lx, 0.01, 1.95), metal, 0.006)
F.box('lamp_arm', (0.03, 0.12, 0.03), (lx, 0.06, 2.03), metal, 0.006)
zw.cylinder('lamp_roof', 0.075, 0.012, 0.07, F.pos(lx, 0.105, 1.975), metal, segs=6)
zw.cylinder('lamp_glow', 0.048, 0.048, 0.13, F.pos(lx, 0.105, 1.875), flame, segs=6)
for i in range(6):
    a = i * math.pi / 3
    F.box('lamp_bar', (0.012, 0.012, 0.14), (lx + 0.054 * math.cos(a), 0.105 + 0.054 * math.sin(a), 1.875), metal)
zw.cylinder('lamp_foot', 0.062, 0.062, 0.02, F.pos(lx, 0.105, 1.80), metal, segs=6)

zw.bake_shading()
zw.export(OUT)
