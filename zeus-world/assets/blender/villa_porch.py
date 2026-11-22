# home_villa-porch_<tier>_<style>: columned porch for the villa. Origin at the middle of its back edge, on the
# ground: place it at the wall front (z = 2.2 m from the house centre). 6.6 m wide, 1.9 m deep, 3.1 m high.
#   python villa_porch.py <doric|ionic> out.glb
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import zw

STYLE, OUT = sys.argv[-2], sys.argv[-1]
zw.reset(); P = zw.PALETTE
marble = zw.material('marble', *zw.tex_marble(512, seed=5), rough=0.4)
step = zw.material('step', *zw.tex_marble(512, seed=11), rough=0.45)
gold = zw.material('gold', P['gold'], rough=0.25, metal=1.0)
accent = gold if STYLE == 'ionic' else marble
W, D, H = 6.6, 1.9, 3.1
FLOOR = 0.36
# three steps up to the floor
for i, (w, d) in enumerate(((W, D), (W - 0.34, D - 0.17), (W - 0.68, D - 0.34))):
    zw.wobble(zw.refine(zw.box('step', (w, d, 0.12), (0, -d / 2, 0.06 + i * 0.12), step, bevel=0.015, segs=1, uv=1.0), 0.5), 0.003, 2.0, i)

CY = -(D - 0.34) + 0.30                     # column row
TOP = 2.62                                  # underside of the entablature
xs = (-2.72, -0.98, 0.98, 2.72)             # wider middle bay for the door
for x in xs:
    if STYLE == 'doric':
        r0, r1 = 0.20, 0.158; z0 = FLOOR; zs = TOP - 0.19
        prof = [(r0, z0)] + [(r0 - (r0 - r1) * (t ** 1.6), z0 + (zs - z0) * t) for t in (0.2, 0.4, 0.6, 0.8, 1.0)]
        zw.lathe('shaft', prof, marble, centre=(x, CY, 0), segs=40, uv=0.9, flutes=20, flute_depth=0.085)
        for k in range(3):
            zw.torus('annulet', r1 + 0.006, 0.008, (x, CY, zs - 0.03 - k * 0.022), marble, axis='Z', seg=20, tube=4)
        zw.lathe('echinus', [(r1, zs), (r1 + 0.04, zs + 0.025), (0.262, zs + 0.085), (0.262, zs + 0.10)], marble, centre=(x, CY, 0), segs=20, uv=0.9)
        zw.box('abacus', (0.56, 0.56, 0.09), (x, CY, TOP - 0.045), marble, bevel=0.012, segs=1, uv=0.9)
    else:
        r0, r1 = 0.165, 0.138; z0 = FLOOR + 0.16; zs = TOP - 0.20
        zw.box('plinth', (0.46, 0.46, 0.06), (x, CY, FLOOR + 0.03), marble, bevel=0.01, segs=1, uv=0.9)
        zw.lathe('base', [(0.215, FLOOR + 0.06), (0.225, FLOOR + 0.085), (0.19, FLOOR + 0.105), (0.18, FLOOR + 0.12), (0.205, FLOOR + 0.14), (r0 + 0.01, z0)], accent, centre=(x, CY, 0), segs=20, uv=0.9)
        prof = [(r0, z0)] + [(r0 - (r0 - r1) * (t ** 1.6), z0 + (zs - z0) * t) for t in (0.2, 0.4, 0.6, 0.8, 1.0)]
        zw.lathe('shaft', prof, marble, centre=(x, CY, 0), segs=48, uv=0.9, flutes=24, flute_depth=0.075)
        zw.lathe('necking', [(r1, zs), (r1 + 0.03, zs + 0.03), (r1 + 0.05, zs + 0.07)], accent, centre=(x, CY, 0), segs=20, uv=0.9)
        for s in (-1, 1):                    # volutes: a roll across the capital on each side, with gold eyes
            zw.cylinder('volute', 0.085, 0.085, 0.44, (x + s * 0.20, CY, zs + 0.075), marble, axis='Y', segs=14, uv=0.9)
            for f in (-1, 1):
                zw.torus('scroll', 0.058, 0.012, (x + s * 0.20, CY + f * 0.222, zs + 0.075), accent, axis='Y', seg=14, tube=5)
                zw.cylinder('eye', 0.03, 0.02, 0.02, (x + s * 0.20, CY + f * 0.228, zs + 0.075), gold, axis='Y', segs=10)
        zw.box('cushion', (0.40, 0.42, 0.06), (x, CY, zs + 0.11), marble, bevel=0.01, segs=1, uv=0.9)
        zw.box('abacus', (0.50, 0.50, 0.06), (x, CY, TOP - 0.03), accent, bevel=0.012, segs=1, uv=0.9)

# entablature on three sides (the back meets the house): architrave, frieze, cornice slab as the porch roof
EW, ED = W - 0.5, D - 0.34 - 0.04           # outer size over the columns
def band(z, h, out, mat, bevel=0.012):
    zw.box('ent', (EW + 2 * out, 0.46 + out, h), (0, CY - out / 2, z), mat, bevel=bevel, segs=1, uv=1.2)
    for s in (-1, 1):
        zw.box('ent', (0.46 + out, -CY - 0.20, h), (s * (EW / 2 - 0.23 + out / 2), (CY + 0.20) / 2 - 0.02, z), mat, bevel=bevel, segs=1, uv=1.2)
band(TOP + 0.09, 0.18, 0.0, marble)
band(TOP + 0.255, 0.15, -0.02, marble, 0.0)
n = 19
for i in range(n):
    x = (i - (n - 1) / 2) * (EW - 0.2) / (n - 1)
    if STYLE == 'doric':
        for k in (-1, 0, 1):
            zw.box('triglyph', (0.035, 0.03, 0.15), (x + k * 0.045, CY - 0.225, TOP + 0.255), marble)
    else:
        zw.box('dentil', (0.09, 0.05, 0.07), (x, CY - 0.235, TOP + 0.30), marble)
if STYLE == 'ionic':
    zw.box('fillet', (EW + 0.02, 0.48, 0.035), (0, CY, TOP + 0.185), gold)
zw.box('cornice', (W - 0.06, D - 0.03, 0.07), (0, -(D - 0.03) / 2, H - 0.115), marble, bevel=0.012, segs=1, uv=1.2)
zw.box('cornice', (W, D, 0.08), (0, -D / 2, H - 0.04), marble, bevel=0.015, segs=1, uv=1.2)
if STYLE == 'ionic':
    zw.box('cornice_fillet', (W + 0.02, 0.03, 0.035), (0, -D - 0.005, H - 0.04), gold)
for i in range(21):
    zw.box('mutule', (0.14, 0.22, 0.04), ((i - 10) * 0.31, -D + 0.20, H - 0.17), marble)
zw.bolt('bolt', 0.24, (0, CY - 0.245, TOP + 0.165), gold, depth=0.03)

zw.bake_shading(dist=0.5, keep=('ent', 'cornice'))
zw.export(OUT)
