# Converts a .glb into a single self-contained glTF JSON file (buffer embedded as base64).
import sys, json, struct, base64
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read()
assert b[:4] == b'glTF'
off, js, binc = 12, None, b''
while off < len(b):
    ln, typ = struct.unpack_from('<I4s', b, off); chunk = b[off+8:off+8+ln]; off += 8 + ln
    if typ == b'JSON': js = json.loads(chunk)
    elif typ == b'BIN\x00': binc = chunk
js['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode()
open(dst, 'w').write(json.dumps(js, separators=(',', ':')))
