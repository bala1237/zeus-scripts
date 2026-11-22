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
    'olive': (0.431, 0.545, 0.239), 'red': (0.659, 0.196, 0.176), 'stone': (0.71, 0.66, 0.58),
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


def tex_marble(n=512, seed=1):
    f = fbm(n, seed, 3, 6); g = fbm(n, seed + 9, 2, 5)
    vein = np.clip(1 - np.abs(np.sin((f * 2.0 + g * 1.4) * math.pi)) * 5.0, 0, 1) ** 1.6   # thin drifting veins
    soft = fbm(n, seed + 3, 2, 4)
    base = np.array(PALETTE['marble'])[None, None, :] * (0.93 + 0.09 * soft)[..., None]
    col = base * (1 - 0.42 * vein[..., None]) + np.array([0.50, 0.50, 0.53])[None, None, :] * 0.42 * vein[..., None]
    return image('marble', col), image('marble_n', normal_map(f * 0.15 - vein * 0.05, 1.0), srgb=False)


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


def export(path):
    tris = sum(len(p.vertices) - 2 for o in bpy.context.scene.objects if o.type == 'MESH' for p in o.data.polygons)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True,
                              export_image_format='WEBP', export_image_quality=85)
    print(f'{path}: {tris} triangles')
