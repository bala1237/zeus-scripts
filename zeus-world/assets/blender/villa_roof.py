# home_villa-roof_<tier>_<style>: gable roof for the villa. Origin at the wall top (place it at y = 3.0 m).
# Footprint 7.3 x 5.5 m: it overhangs the 6.4 x 4.4 m walls. Ridge runs left to right, pediments on the ends.
#   python villa_roof.py <terracotta|azure> out.glb
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import zw
from mathutils import Matrix, Vector

STYLE, OUT = sys.argv[-2], sys.argv[-1]
zw.reset(); P = zw.PALETTE; rnd = random.Random(5)
marble = zw.material('marble', *zw.tex_marble(512, seed=5), rough=0.4)
gold = zw.material('gold', P['gold'], rough=0.25, metal=1.0)
if STYLE == 'terracotta':
    tiles = [zw.material(f'tile{i}', *zw.tex_mottled(f'tile{i}', tuple(c * g for c in P['terracotta']), seed=20 + i, amount=0.3, grain=0.12), rough=0.8) for i, g in enumerate((1.0, 0.9, 1.1))]
    ridge_mat, finial = tiles[1], tiles[0]
elif STYLE == 'azure':
    tiles = [zw.material(f'tile{i}', *zw.tex_mottled(f'tile{i}', tuple(c * g for c in P['azure']), seed=30 + i, amount=0.25, grain=0.08), rough=0.35) for i, g in enumerate((1.0, 0.88, 1.12))]
    ridge_mat, finial = gold, gold
elif STYLE == 'slate':
    tiles = [zw.material(f'tile{i}', *zw.tex_mottled(f'tile{i}', tuple(c * g for c in (0.42, 0.45, 0.50)), seed=40 + i, amount=0.3, grain=0.15), rough=0.6) for i, g in enumerate((1.0, 0.88, 1.12))]
    ridge_mat, finial = tiles[1], tiles[0]
elif STYLE == 'gold':
    tiles = [zw.material(f'tile{i}', *zw.tex_mottled(f'tile{i}', tuple(min(1, c * g) for c in P['gold']), seed=50 + i, amount=0.2, grain=0.06, bump=0.2), rough=0.3, metal=1.0) for i, g in enumerate((1.0, 0.9, 1.08))]
    ridge_mat, finial = gold, gold
else:
    raise SystemExit('style must be terracotta, azure, slate or gold')

FW, FD = 7.3, 5.5                         # footprint
BW, BD = 6.5, 4.5                         # entablature body, just outside the walls
PITCH = math.radians(24); E = 0.45        # entablature height
Y0 = FD / 2; RISE = Y0 * math.tan(PITCH); SL = Y0 / math.cos(PITCH)

# entablature: architrave, frieze with triglyphs, projecting cornice on mutules
def ring(z, h, w, d, t, mat, bevel):
    for s in (-1, 1):
        zw.box('ent', (w, t, h), (0, s * (d / 2 - t / 2), z), mat, bevel=bevel, segs=1, uv=1.2)
        zw.box('ent', (t, d - 2 * t, h), (s * (w / 2 - t / 2), 0, z), mat, bevel=bevel, segs=1, uv=1.2)
ring(0.09, 0.18, BW, BD, 0.35, marble, 0.015)
ring(0.255, 0.15, BW - 0.04, BD - 0.04, 0.33, marble, 0.0)
for s in (-1, 1):
    n = 15
    for i in range(n):                    # triglyphs on the long sides
        x = (i - (n - 1) / 2) * (BW - 0.3) / (n - 1)
        for k in (-1, 0, 1):
            zw.box('triglyph', (0.035, 0.03, 0.15), (x + k * 0.045, s * (BD / 2 - 0.005), 0.255), accent := marble)
    m = 9
    for i in range(m):                    # and on the short sides
        y = (i - (m - 1) / 2) * (BD - 0.3) / (m - 1)
        for k in (-1, 0, 1):
            zw.box('triglyph', (0.03, 0.035, 0.15), (s * (BW / 2 - 0.005), y + k * 0.045, 0.255), marble)
zw.box('cornice', (FW - 0.10, FD - 0.10, 0.07), (0, 0, 0.365), marble, bevel=0.012, segs=1, uv=1.2)
zw.box('cornice', (FW, FD, 0.06), (0, 0, 0.42), gold if STYLE in ('azure', 'gold') else marble, bevel=0.015, segs=1, uv=1.2)
for s in (-1, 1):
    for i in range(22):
        zw.box('mutule', (0.14, 0.26, 0.04), ((i - 10.5) * 0.32, s * (BD / 2 + 0.20), 0.325), marble)
    for i in range(14):
        zw.box('mutule', (0.26, 0.14, 0.04), (s * (BW / 2 + 0.16), (i - 6.5) * 0.32, 0.325), marble)

