# Shared building parts for the scripted city: materials, columns, tiled roofs, walls with windows and doors,
# awnings, arches, curved seating. Every builder script imports this and calls finish(out) at the end.
import math, random
import bpy, bmesh, zw
from mathutils import Matrix, Vector

P = zw.PALETTE
_m = {}
CLOTH = {'red': P['red'], 'azure': P['azure'], 'ochre': P['ochre'], 'olive': P['olive'], 'cream': P['cream'], 'gold': (0.90, 0.72, 0.30)}
TILE = {'terracotta': (P['terracotta'], 0.8), 'azure': (P['azure'], 0.35), 'slate': ((0.42, 0.45, 0.50), 0.6), 'goldtile': (P['gold'], 0.3)}


def mat(name):
    """Materials by name, made on first use so each model only carries what it needs."""
    if name in _m: return _m[name]
    T, M = zw.tex_photo, zw.material
    if name[:-1] in TILE and name[-1] in '012':
        col, rough = TILE[name[:-1]]; g = (1.0, 0.9, 1.1)[int(name[-1])]
        _m[name] = M(name, *zw.tex_mottled(name, tuple(min(1, c * g) for c in col), seed=20 + int(name[-1]), amount=0.3, grain=0.12), rough=rough, metal=1.0 if name.startswith('gold') else 0.0)
        return _m[name]
    if name.startswith('cloth_'):
        _m[name] = M(name, *zw.tex_mottled(name, CLOTH[name[6:]], seed=len(name), amount=0.22, grain=0.25), rough=0.9); return _m[name]
    if name.startswith('paint_'):
        _m[name] = M(name, *zw.tex_mottled(name, P[name[6:]], seed=len(name) + 3, amount=0.2), rough=0.55); return _m[name]
    make = {
        'marble': lambda: M('marble', *zw.tex_marble(512, seed=5), rough=0.4),
        'step': lambda: M('step', *zw.tex_marble(512, seed=11), rough=0.45),
        'hall': lambda: M('hall', *T('marble_01', 'hall', 1024, tint=P['marble'], mix=0.9, gain=0.95, contrast=1.6), rough=0.45),
        'stone': lambda: M('stone', *T('castle_wall_slates', 'stone', 1024, tint=P['stone'], mix=0.5, gain=0.95), rough=0.9),
        'stone_dark': lambda: M('stone_dark', *T('castle_wall_slates', 'stone_dark', 512, tint=P['stone'], mix=0.5, gain=0.72), rough=0.9),
        'paving': lambda: M('paving', *T('cobblestone_square', 'paving', 1024, tint=P['cream'], mix=0.55, gain=0.92, contrast=1.25), rough=0.85),
        'plaster': lambda: M('plaster', *T('painted_plaster_wall', 'plaster', 512, tint=P['plaster'], mix=0.92, gain=1.0, contrast=2.2, nstrength=2.0), rough=0.85),
        'ochre': lambda: M('ochre', *T('painted_plaster_wall', 'ochre', 512, tint=P['ochre'], mix=0.9, gain=0.97, contrast=2.6, nstrength=2.0), rough=0.85),
        'cream': lambda: M('cream', *T('painted_plaster_wall', 'cream', 512, tint=P['cream'], mix=0.95, gain=1.02, contrast=1.2), rough=0.8),
        'wood': lambda: M('wood', *T('brown_planks_09', 'wood', 512, tint=(0.58, 0.42, 0.27), mix=0.75, gain=0.95, contrast=0.75, rot=True), rough=0.75),
        'wood_dark': lambda: M('wood_dark', *T('old_planks_02', 'wood_dark', 512, tint=(0.42, 0.30, 0.20), mix=0.6, gain=1.0, contrast=1.2), rough=0.8),
        'azure_wood': lambda: M('azure_wood', *T('blue_painted_planks', 'azure_wood', 512, tint=P['azure'], mix=0.85, gain=1.05, contrast=1.1, rot=True), rough=0.6),
        'olive_wood': lambda: M('olive_wood', *T('blue_painted_planks', 'olive_wood', 512, tint=P['olive'], mix=0.85, gain=0.95, contrast=1.1, rot=True), rough=0.6),
        'red_wood': lambda: M('red_wood', *T('blue_painted_planks', 'red_wood', 512, tint=P['red'], mix=0.85, gain=1.0, contrast=1.1, rot=True), rough=0.6),
        'terracotta': lambda: M('terracotta', *zw.tex_mottled('terracotta', P['terracotta'], seed=3, amount=0.28), rough=0.75),
        'bronze': lambda: M('bronze', *zw.tex_mottled('bronze', P['bronze'], seed=5, amount=0.3, grain=0.08, bump=0.25), rough=0.38, metal=1.0),
        'iron': lambda: M('iron', *zw.tex_mottled('iron', (0.22, 0.22, 0.24), seed=6, amount=0.3, bump=0.25), rough=0.5, metal=1.0),
        'rope': lambda: M('rope', *zw.tex_mottled('rope', (0.72, 0.62, 0.44), seed=7, amount=0.3, grain=0.3), rough=0.95),
        'earth': lambda: M('earth', *zw.tex_mottled('earth', (0.30, 0.22, 0.15), seed=11, amount=0.4, grain=0.3), rough=1.0),
        'sand': lambda: M('sand', *zw.tex_mottled('sand', (0.86, 0.76, 0.56), seed=12, amount=0.18, grain=0.25), rough=1.0),
        'leaf': lambda: M('leaf', *zw.tex_mottled('leaf', P['olive'], seed=13, amount=0.45, grain=0.3), rough=0.8),
        'leaf_dark': lambda: M('leaf_dark', *zw.tex_mottled('leaf_dark', (0.25, 0.38, 0.18), seed=14, amount=0.45, grain=0.3), rough=0.8),
        'bread': lambda: M('bread', *zw.tex_mottled('bread', (0.80, 0.56, 0.28), seed=15, amount=0.35, grain=0.2), rough=0.85),
        'coal': lambda: M('coal', (1.0, 0.42, 0.12), rough=0.7),
        'gold': lambda: M('gold', P['gold'], rough=0.25, metal=1.0),
        'dark': lambda: M('dark', (0.05, 0.06, 0.09), rough=0.9),
        'black_glaze': lambda: M('black_glaze', (0.07, 0.06, 0.06), rough=0.4),
        'flame': lambda: M('flame', (1.0, 0.72, 0.30), rough=0.6),
        'water': lambda: M('water', (0.20, 0.50, 0.62), rough=0.06),
        'parchment': lambda: M('parchment', (0.90, 0.84, 0.68), rough=0.8),
    }
    _m[name] = make[name](); return _m[name]


