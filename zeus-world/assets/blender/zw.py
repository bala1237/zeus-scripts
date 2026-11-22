# Shared helpers for scripted Zeus World models (Blender as a Python module: pip install bpy pillow).
# Conventions from the asset bible: 1 unit = 1 m, origin bottom centre, ground at z = 0 in Blender,
# front faces -Y in Blender (which the glTF exporter turns into +Z).
import math, os, tempfile
import bpy, bmesh
from PIL import Image as PILImage
import numpy as np
from mathutils import Matrix, Vector

PALETTE = {
    'marble': (0.949, 0.933, 0.902), 'plaster': (0.918, 0.851, 0.737), 'terracotta': (0.769, 0.404, 0.227),
    'azure': (0.184, 0.435, 0.690), 'gold': (0.886, 0.702, 0.290), 'bronze': (0.604, 0.416, 0.227),
    'olive': (0.431, 0.545, 0.239), 'ochre': (0.82, 0.62, 0.30), 'cream': (0.93, 0.89, 0.80), 'red': (0.659, 0.196, 0.176), 'stone': (0.71, 0.66, 0.58),
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


# ---------- textures (numpy, tileable) ----------
def _lin(c):  # sRGB colour to linear, for scalar material inputs
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)


def noise(n, cells, rng):
    """Tileable value noise, n x n, with `cells` lattice cells per side."""
    g = rng.random((cells, cells))
    t = np.arange(n) * cells / n
    i = t.astype(int); f = t - i; f = f * f * (3 - 2 * f)
    i1 = (i + 1) % cells
    a = g[i][:, i] * (1 - f)[None, :] + g[i][:, i1] * f[None, :]
    b = g[i1][:, i] * (1 - f)[None, :] + g[i1][:, i1] * f[None, :]
    return a * (1 - f)[:, None] + b * f[:, None]


def fbm(n, seed, base=4, octaves=5):
    rng = np.random.default_rng(seed); out = np.zeros((n, n)); amp = 1; tot = 0
    for o in range(octaves):
        out += noise(n, base * 2 ** o, rng) * amp; tot += amp; amp *= 0.5
    return out / tot


