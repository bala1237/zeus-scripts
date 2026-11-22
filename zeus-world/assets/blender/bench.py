# decor_bench_t1_marble: backless marble bench, 1.5 m long, scroll legs on lion paws, meander band, gold bolt.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import zw

zw.reset()
marble = zw.material('marble', *zw.tex_marble(512), rough=0.35)
band = zw.material('meander', *zw.tex_meander(), rough=0.45)
gold = zw.material('gold', zw.PALETTE['gold'], rough=0.25, metal=1.0)

L, D, H = 1.5, 0.52, 0.62
T = 0.105                                     # seat slab thickness
zs = H - T / 2
zw.wobble(zw.refine(zw.box('seat', (L, D, T), (0, 0, zs), marble, bevel=0.024, segs=2, uv=0.9), 0.4), 0.003, 2.0, 1)
# mouldings under the seat: a stepped bed, then the band course
zw.box('bed', (L - 0.07, D - 0.07, 0.03), (0, 0, H - T - 0.015), marble, bevel=0.01, uv=0.9)
zw.box('course', (L - 0.13, D - 0.13, 0.05), (0, 0, H - T - 0.055), marble, bevel=0.012, uv=0.9)
# meander band along the front and back edges of the slab (one key every 6 cm)
for s in (-1, 1):
    b = zw.box('band', (L - 0.16, 0.006, 0.058), (0, s * (D / 2 + 0.0015), zs), band)
    uv = b.data.uv_layers[0]
    for p in b.data.polygons:
        for li in p.loop_indices:
            co = b.data.vertices[b.data.loops[li].vertex_index].co
            uv.data[li].uv = (co.x / 0.496, (co.z - zs + 0.029) / 0.058)
zw.bolt('bolt', 0.09, (0, -D / 2 - 0.009, zs), gold, depth=0.014)

# legs: a carved console. S-curved profile, scroll rolls under the seat, fluted face, lion paws below
hz = H - T - 0.08                              # underside of the mouldings
def profile(n=9):
    """Half outline (y >= 0) from top to bottom: wide shoulder, narrow waist, flared ankle."""
    pts = []
    for i in range(n + 1):
        t = i / n; z = hz * (1 - t)
        y = 0.105 + 0.085 * math.cos(t * math.pi * 0.95) ** 2 + 0.03 * math.sin(t * math.pi) * -1 + (0.05 * (t - 0.8) / 0.2 if t > 0.8 else 0)
        pts.append((y, z))
    return pts
half = profile()
outline = [(-y, z) for y, z in half] + [(y, z) for y, z in reversed(half)]
LEGW = 0.19
for sx in (-1, 1):
    x = sx * (L / 2 - 0.25)
    zw.prism('leg', outline, LEGW, marble, axis='X', centre=(x, 0, 0), bevel=0.01, uv=0.9)
    for sy in (-1, 1):
        # scroll rolls: a cylinder across the leg with a raised eye on each end
        yr, zr = sy * 0.175, hz - 0.075
        zw.cylinder('roll', 0.072, 0.072, LEGW + 0.035, (x, yr, zr), marble, axis='X', segs=12, bevel=0.0, uv=0.9)
        for e in (-1, 1):
            zw.cylinder('eye', 0.034, 0.022, 0.02, (x + e * (LEGW / 2 + 0.022), yr, zr), marble, axis='X', segs=12)
            zw.torus('volute', 0.05, 0.008, (x + e * (LEGW / 2 + 0.018), yr, zr), marble, axis='X', seg=12, tube=4)
        # three flutes down the face of the leg
        for k in (-1, 0, 1):
            zw.box('flute', (0.03, 0.012, hz * 0.34), (x + k * 0.052, sy * 0.107, hz * 0.50), marble, bevel=0.005)
        # paw: ankle, four toes, claws
        zw.blob('ankle', (0.10, 0.075, 0.07), (x, sy * 0.155, 0.10), marble, 8, 5)
        for k in range(4):
            tx = x + (k - 1.5) * 0.046
            zw.blob('toe', (0.026, 0.058, 0.034), (tx, sy * 0.205, 0.036), marble, 7, 4)
            zw.blob('knuckle', (0.024, 0.03, 0.03), (tx, sy * 0.185, 0.062), marble, 6, 4)
            zw.cylinder('claw', 0.011, 0.002, 0.03, (tx, sy * 0.262, 0.018), marble, axis='Y' if sy > 0 else 'Y', segs=6)

zw.bake_shading(dist=0.35)
zw.export(sys.argv[-1])