def moved(fn, m):
    """Run a builder and move everything it made by matrix m."""
    before = set(bpy.data.objects); r = fn()
    zw.apply_transforms()
    for o in set(bpy.data.objects) - before: o.data.transform(m)
    return r


def at(fn, x=0.0, y=0.0, z=0.0, rz=0.0, s=1.0):
    return moved(fn, Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Scale(s, 4))


# ---------------------------------------------------------------- columns
def doric(x, y, z, h, r=0.2, m='marble', segs=24, flutes=12):
    k = r / 0.5; zs = h - 0.46 * k; r1 = r * 0.8
    prof = [(r - (r - r1) * ((t / 5) ** 1.5), zs * t / 5) for t in range(6)]
    zw.lathe('shaft', prof, mat(m), centre=(x, y, z), segs=segs, uv=1.2, flutes=flutes, flute_depth=0.08)
    zw.lathe('echinus', [(r1, 0), (r1 + 0.08 * k, 0.05 * k), (0.60 * k, 0.20 * k), (0.60 * k, 0.25 * k)], mat(m), centre=(x, y, z + zs), segs=12, uv=1.2)
    zw.box('abacus', (1.24 * k, 1.24 * k, 0.21 * k), (x, y, z + zs + 0.355 * k), mat(m), bevel=0.02 * k, segs=1, uv=1.2)