def image(name, rgb, srgb=True):
    """numpy (h, w, 3) floats 0..1, row 0 at the top -> packed Blender image (written through a PNG file:
    pixels set straight into a new image do not survive the glTF export)."""
    path = os.path.join(tempfile.gettempdir(), f'zw_{name}.png')
    PILImage.fromarray((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB').save(path)
    img = bpy.data.images.load(path); img.name = name
    img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    img.pack()
    return img


def normal_map(height, strength=2.0):
    dx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * strength * height.shape[1] / 64
    dy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * strength * height.shape[0] / 64
    n = np.dstack([-dx, dy, np.ones_like(height)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n * 0.5 + 0.5


def material(name, color, normal=None, rough=0.7, metal=0.0):
    """color: an RGB tuple from the palette or a Blender image."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if isinstance(color, tuple):
        b.inputs['Base Color'].default_value = (*_lin(color), 1)
    else:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = color; nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if normal is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = normal
        nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m


TEX_DIR = os.path.join(os.path.dirname(__file__), 'textures')


def tex_photo(asset, name, size=1024, tint=None, mix=0.0, gain=1.0, contrast=1.0, rot=False, nstrength=1.0):
    """A CC0 Poly Haven texture set (textures/<asset>_diff.jpg and _nor.jpg), graded towards the palette:
    tint/mix pull the colour to a palette family while keeping the photographed detail as light and dark,
    gain and contrast set the overall value, rot turns the pattern a quarter turn."""
    d = np.asarray(PILImage.open(os.path.join(TEX_DIR, f'{asset}_diff.jpg')).convert('RGB').resize((size, size)), dtype=np.float64) / 255
    n = np.asarray(PILImage.open(os.path.join(TEX_DIR, f'{asset}_nor.jpg')).convert('RGB').resize((size, size)), dtype=np.float64) / 255
    lum = d @ np.array([0.3, 0.59, 0.11]); mean = lum.mean()
    if tint is not None:
        flat = np.array(tint)[None, None, :] * (lum / mean)[..., None]
        d = d * (1 - mix) + flat * mix
    d = np.clip((d - mean) * contrast + mean, 0, 1) * gain
    n = (n - 0.5) * np.array([nstrength, nstrength, 1.0]) + 0.5
    if rot:
        d = np.rot90(d).copy(); n = np.rot90(n).copy()
        n = np.dstack([1 - n[..., 1], n[..., 0], n[..., 2]])
    return image(name, d), image(name + '_n', n, srgb=False)



def tex_marble(n=512, seed=1):
    f = fbm(n, seed, 3, 6); g = fbm(n, seed + 9, 2, 5)
    vein = np.clip(1 - np.abs(np.sin((f * 2.0 + g * 1.4) * math.pi)) * 5.0, 0, 1) ** 1.6     # thin drifting veins
    fine = np.clip(1 - np.abs(np.sin((fbm(n, seed + 5, 5, 5) * 3.1 + f) * math.pi)) * 7.0, 0, 1) ** 2  # hairlines
    cloud = fbm(n, seed + 3, 2, 4); warm = fbm(n, seed + 7, 3, 3)
    base = np.array(PALETTE['marble'])[None, None, :] * (0.70 + 0.24 * cloud)[..., None]
    base = base * (1 - 0.10 * warm[..., None] * np.array([0.0, 0.25, 1.0])[None, None, :])     # faint cream patches
    k = np.clip(0.75 * vein + 0.35 * fine, 0, 1)[..., None]
    col = base * (1 - k) + np.array([0.45, 0.46, 0.50])[None, None, :] * k
    return image(f'marble{seed}', col), image(f'marble{seed}_n', normal_map(f * 0.15 - vein * 0.06, 1.0), srgb=False)


def tex_ashlar(n=1024, rows=4, cols=2, seed=2, tint=PALETTE['stone']):
    """Running-bond stone blocks. One tile covers `cols` blocks across and `rows` courses up."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:n, 0:n] / n
    row = np.floor(y * rows).astype(int); xo = (x + 0.5 / cols * (row % 2)) % 1.0
    col = np.floor(xo * cols).astype(int)
    fy = y * rows - row; fx = xo * cols - col
    aspect = rows / cols  # block height / width, so the joint is the same width both ways
    edge = np.minimum(np.minimum(fx, 1 - fx) / aspect, np.minimum(fy, 1 - fy))
    block = np.clip(edge / 0.07, 0, 1) ** 0.6               # 0 in the joint, 1 on the face, rounded shoulder
    tone = rng.uniform(0.86, 1.08, (rows, cols))[row, col]
    warm = rng.uniform(-0.03, 0.03, (rows, cols))[row, col]
    grain = fbm(n, seed + 1, 8, 5); blotch = fbm(n, seed + 2, 3, 4)
    v = tone * (0.90 + 0.14 * grain + 0.08 * (blotch - 0.5))
    c = np.dstack([tint[0] * v + warm, tint[1] * v, tint[2] * v - warm])
    joint = np.array([0.36, 0.33, 0.29])
    c = c * block[..., None] + joint[None, None, :] * (1 - block[..., None])
    height = block * 0.8 + grain * 0.12
    return image('ashlar', c), image('ashlar_n', normal_map(height, 2.2), srgb=False)


def tex_planks(n=256, planks=4, seed=3, tint=PALETTE['azure']):
    y, x = np.mgrid[0:n, 0:n] / n
    p = np.floor(x * planks).astype(int); fx = x * planks - p
    rng = np.random.default_rng(seed)
    gap = np.clip(np.minimum(fx, 1 - fx) / 0.06, 0, 1)
    grain = fbm(n, seed, 2, 5)[:, (np.arange(n) * 7) % n]            # stretched along the plank
    streak = np.repeat(fbm(n, seed + 4, 24, 3)[:1], n, 0)
    v = rng.uniform(0.9, 1.06, planks)[p] * (0.88 + 0.16 * streak + 0.06 * grain)
    c = np.dstack([tint[i] * v for i in range(3)]) * (0.45 + 0.55 * gap[..., None])
    return image('planks', c), image('planks_n', normal_map(gap * 0.7 + streak * 0.15, 1.6), srgb=False)


def tex_meander(w=512, h=64):
    """One repeat of a Greek key band carved into marble (dark = carved)."""
    u = 8; cells_w, cells_h = w // u, h // u
    g = np.zeros((cells_h, cells_w))
    key = ["11111110", "10000010", "10111010", "10100010", "10111110", "10000000"]   # one key, 8 cells wide
    for r, line in enumerate(key):
        for c in range(cells_w):
            g[1 + r, c] = int(line[c % 8])
    g[0, :] = 0; g[-1, :] = 0
    m = np.kron(g, np.ones((u, u)))
    k = np.ones(5) / 5
    for ax in (0, 1):
        m = np.apply_along_axis(lambda v: np.convolve(np.concatenate([v[-2:], v, v[:2]]), k, 'valid'), ax, m)
    base = np.array(PALETTE['marble'])[None, None, :]
    c = base * (1 - 0.38 * m[..., None])
    return image('meander', np.broadcast_to(c, (h, w, 3)).copy()), image('meander_n', normal_map(-m, 3.0), srgb=False)


# ---------- meshes ----------
def obj_from_bm(name, bm, mat, smooth_angle=40):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(smooth_angle))
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if mat: me.materials.append(mat)
    return o


def box(name, size, centre, mat, bevel=0.0, segs=2, uv=1.0):
    """Axis-aligned box with optionally rounded edges; uv = metres per texture tile."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation(centre) @ Matrix.Diagonal((*size, 1)))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=segs, affect='EDGES', profile=0.5)
    o = obj_from_bm(name, bm, mat); box_uv(o, uv)
    return o


def prism(name, outline, depth, mat, axis='X', centre=(0, 0, 0), bevel=0.0, uv=1.0):
    """Extrude a 2D outline. axis X: outline is (y, z), extruded along x. axis Y: outline is (x, z), along y."""
    bm = bmesh.new()
    def P(a, b, d):
        return Vector((d, a, b)) if axis == 'X' else Vector((a, d, b))
    lo = [bm.verts.new(P(a, b, -depth / 2)) for a, b in outline]
    hi = [bm.verts.new(P(a, b, depth / 2)) for a, b in outline]
    n = len(outline)
    bm.faces.new(lo); bm.faces.new(hi[::-1])
    for i in range(n):
        bm.faces.new([lo[i], hi[i], hi[(i + 1) % n], lo[(i + 1) % n]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, affect='EDGES', profile=0.5)
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=Vector(centre))
    o = obj_from_bm(name, bm, mat); box_uv(o, uv)
    return o


def blob(name, radii, centre, mat, u=10, v=6):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1,
                              matrix=Matrix.Translation(centre) @ Matrix.Diagonal((*radii, 1)))
    o = obj_from_bm(name, bm, mat, 80); box_uv(o, 1.0)
    return o


def box_uv(o, scale=1.0):
    """World-space box projection, so tiling textures keep one real-world size on every model."""
    me = o.data; uvl = me.uv_layers.new(name='UVMap') if not me.uv_layers else me.uv_layers[0]
    for p in me.polygons:
        n = p.normal; a = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][a]
            uvl.data[li].uv = (u / scale, v / scale)


def cut(o, cutters):
    """Boolean-subtract boxes from an object and bake the result."""
    for c in cutters:
        m = o.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = c; m.solver = 'EXACT'
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear(); old = o.data; o.data = me; bpy.data.meshes.remove(old)
    for c in cutters: bpy.data.objects.remove(c, do_unlink=True)
    me.set_sharp_from_angle(angle=math.radians(40))
    return o


BOLT = [(-0.10, 1.0), (0.42, 1.0), (0.10, 0.52), (0.40, 0.52), (-0.22, -0.30), (-0.02, 0.28), (-0.34, 0.28)]


def bolt(name, height, centre, mat, depth=0.02):
    """The gold lightning bolt, facing -Y (the front)."""
    pts = [(x * height / 1.3, (z - 0.35) * height / 1.3) for x, z in BOLT]
    return prism(name, pts, depth, mat, axis='Y', centre=centre)


def cylinder(name, r1, r2, depth, centre, mat, axis='Z', segs=16, uv=1.0, bevel=0.0):
    """Cylinder or cone frustum along an axis (r1 at the low end, r2 at the high end)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r1, radius2=r2, depth=depth)
    if bevel > 0:
        caps = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6]
        bmesh.ops.bevel(bm, geom=caps, offset=bevel, segments=2, affect='EDGES', profile=0.5)
    rot = {'Z': Matrix.Identity(4), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(-math.pi / 2, 4, 'X')}[axis]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centre) @ rot, verts=bm.verts[:])
    o = obj_from_bm(name, bm, mat, 50); box_uv(o, uv)
    return o


