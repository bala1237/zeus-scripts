"""Fits the Zeya lines (vo/lines/01..12.mp3) into their slots and writes out/vo.wav.
Trims silence, shortens long pauses, speeds a line up slightly only if it still overruns."""
import subprocess, numpy as np, os
SR = 48000
# line: (start, latest end, max pause). Line 6 is split so each phrase lands on a montage cut.
# A line may run past its shot into the next one; it never overlaps the next line.
SLOTS = {1:(0.1,2.0,.15), 2:(2.05,3.9,.15), 3:(4.05,6.05,.2), 4:(6.15,8.0,.18), 5:(8.0,9.85,.18),
         7:(12.2,13.85,.15), 8:(13.9,15.9,.2), 9:(15.95,19.8,.2), 10:(19.95,23.8,.45),
         11:(23.9,28.6,.25), 12:(29.0,32.4,.22)}
SPLIT6 = [9.9, 10.65, 11.4]

def load(path, tempo=1.0):
    af = ['-af', f'atempo={tempo}'] if tempo != 1.0 else []
    raw = subprocess.run(['ffmpeg','-v','error','-i',path,*af,'-ac','1','-ar',str(SR),'-f','f32le','-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def segments(x, thr_db=-28, hop=0.01, min_gap=0.08):
    h = int(SR*hop); n = len(x)//h
    rms = np.sqrt(np.mean(x[:n*h].reshape(n,h)**2, axis=1) + 1e-12)
    on = 20*np.log10(rms/ rms.max()) > thr_db
    segs = []; i = 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]: j += 1
            if segs and (i - segs[-1][1])*hop < min_gap: segs[-1][1] = j
            else: segs.append([i, j])
            i = j
        else: i += 1
    pad = int(0.04/hop)
    return [(max(0,(a-pad))*h, min(len(x),(b+pad)*h)) for a,b in segs]

def tighten(x, maxgap):
    segs = segments(x); out = []
    for k,(a,b) in enumerate(segs):
        if k: 
            gap = (a - segs[k-1][1])/SR
            out.append(np.zeros(int(SR*min(gap, maxgap)), np.float32))
        out.append(x[a:b])
    return np.concatenate(out), segs

def fade(x, ms=8):
    n = min(len(x)//2, int(SR*ms/1000)); r = np.linspace(0,1,n,dtype=np.float32)
    x[:n] *= r; x[-n:] *= r[::-1]; return x

track = np.zeros(int(SR*32.5), np.float32)
def put(x, t):
    a = int(SR*t); b = min(len(track), a+len(x)); track[a:b] += x[:b-a]

for i,(t0,t1,mg) in SLOTS.items():
    p = f'vo/lines/{i:02d}.mp3'; tempo = 1.0
    while True:
        y,_ = tighten(load(p, tempo), mg)
        if t0 + len(y)/SR <= t1 or tempo >= 1.2: break
        tempo = round(tempo + 0.03, 2)
    over = t0 + len(y)/SR - t1
    print(f'{i:02d} {len(y)/SR:.2f}s at {t0}-{t0+len(y)/SR:.2f} tempo {tempo}' + (f'  OVER {over:.2f}s' if over > 0 else ''))
    put(fade(y), t0)

x = load('vo/lines/06.mp3'); segs = segments(x)
# phrases: "Upgrade it." / "Again." / "And again."  -> group segments by the two longest gaps
groups = [[segs[0]], [segs[1]], segs[2:]]
for n,g in enumerate(groups):
    y = tighten(x[g[0][0]:g[-1][1]].copy(), .15)[0]
    print(f'06.{n} {len(y)/SR:.2f}s at {SPLIT6[n]}')
    put(fade(y), SPLIT6[n] + 0.05)

peak = np.abs(track).max(); track *= 0.89/peak
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','out/vo.wav'], input=track.tobytes())