def ionic(x, y, z, h, r=0.17, m='marble', accent='gold', segs=24, flutes=12, face='Y'):
    k = r / 0.165; z0 = 0.16 * k; zs = h - 0.20 * k; r1 = r * 0.84
    zw.box('plinth', (0.46 * k, 0.46 * k, 0.06 * k), (x, y, z + 0.03 * k), mat(m), segs=1, uv=1.2)
    zw.lathe('base', [(0.215 * k, 0.06 * k), (0.225 * k, 0.085 * k), (0.18 * k, 0.12 * k), (0.205 * k, 0.14 * k), (r, z0)], mat(accent), centre=(x, y, z), segs=12, uv=1.2)
    prof = [(r - (r - r1) * ((t / 5) ** 1.5), z0 + (zs - z0) * t / 5) for t in range(6)]
    zw.lathe('shaft', prof, mat(m), centre=(x, y, z), segs=segs, uv=1.2, flutes=flutes, flute_depth=0.07)
    ax = 'Y' if face == 'Y' else 'X'
    for s in (-1, 1):
        c = (x + s * 0.20 * k, y, z + zs + 0.075 * k) if ax == 'Y' else (x, y + s * 0.20 * k, z + zs + 0.075 * k)
        zw.cylinder('volute', 0.085 * k, 0.085 * k, 0.44 * k, c, mat(m), axis=ax, segs=10, uv=1.2)
        for f in (-1, 1):
            e = (c[0], c[1] + f * 0.225 * k, c[2]) if ax == 'Y' else (c[0] + f * 0.225 * k, c[1], c[2])
            zw.cylinder('eye', 0.045 * k, 0.03 * k, 0.03 * k, e, mat(accent), axis=ax, segs=8)
    zw.box('abacus', (0.50 * k, 0.50 * k, 0.12 * k), (x, y, z + h - 0.06 * k), mat(m), segs=1, uv=1.2)


def post(x, y, z, h, w=0.14, m='wood'):
    zw.box('post', (w, w, h), (x, y, z + h / 2), mat(m), bevel=w * 0.1, segs=1, uv=0.7)