def torus(name, R, r, centre, mat, axis='Y', seg=16, tube=8):
    """Ring (door knocker, wreath) whose hole faces along `axis`."""
    bm = bmesh.new(); rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg; row = []
        for j in range(tube):
            b = 2 * math.pi * j / tube
            row.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        rows.append(row)
    for i in range(seg):
        for j in range(tube):
            bm.faces.new([rows[i][j], rows[(i + 1) % seg][j], rows[(i + 1) % seg][(j + 1) % tube], rows[i][(j + 1) % tube]])
    rot = {'Z': Matrix.Identity(4), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X'), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y')}[axis]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centre) @ rot, verts=bm.verts[:])
    o = obj_from_bm(name, bm, mat, 80); box_uv(o, 1.0)
    return o


def rod(name, p0, p1, r, mat, segs=8, r2=None, uv=1.0):
    """A pole, beam or rope between two points."""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=d.length)
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ rot, verts=bm.verts[:])
    o = obj_from_bm(name, bm, mat, 50); box_uv(o, uv)
    return o


def beam(name, p0, p1, w, h, mat, bevel=0.0, uv=1.0):
    """A squared timber between two points (w across, h up when it lies flat)."""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Diagonal((w, h, d.length, 1)))
    if bevel > 0: bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=1, affect='EDGES', profile=0.5)
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ rot, verts=bm.verts[:])
    o = obj_from_bm(name, bm, mat); box_uv(o, uv)
    return o


