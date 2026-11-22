# Downloads CC0 Poly Haven texture sets (1K JPG: diffuse and normal) into textures/.
# python3 blender/fetch_textures.py castle_wall_slates blue_painted_planks ...
import json, os, sys, urllib.request
here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'textures')
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'asset-pipeline'}), timeout=60).read()
for a in sys.argv[1:]:
    f = json.loads(get(f'https://api.polyhaven.com/files/{a}'))
    for key, short in (('Diffuse', 'diff'), ('nor_gl', 'nor')):
        p = os.path.join(here, f'{a}_{short}.jpg')
        if not os.path.exists(p): open(p, 'wb').write(get(f[key]['1k']['jpg']['url']))
    print(a, 'ok')