# ---------------------------------------------------------------- roofs
def gable_roof(L, S, z, c=(0, 0), pitch=22, tile='terracotta', axis='X', k=1.0, tymp='marble', trim='marble', finial=None, bolt=True, ends=True):
    """Tiled gable roof. L = ridge length, S = span, z = eave height, k = tile size. axis is the ridge direction."""
    def build():
        Y0 = S / 2; A = math.radians(pitch); RISE = Y0 * math.tan(A); SL = Y0 / math.cos(A)
        t = [mat(f'{tile}{i}') for i in range(3)]
        def on(o, s):
            o.data.transform(Matrix(((1, 0, 0, 0), (0, -s * math.cos(A), s * math.sin(A), s * Y0), (0, math.sin(A), math.cos(A), z), (0, 0, 0, 1)))); return o
        K = max(3, round(SL / (0.62 * k))); PX = 0.34 * k; inset = 0.5 * k if ends else 0.02
        COLS = max(2, int((L - inset) / PX)); LC = SL / K
        for s in (-1, 1):
            for j in range(K):
                p = zw.box('pan', (L - inset, LC + 0.05 * k, 0.035 * k), (0, (j + 0.5) * LC, 0.03 * k), t[j % 3], uv=0.7 * k)
                zw.turn(p, x=0.045); on(p, s)
                on(zw.box('lip', (L - inset, 0.035 * k, 0.05 * k), (0, j * LC + 0.02 * k, 0.04 * k), t[(j + 1) % 3], uv=0.7 * k), s)
                for i in range(COLS):
                    x = (i - (COLS - 1) / 2) * PX
                    on(zw.rod('cover', (x, j * LC - 0.02 * k, 0.075 * k), (x, (j + 1) * LC + 0.015 * k, 0.058 * k), 0.07 * k, t[(i + j) % 3], segs=5, r2=0.056 * k, uv=0.7 * k), s)
            if finial:
                for i in range(COLS):
                    on(zw.blob('antefix', (0.075 * k, 0.04 * k, 0.08 * k), ((i - (COLS - 1) / 2) * PX, 0, 0.11 * k), mat(finial), 6, 4), s)
        n = max(2, round((L - inset) / (0.45 * k)))
        for i in range(n):
            zw.cylinder('ridge', 0.105 * k, 0.09 * k, (L - inset) / n + 0.03 * k, ((i - (n - 1) / 2) * (L - inset) / n, 0, z + RISE + 0.03 * k), t[1], axis='X', segs=7, uv=0.7 * k)
        if ends:
            TY = Y0 - 0.25 * k; TZ = TY * math.tan(A)
            for s in (-1, 1):
                zw.prism('tympanum', [(-TY, z), (TY, z), (0, z + TZ)], 0.24 * k, mat(tymp), axis='X', centre=(s * (L / 2 - 0.42 * k), 0, 0), uv=1.2)
                for u in (-1, 1):
                    on(zw.box('rake', (0.5 * k, SL + 0.1 * k, 0.13 * k), (s * (L / 2 - 0.25 * k), SL / 2 - 0.02, -0.05 * k), mat(trim), bevel=0.015 * k, segs=1, uv=1.2), u)
                if bolt:
                    b = zw.bolt('bolt', TZ * 0.62, (0, 0, 0), mat('gold'), depth=0.05 * k)
                    zw.turn(b, z=s * math.pi / 2); b.data.transform(Matrix.Translation((s * (L / 2 - 0.28 * k), 0, z + TZ * 0.42)))
                if finial:
                    zw.lathe('acroterion', [(0, 0), (0.10 * k, 0), (0.12 * k, 0.05 * k), (0.07 * k, 0.10 * k), (0.11 * k, 0.20 * k), (0.06 * k, 0.32 * k), (0, 0.40 * k)], mat(finial), centre=(s * (L / 2 - 0.25 * k), 0, z + RISE + 0.08 * k), segs=8, uv=0.5)
    moved(build, Matrix.Translation((c[0], c[1], 0)) @ Matrix.Rotation(math.pi / 2 if axis == 'Y' else 0, 4, 'Z'))


def shed_roof(L, D, z_back, z_front, c=(0, 0), tile='terracotta', k=1.0):
    """Single slope falling towards the front (-Y). L along X, D deep; c is the centre of its plan."""
    def build():
        A = math.atan2(z_back - z_front, D); SL = D / math.cos(A); t = [mat(f'{tile}{i}') for i in range(3)]
        m = Matrix.Translation((0, -D / 2, z_front)) @ Matrix.Rotation(A, 4, 'X')
        K = max(2, round(SL / (0.62 * k))); PX = 0.34 * k; COLS = max(2, int(L / PX)); LC = SL / K
        for j in range(K):
            p = zw.box('pan', (L, LC + 0.05 * k, 0.035 * k), (0, (j + 0.5) * LC, 0.03 * k), t[j % 3], uv=0.7 * k); p.data.transform(m)
            for i in range(COLS):
                x = (i - (COLS - 1) / 2) * PX
                zw.rod('cover', (x, j * LC - 0.02 * k, 0.075 * k), (x, (j + 1) * LC + 0.015 * k, 0.058 * k), 0.07 * k, t[(i + j) % 3], segs=5, r2=0.056 * k, uv=0.7 * k).data.transform(m)
    moved(build, Matrix.Translation((c[0], c[1], 0)))