def lathe(name, profile, mat, centre=(0, 0, 0), segs=16, uv=1.0, tilt=None, flutes=0, flute_depth=0.07):
    """Spin a (radius, height) profile about the vertical axis: pots, amphorae, column drums, finials."""
    bm = bmesh.new(); rings = []
    for r, z in profile:
        fl = (lambda i: 1 - flute_depth * (0.5 - 0.5 * math.cos(2 * math.pi * flutes * i / segs))) if flutes else (lambda i: 1)
        rings.append([bm.verts.new((r * fl(i) * math.cos(2 * math.pi * i / segs), r * fl(i) * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            bm.faces.new([a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]])
    if profile[0][0] > 1e-6: bm.faces.new(rings[0][::-1])
    if profile[-1][0] > 1e-6: bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    m = Matrix.Translation(centre)
    if tilt: m = m @ Matrix.Rotation(tilt[0], 4, tilt[1])
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts[:])
    o = obj_from_bm(name, bm, mat, 50)
    # wrap the texture round the pot instead of projecting it from the sides
    uvl = o.data.uv_layers.new(name='UVMap')
    inv = m.inverted(); rep = round(max(1, 2 * math.pi * max(r for r, _ in profile) / uv))
    for p in o.data.polygons:
        c = inv @ p.center; ac = math.atan2(c.y, c.x)
        for li in p.loop_indices:
            co = inv @ o.data.vertices[o.data.loops[li].vertex_index].co
            a = math.atan2(co.y, co.x) if (co.x * co.x + co.y * co.y) > 1e-10 else ac
            if a - ac > math.pi: a -= 2 * math.pi
            if a - ac < -math.pi: a += 2 * math.pi
            uvl.data[li].uv = (a / (2 * math.pi) * rep, co.z / uv)
    return o


def tex_mottled(name, color, n=256, seed=1, amount=0.22, grain=0.08, bump=0.5):
    """A palette colour with soft blotches and fine grain: terracotta, bronze patina, painted metal, rope."""
    blot = fbm(n, seed, 3, 5); fine = fbm(n, seed + 1, 24, 3)
    v = 1 - amount / 2 + amount * blot + grain * (fine - 0.5)
    c = np.array(color)[None, None, :] * v[..., None]
    return image(name, c), image(name + '_n', normal_map(blot * 0.3 + fine * 0.25, bump), srgb=False)


def refine(o, max_len=0.35):
    """Split long edges so there are enough points for baked shading and for hand-made wobble."""
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    for _ in range(8):
        long = [e for e in bm.edges if e.calc_length() > max_len]
        if not long: break
        bmesh.ops.subdivide_edges(bm, edges=long, cuts=1)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(o.data); bm.free()
    return o


def wobble(o, amp=0.008, scale=1.6, seed=0):
    """Push every point a few millimetres with smooth noise: the hand-made, slightly uneven look."""
    from mathutils import noise as mn
    off = Vector((seed * 13.1, seed * 7.7, seed * 3.3))
    for v in o.data.vertices:
        v.co += Vector(mn.noise_vector(v.co * scale + off)) * amp
    return o


def bake_shading(samples=40, dist=0.75, floor=0.38, keep=()):
    """keep: names of long parts to leave unsplit. Soft contact shadows baked into vertex colours (under cornices, around frames, where things meet the
    ground). The game multiplies them into the material, so the model has depth even in flat light."""
    from mathutils.bvhtree import BVHTree
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in objs:   # long parts need a few extra points, or a shadow at one end smears along the whole length
        if o.name.split('.')[0] in keep: continue      # parts that are evenly shaded along their length stay as they are
        if max(((o.data.vertices[e.vertices[0]].co - o.data.vertices[e.vertices[1]].co).length for e in o.data.edges), default=0) > 1.2:
            refine(o, 0.8)
    verts, polys, n0 = [], [], 0
    for o in objs:
        verts += [v.co.copy() for v in o.data.vertices]
        polys += [[n0 + i for i in p.vertices] for p in o.data.polygons]; n0 += len(o.data.vertices)
    bvh = BVHTree.FromPolygons(verts, polys)
    rng = np.random.default_rng(4); d = rng.normal(size=(samples * 2, 3)); d /= np.linalg.norm(d, axis=1, keepdims=True)
    dirs = [Vector(v) for v in d]
    for o in objs:
        me = o.data
        col = me.color_attributes.new('Color', 'BYTE_COLOR', 'CORNER'); cache = {}
        for p in me.polygons:
            n = p.normal
            for li in p.loop_indices:
                vi = me.loops[li].vertex_index; key = (vi, round(n.x, 1), round(n.y, 1), round(n.z, 1))
                if key not in cache:
                    o0 = me.vertices[vi].co + n * 0.02; occ = tot = 0.0
                    for r in dirs:
                        c = r.dot(n)
                        if c <= 0.05: continue
                        tot += c
                        if r.z < 0 and o0.z + r.z * dist < 0:        # the ground
                            occ += c * 0.7 * (1 - (o0.z / -r.z) / dist); continue
                        hit = bvh.ray_cast(o0, r, dist)
                        if hit[0] is not None: occ += c * (1 - hit[3] / dist) ** 0.7
                    cache[key] = 1 - occ / tot if tot else 1
                a = floor + (1 - floor) * cache[key]
                col.data[li].color = (a, a, a, 1)
        me.color_attributes.active_color = col


def turn(o, x=0.0, y=0.0, z=0.0):
    """Rotate an object about its own centre (models are built in world space, so a plain rotation would
    swing it round the scene origin instead)."""
    from mathutils import Euler
    c = sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices)
    o.data.transform(Matrix.Translation(c) @ Euler((x, y, z)).to_matrix().to_4x4() @ Matrix.Translation(-c))
    return o


def apply_transforms():
    """Bake object rotations and positions into the mesh points, so later steps can work in world space."""
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and o.matrix_basis != Matrix.Identity(4):
            o.data.transform(o.matrix_basis); o.matrix_basis = Matrix.Identity(4)


def merge_by_material():
    """One mesh per material: far fewer draw calls in the game and a much smaller file."""
    groups = {}
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        groups.setdefault(o.data.materials[0] if o.data.materials else None, []).append(o)
    for mat, objs in groups.items():
        bm = bmesh.new()
        for o in objs: bm.from_mesh(o.data)
        me = bpy.data.meshes.new(mat.name if mat else 'mesh'); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = True
        me.set_sharp_from_angle(angle=math.radians(40))
        if mat: me.materials.append(mat)
        for o in objs: bpy.data.objects.remove(o, do_unlink=True)
        bpy.context.scene.collection.objects.link(bpy.data.objects.new(me.name, me))


def export(path):
    apply_transforms(); merge_by_material()
    tris = sum(len(p.vertices) - 2 for o in bpy.context.scene.objects if o.type == 'MESH' for p in o.data.polygons)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True,
                              export_image_format='WEBP', export_image_quality=85,
                              export_vertex_color='ACTIVE', export_all_vertex_colors=False,
                              export_active_vertex_color_when_no_material=True)
    print(f'{path}: {tris} triangles')
