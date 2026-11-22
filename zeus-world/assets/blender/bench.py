# decor_bench_t1_marble: backless marble bench, 1.5 m long, lion-paw legs, meander band, gold bolt.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import zw

zw.reset()
marble = zw.material('marble', *zw.tex_marble(512), rough=0.35)
band = zw.material('meander', *zw.tex_meander(), rough=0.45)
gold = zw.material('gold', zw.PALETTE['gold'], rough=0.25, metal=1.0)

L, D, H, T = 1.5, 0.52, 0.62, 0.13          # length, depth, total height, seat thickness
zw.box('seat', (L, D, T), (0, 0, H - T / 2), marble, bevel=0.022, segs=3, uv=0.9)
# meander band along the front and back edges (texture repeats every 0.3 m)
for s in (-1, 1):
    b = zw.box('band', (L - 0.14, 0.006, 0.062), (0, s * (D / 2 + 0.001), H - T / 2), band)
    uv = b.data.uv_layers[0]
    for p in b.data.polygons:
        for li in p.loop_indices:
            co = b.data.vertices[b.data.loops[li].vertex_index].co
            uv.data[li].uv = (co.x / 0.496, (co.z - (H - T / 2) + 0.031) / 0.062)
zw.bolt('bolt', 0.085, (0, -D / 2 - 0.008, H - T / 2), gold, depth=0.012)

# legs: a console profile (wide under the seat, narrow waist, flared foot), with paws front and back
hz = H - T
prof = [(-0.20, hz), (0.20, hz), (0.21, hz - 0.05), (0.15, hz - 0.11), (0.11, hz * 0.55), (0.12, 0.16), (0.17, 0.09),
        (0.17, 0.0), (-0.17, 0.0), (-0.17, 0.09), (-0.12, 0.16), (-0.11, hz * 0.55), (-0.15, hz - 0.11), (-0.21, hz - 0.05)]
for sx in (-1, 1):
    x = sx * (L / 2 - 0.22)
    zw.prism('leg', prof, 0.17, marble, axis='X', centre=(x, 0, 0), bevel=0.012, uv=0.9)
    for sy in (-1, 1):
        for k in (-1, 0, 1):   # three toes
            zw.blob('toe', (0.034, 0.05, 0.036), (x + k * 0.055, sy * 0.185, 0.034), marble)
        zw.blob('knuckle', (0.09, 0.05, 0.05), (x, sy * 0.165, 0.085), marble)

zw.export(sys.argv[-1])