def dome(r, z, c=(0, 0), m='terracotta0', h=None, segs=16, ribs=0):
    h = h or r; prof = [(r * math.cos(a), h * math.sin(a)) for a in [i * math.pi / 2 / 6 for i in range(7)]]
    prof[-1] = (0.0, h)
    zw.lathe('dome', prof, mat(m), centre=(c[0], c[1], z), segs=segs, uv=1.0)
    for i in range(ribs):
        a = 2 * math.pi * i / ribs
        for j in range(6):
            p0 = (c[0] + prof[j][0] * math.cos(a), c[1] + prof[j][0] * math.sin(a), z + prof[j][1] + 0.02)
            p1 = (c[0] + prof[j + 1][0] * math.cos(a), c[1] + prof[j + 1][0] * math.sin(a), z + prof[j + 1][1] + 0.02)
            zw.rod('rib', p0, p1, 0.05, mat(m), segs=5)


# ---------------------------------------------------------------- walls, windows, doors
class Face:
    """One side of a box-shaped building. u runs along the wall (left to right seen from outside), out is outwards."""
    def __init__(self, cx, cy, w, d, side):
        self.cx, self.cy, self.w, self.d, self.side = cx, cy, w, d, side
        self.length = w if side in 'FB' else d

    def pos(self, u, out, z):
        if self.side == 'F': return (self.cx + u, self.cy - self.d / 2 - out, z)
        if self.side == 'B': return (self.cx - u, self.cy + self.d / 2 + out, z)
        if self.side == 'L': return (self.cx - self.w / 2 - out, self.cy - u, z)
        return (self.cx + self.w / 2 + out, self.cy + u, z)

    def box(self, name, size, at_, m, bevel=0.0, uv=1.0):
        su, so, sz = size
        return zw.box(name, (su, so, sz) if self.side in 'FB' else (so, su, sz), self.pos(*at_), mat(m) if isinstance(m, str) else m, bevel=bevel, segs=1, uv=uv)

    def axis(self): return 'Y' if self.side in 'FB' else 'X'


def faces(cx, cy, w, d): return {s: Face(cx, cy, w, d, s) for s in 'FBLR'}


def window(f, u, z, w=0.8, h=1.0, trim='marble', wood='azure_wood', shutters=True, arch=False):
    zc = z + h / 2
    f.box('pane', (w, 0.04, h), (u, 0.0, zc), 'dark')
    f.box('sill', (w + 0.3, 0.16, 0.09), (u, 0.06, z - 0.045), trim, 0.015)
    f.box('lintel', (w + 0.34, 0.12, 0.15), (u, 0.05, z + h + 0.075), trim, 0.02)
    for s in (-1, 1): f.box('jamb', (0.09, 0.09, h), (u + s * (w / 2 + 0.045), 0.04, zc), trim)
    f.box('bar', (0.04, 0.03, h), (u, 0.03, zc), wood); f.box('bar', (w, 0.03, 0.04), (u, 0.03, zc + 0.1), wood)
    if shutters:
        sw = w / 2 + 0.02
        for s in (-1, 1):
            cx = u + s * (w / 2 + 0.1 + sw / 2)
            f.box('shutter', (sw, 0.035, h), (cx, 0.03, zc), wood, 0.006, 0.9)
            for i in range(5): f.box('slat', (sw - 0.1, 0.02, 0.035), (cx, 0.055, z + (i + 0.8) * h / 6.2), wood, 0.0, 0.9)