# the two slopes: stepped courses of pan tiles with rows of half-round cover tiles
def on_slope(o, s):
    """Slope space: x along the eave, y up the slope from the eave, z out of the roof."""
    m = Matrix(((1, 0, 0, 0), (0, -s * math.cos(PITCH), s * math.sin(PITCH), s * Y0), (0, math.sin(PITCH), math.cos(PITCH), E), (0, 0, 0, 1)))
    o.data.transform(m); return o

K, COLS, PITCHX = 9, 23, 0.315
LC = SL / K
for s in (-1, 1):
    for k in range(K):
        y = (k + 0.5) * LC
        c = zw.box('pan', (FW - 0.04, LC + 0.05, 0.035), (0, y, 0.03), tiles[k % 3], uv=0.7)
        zw.turn(c, x=0.045); on_slope(c, s)                 # each course tips up at its lower edge
        on_slope(zw.box('lip', (FW - 0.04, 0.035, 0.05), (0, k * LC + 0.02, 0.04), tiles[(k + 1) % 3], uv=0.7), s)
        for i in range(COLS):
            x = (i - (COLS - 1) / 2) * PITCHX + rnd.uniform(-0.006, 0.006)
            on_slope(zw.rod('cover', (x, k * LC - 0.02, 0.075), (x, (k + 1) * LC + 0.015, 0.058), 0.07, tiles[(i + k) % 3], segs=7, r2=0.056, uv=0.7), s)
    for i in range(COLS):                                    # antefix at the eave end of every cover row
        x = (i - (COLS - 1) / 2) * PITCHX
        a = zw.blob('antefix', (0.075, 0.035, 0.10), (x, -0.01, 0.13), finial, 6, 4); on_slope(a, s)
# ridge tiles
n = 17
for i in range(n):
    x = (i - (n - 1) / 2) * (FW / n)
    zw.cylinder('ridge', 0.105, 0.09, FW / n + 0.03, (x, 0, E + RISE + 0.03), ridge_mat, axis='X', segs=8, uv=0.7)
    zw.torus('ridge_band', 0.103, 0.014, (x - FW / n / 2 + 0.02, 0, E + RISE + 0.03), ridge_mat, axis='X', seg=8, tube=4)

# pediments on the two ends: tympanum, raking cornice, gold bolt, acroteria
TY = BD / 2 - 0.05; TZ = TY * math.tan(PITCH)
for s in (-1, 1):
    zw.prism('tympanum', [(-TY, E), (TY, E), (0, E + TZ)], 0.24, marble, axis='X', centre=(s * (BW / 2 - 0.10), 0, 0), uv=1.2)
    for t in (-1, 1):
        r = zw.box('rake', (0.42, SL + 0.10, 0.12), (0, SL / 2 - 0.02, -0.05), marble, bevel=0.015, segs=1, uv=1.2)
        r.data.transform(Matrix.Translation((s * (FW / 2 - 0.20), 0, 0))); on_slope(r, t)
        g = zw.box('rake_trim', (0.46, SL + 0.12, 0.035), (0, SL / 2 - 0.02, 0.022), gold if STYLE in ('azure', 'gold') else marble, uv=1.2)
        g.data.transform(Matrix.Translation((s * (FW / 2 - 0.20), 0, 0))); on_slope(g, t)
    b = zw.bolt('bolt', 0.52, (0, 0, 0), gold, depth=0.04)
    zw.turn(b, z=s * math.pi / 2); b.data.transform(Matrix.Translation((s * (BW / 2 + 0.035), 0, E + TZ * 0.42)))
    zw.lathe('acroterion', [(0.0, 0), (0.10, 0), (0.12, 0.05), (0.07, 0.10), (0.11, 0.20), (0.06, 0.32), (0.0, 0.40)], finial, centre=(s * (FW / 2 - 0.20), 0, E + RISE + 0.10), segs=8, uv=0.5)
    for t in (-1, 1):
        zw.lathe('acroterion', [(0.0, 0), (0.09, 0), (0.10, 0.04), (0.06, 0.09), (0.09, 0.17), (0.0, 0.28)], finial, centre=(s * (FW / 2 - 0.20), t * (FD / 2 - 0.16), E + 0.14), segs=8, uv=0.5)

zw.bake_shading(dist=0.5, keep=('pan', 'lip', 'ent', 'cornice', 'rake', 'rake_trim'))
zw.export(OUT)
