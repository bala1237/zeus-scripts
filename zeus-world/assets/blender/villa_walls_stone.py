# home_villa-walls_t1_stone: the villa wall body in dressed stone. Fits the walls socket exactly:
# 6.4 x 3.0 x 4.4 m (W x H x D), open top for the roof, door at the front centre.
import sys, os
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

W, H, D, TH = 6.4, 3.0, 4.4, 0.32
TILE = 3.4                                   # metres per stone tile: scaled up from the scan's 2.5 m for chunkier stones
PL, CO = 0.30, 0.22                          # plinth and cornice heights
body = zw.box('walls', (W - 0.12, D - 0.12, H - 0.04), (0, 0, (H - 0.04) / 2), stone, uv=TILE)

WIN_W, WIN_H, SILL = 0.80, 1.05, 1.15
DOOR_W, DOOR_H = 1.30, 2.30
front_x = [-2.05, 2.05]; side_y = [0.0]; back_x = [-1.6, 1.6]
cutters = [zw.box('c', (W - 0.12 - 2 * TH, D - 0.12 - 2 * TH, H), (0, 0, H / 2 + 0.3), None)]      # hollow, open top
cutters += [zw.box('c', (WIN_W, 1.0, WIN_H), (x, -D / 2, SILL + WIN_H / 2), None) for x in front_x]
cutters += [zw.box('c', (WIN_W, 1.0, WIN_H), (x, D / 2, SILL + WIN_H / 2), None) for x in back_x]
cutters += [zw.box('c', (1.0, WIN_W, WIN_H), (s * W / 2, y, SILL + WIN_H / 2), None) for s in (-1, 1) for y in side_y]
cutters += [zw.box('c', (DOOR_W, 1.0, DOOR_H), (0, -D / 2, PL + DOOR_H / 2 - 0.02), None)]
zw.cut(body, cutters); zw.box_uv(body, TILE)

# plinth and cornice rings (four bars each, so the top stays open)
def ring(name, z, h, out, mat, bevel):
    for s in (-1, 1):
        zw.box(name, (W + 2 * out - 0.12, TH + out, h), (0, s * (D / 2 - 0.06 - TH / 2 + out / 2), z), mat, bevel=bevel, uv=TILE)
        zw.box(name, (TH + out, D - 0.12 - 2 * TH, h), (s * (W / 2 - 0.06 - TH / 2 + out / 2), 0, z), mat, bevel=bevel, uv=TILE)
ring('cornice', H - CO / 2, CO, 0.06, trim, 0.03)
# the plinth is cut by the doorway, so it is built in pieces on the front
for s in (-1, 1):
    zw.box('plinth', (TH + 0.06, D, PL), (s * (W / 2 - TH / 2 - 0.03), 0, PL / 2), base, bevel=0.03, uv=TILE)
    zw.box('plinth', ((W - DOOR_W) / 2 - 0.1, TH + 0.06, PL), (s * (DOOR_W / 2 + ((W - DOOR_W) / 2 - 0.1) / 2 + 0.1), -D / 2 + TH / 2 + 0.03, PL / 2), base, bevel=0.03, uv=TILE)
zw.box('plinth', (W, TH + 0.06, PL), (0, D / 2 - TH / 2 - 0.03, PL / 2), base, bevel=0.03, uv=TILE)

# corner quoins: alternating long and short dressed blocks standing proud of the wall
for sx in (-1, 1):
    for sy in (-1, 1):
        for i in range(6):
            z = PL + 0.20 + i * 0.40
            a, b = (0.62, 0.40) if i % 2 == 0 else (0.40, 0.62)
            zw.box('quoin', (a, b, 0.36), (sx * (W / 2 - 0.06 - a / 2 + 0.035), sy * (D / 2 - 0.06 - b / 2 + 0.035), z), trim, bevel=0.025, uv=1.2)

# windows: marble sill and lintel, dark opening, azure shutters folded back against the wall
def window(x, y, face):
    """face: 'F', 'B', 'L', 'R'. Position is the opening centre on that wall."""
    def put(name, size, off, mat, bevel=0.0, uv=1.0):
        sx, sy, sz = size; ox, oy, oz = off                     # size/offset in wall space: x along wall, y outwards
        if face in 'FB':
            s = -1 if face == 'F' else 1
            return zw.box(name, (sx, sy, sz), (x + ox * (-s), y + s * oy, oz), mat, bevel=bevel, uv=uv)
        s = -1 if face == 'L' else 1
        return zw.box(name, (sy, sx, sz), (x + s * oy, y + ox * s, oz), mat, bevel=bevel, uv=uv)
    zc = SILL + WIN_H / 2
    put('sill', (WIN_W + 0.30, 0.20, 0.11), (0, 0.04, SILL - 0.055), trim, 0.02)
    put('lintel', (WIN_W + 0.36, 0.14, 0.20), (0, 0.02, SILL + WIN_H + 0.10), trim, 0.025)
    put('pane', (WIN_W, 0.04, WIN_H), (0, -0.20, zc), dark)
    put('bar', (0.05, 0.05, WIN_H), (0, -0.16, zc), wood)
    put('bar', (WIN_W, 0.05, 0.05), (0, -0.16, zc), wood)
    for s in (-1, 1):
        put('shutter', (WIN_W / 2, 0.05, WIN_H), (s * (WIN_W / 2 + WIN_W / 4 + 0.03), 0.03, zc), wood, 0.012, 0.9)

for x in front_x: window(x, -D / 2 + 0.06, 'F')
for x in back_x: window(x, D / 2 - 0.06, 'B')
for y in side_y:
    window(-W / 2 + 0.06, y, 'L'); window(W / 2 - 0.06, y, 'R')

# doorway: marble surround, two azure leaves, bronze rings, gold bolt over the door
fy = -D / 2 + 0.06
zd = PL - 0.02
for s in (-1, 1):
    zw.box('jamb', (0.20, 0.16, DOOR_H), (s * (DOOR_W / 2 + 0.10), fy - 0.02, zd + DOOR_H / 2), trim, bevel=0.025)
    zw.box('leaf', (DOOR_W / 2 - 0.01, 0.07, DOOR_H), (s * DOOR_W / 4, fy + 0.14, zd + DOOR_H / 2), wood, bevel=0.012, uv=1.3)
    zw.blob('ring', (0.06, 0.03, 0.06), (s * 0.12, fy + 0.09, zd + 1.05), bronze)
zw.box('door_lintel', (DOOR_W + 0.60, 0.20, 0.26), (0, fy - 0.03, zd + DOOR_H + 0.13), trim, bevel=0.03)
zw.box('step', (DOOR_W + 0.5, 0.45, 0.14), (0, -D / 2 - 0.10, 0.07), trim, bevel=0.025)
zw.bolt('bolt', 0.20, (0, fy - 0.14, zd + DOOR_H + 0.13), gold, depth=0.02)

zw.export(sys.argv[-1])