def door(f, u, z, w=1.2, h=2.2, wood='azure_wood', trim='marble', metal='bronze', double=True):
    for s in (-1, 1): f.box('jamb', (0.14, 0.14, h), (u + s * (w / 2 + 0.07), 0.05, z + h / 2), trim, 0.015)
    f.box('lintel', (w + 0.5, 0.18, 0.2), (u, 0.07, z + h + 0.1), trim, 0.02)
    f.box('recess', (w, 0.03, h), (u, -0.01, z + h / 2), 'dark')
    n = 2 if double else 1; lw = w / n - 0.01
    for i in range(n):
        cx = u + (i - (n - 1) / 2) * w / n
        f.box('leaf', (lw, 0.05, h), (cx, 0.02, z + h / 2), wood, 0.0, 1.3)
        for j in range(3): f.box('panel', (lw - 0.2, 0.03, h / 3 - 0.16), (cx, 0.055, z + (j + 0.5) * h / 3), wood, 0.015, 1.3)
        p = f.pos(cx + (0.5 - i) * (lw - 0.22) if double else cx + lw / 2 - 0.12, 0.09, z + 1.05)
        zw.torus('ring', 0.055, 0.011, p, mat(metal), axis=f.axis(), seg=10, tube=4)


def block(name, w, d, h, c=(0, 0), z=0.0, m='plaster', wob=0.01, uv=2.6, plinth='stone_dark', cap='marble'):
    """A wall body with a plinth course and a cap moulding. Returns its four faces."""
    b = zw.box(name, (w, d, h), (c[0], c[1], z + h / 2), mat(m), uv=uv)
    if wob: zw.refine(b, 0.7); zw.box_uv(b, uv); zw.wobble(b, wob, 0.9, int(w * 7 + d * 3))
    if plinth: zw.box('plinth', (w + 0.14, d + 0.14, 0.3), (c[0], c[1], z + 0.15), mat(plinth), bevel=0.03, segs=1, uv=uv)
    if cap: zw.box('cap', (w + 0.18, d + 0.18, 0.14), (c[0], c[1], z + h - 0.07), mat(cap), bevel=0.02, segs=1, uv=1.2)
    return faces(c[0], c[1], w, d)


def steps(w, d, n, z=0.0, c=(0, 0), rise=0.15, tread=0.3, m='step', three_sided=True):
    for i in range(n):
        g = (n - 1 - i) * tread
        zw.box('steps', (w + (2 * g if three_sided else 0), d + 2 * g if three_sided else d + g, rise), (c[0], c[1] if three_sided else c[1] - g / 2, z + (i + 0.5) * rise), mat(m), bevel=0.015, segs=1, uv=1.0)


def entablature(w, d, z, h=0.5, m='marble', accent=None, t=0.5, c=(0, 0), tri='paint_azure', open_back=False):
    """Beam, optional coloured fillet with triglyphs, and a projecting cornice round a w x d rectangle."""
    def ring(z0, hh, out, mm):
        for s in ((-1, 1) if not open_back else (-1,)):
            zw.box('ent', (w + 2 * out, t + out, hh), (c[0], c[1] + s * (d / 2 - t / 2 + out / 2), z0 + hh / 2), mat(mm), segs=1, uv=1.2)
        for s in (-1, 1):
            zw.box('ent', (t + out, d - 2 * t, hh), (c[0] + s * (w / 2 - t / 2 + out / 2), c[1], z0 + hh / 2), mat(mm), segs=1, uv=1.2)
    ring(z, h * 0.42, 0.0, m)
    if accent: ring(z + h * 0.42, h * 0.07, 0.03, accent)
    ring(z + h * 0.49, h * 0.33, -0.02, m)
    if tri:
        n = max(2, round(w / 0.8))
        for i in range(n):
            for k in (-1, 0, 1):
                zw.box('triglyph', (0.05, 0.04, h * 0.33), (c[0] + (i - (n - 1) / 2) * w / n + k * 0.07, c[1] - d / 2 + 0.01, z + h * 0.655), mat(tri))
    ring(z + h * 0.82, h * 0.18, 0.14, m)


def awning(w, y0, z0, y1, z1, colors=('red', 'cream'), cx=0.0, n=None, valance=True):
    """Striped cloth from (y0, z0) at the back down to (y1, z1) at the front."""
    n = n or max(4, round(w / 0.35)); sw = w / n
    for i in range(n):
        x = cx + (i - (n - 1) / 2) * sw; m = mat('cloth_' + colors[i % len(colors)])
        sag = 0.06
        zw.prism('awning', [(y0, z0), ((y0 + y1) / 2, (z0 + z1) / 2 - sag), (y1, z1), (y1, z1 - 0.025), ((y0 + y1) / 2, (z0 + z1) / 2 - sag - 0.025), (y0, z0 - 0.025)], sw + 0.002, m, axis='X', centre=(x, 0, 0), uv=0.6)
        if valance:
            zw.prism('valance', [(-sw / 2, 0), (sw / 2, 0), (sw / 2, -0.12), (0, -0.2), (-sw / 2, -0.12)], 0.02, m, axis='Y', centre=(x, y1, z1 - 0.01), uv=0.6)


def banner(x, y, z, h=1.6, w=0.6, color='red', face='Y', bolt=True):
    m = mat('cloth_' + color)
    pts = [(-w / 2, 0), (w / 2, 0), (w / 2, -h), (0, -h - w * 0.35), (-w / 2, -h)]
    b = zw.prism('banner', pts, 0.03, m, axis='Y', centre=(0, 0, 0), uv=0.6)
    g = zw.prism('banner_trim', [(-w / 2, -0.06), (w / 2, -0.06), (w / 2, -0.12), (-w / 2, -0.12)], 0.036, mat('gold'), axis='Y')
    parts_ = [b, g, zw.rod('banner_rod', (-w / 2 - 0.08, 0, 0.02), (w / 2 + 0.08, 0, 0.02), 0.025, mat('wood_dark'), segs=6)]
    if bolt: parts_.append(zw.bolt('bolt', h * 0.4, (0, -0.022, -h * 0.5), mat('gold'), depth=0.012))
    m4 = Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.pi / 2 if face == 'X' else 0, 4, 'Z')
    for o in parts_: o.data.transform(m4)


# ---------------------------------------------------------------- curved and arched shapes
def ring_segment(name, r0, r1, z0, z1, a0, a1, m, n=8, c=(0, 0), uv=1.0):
    """A solid wedge of a ring between two radii, heights and angles."""
    bm = bmesh.new(); rows = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n; cs, sn = math.cos(a), math.sin(a)
        rows.append([bm.verts.new((c[0] + r * cs, c[1] + r * sn, zz)) for r, zz in ((r0, z0), (r1, z0), (r1, z1), (r0, z1))])
    for i in range(n):
        a, b = rows[i], rows[i + 1]
        for j in range(4): bm.faces.new([a[j], a[(j + 1) % 4], b[(j + 1) % 4], b[j]])
    bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = zw.obj_from_bm(name, bm, mat(m) if isinstance(m, str) else m); zw.box_uv(o, uv)
    return o


def arch_wall(name, length, height, thick, arches, m, c=(0, 0, 0), axis='X', uv=2.6, n=10):
    """A wall along `axis` pierced by round arches: arches = [(centre, half span, spring height), ...]."""
    pts = [(-length / 2, 0), (-length / 2, height), (length / 2, height), (length / 2, 0)]
    for xc, hs, sp in sorted(arches, reverse=True):
        pts += [(xc + hs, 0), (xc + hs, sp)] + [(xc + hs * math.cos(math.pi * i / n), sp + hs * math.sin(math.pi * i / n)) for i in range(1, n)] + [(xc - hs, sp), (xc - hs, 0)]
    o = zw.prism(name, pts, thick, mat(m), axis='Y', uv=uv)
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4]); bm.to_mesh(o.data); bm.free()
    o.data.transform(Matrix.Translation(c) @ Matrix.Rotation(math.pi / 2 if axis == 'Y' else 0, 4, 'Z'))
    return o


def merlons(length, z, c=(0, 0), axis='X', m='stone', w=0.7, h=0.6, t=0.4, gap=0.5):
    n = max(1, int((length + gap) / (w + gap)))
    for i in range(n):
        u = (i - (n - 1) / 2) * (w + gap)
        # sunk a little into the wall top: faces lying exactly on each other flicker in the game
        zw.box('merlon', (w, t, h + 0.06) if axis == 'X' else (t, w, h + 0.06), (c[0] + u, c[1], z + h / 2 - 0.03) if axis == 'X' else (c[0], c[1] + u, z + h / 2 - 0.03), mat(m), bevel=0.03, segs=1, uv=2.6)


def shrub(x, y, z, r=0.3, m='leaf', seed=0, n=5):
    rnd = random.Random(seed)
    for i in range(n):
        a = rnd.uniform(0, 6.28); d = rnd.uniform(0, r * 0.6); rr = r * rnd.uniform(0.5, 0.8)
        o = zw.blob('shrub', (rr, rr, rr * 0.85), (x + d * math.cos(a), y + d * math.sin(a), z + rr * 0.7 + rnd.uniform(0, r * 0.4)), mat(m if i % 2 else 'leaf_dark'), 7, 5)
        zw.wobble(o, rr * 0.18, 9.0, seed * 7 + i); zw.box_uv(o, 0.5)


def pot(x, y, z, s=1.0, m='terracotta', plant=None, seed=0):
    zw.lathe('pot', [(0.0, 0), (0.12 * s, 0), (0.17 * s, 0.10 * s), (0.20 * s, 0.26 * s), (0.17 * s, 0.34 * s), (0.20 * s, 0.38 * s), (0.20 * s, 0.40 * s), (0.15 * s, 0.39 * s), (0.0, 0.36 * s)], mat(m), centre=(x, y, z), segs=10, uv=0.5)
    if plant: shrub(x, y, z + 0.32 * s, 0.22 * s, plant, seed, 4)


def brazier(x, y, z, s=1.0):
    for a in (0.5, 2.6, 4.7):
        zw.rod('tripod', (x + 0.34 * s * math.cos(a), y + 0.34 * s * math.sin(a), z), (x + 0.12 * s * math.cos(a), y + 0.12 * s * math.sin(a), z + 0.95 * s), 0.035 * s, mat('bronze'), segs=6)
    zw.lathe('bowl', [(0.10 * s, 0.80 * s), (0.30 * s, 0.92 * s), (0.44 * s, 1.10 * s), (0.46 * s, 1.18 * s), (0.40 * s, 1.18 * s), (0.0, 1.06 * s)], mat('bronze'), centre=(x, y, z), segs=12, uv=0.5)
    fire(x, y, z + 1.14 * s, 0.34 * s)


def fire(x, y, z, r=0.3):
    """Flames as a few pointed tongues over a bed of coals (the glow and flicker are added in code)."""
    zw.blob('coals', (r, r, r * 0.25), (x, y, z), mat('coal'), 8, 4)
    for i, (dx, dy, hh) in enumerate(((0, 0, 1.5), (0.4, 0.2, 1.0), (-0.35, 0.25, 0.9), (0.1, -0.4, 1.1), (-0.3, -0.3, 0.75))):
        zw.lathe('flame', [(0, 0), (r * 0.36, r * 0.25 * hh), (r * 0.26, r * 0.7 * hh), (r * 0.09, r * 1.2 * hh), (0, r * 1.5 * hh)], mat('flame'), centre=(x + dx * r, y + dy * r, z), segs=6, uv=0.5)


KEEP = ('pan', 'lip', 'ent', 'cornice', 'rake', 'tympanum', 'steps', 'cap', 'plinth', 'awning', 'water', 'paved', 'deck')


def finish(out, dist=0.6, keep=()):
    zw.apply_transforms()
    zw.bake_shading(dist=dist, keep=KEEP + tuple(keep))
    zw.export(out)
