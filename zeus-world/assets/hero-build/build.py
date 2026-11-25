#!/usr/bin/env python3
"""Assembles a hero film that is made of a few moving shots and several still pictures (ZW-047).
    python3 hero-build/build.py last-banner <folder with that film's sources>
A still picture is enlarged twofold and then moved across slowly (a slow push in, or out), which is what keeps the movement smooth.
Each piece starts at its own second and dissolves in from the piece before; the last piece is held to the end for the end card.
The sound is every narration line except the one with the name, over the score, which steps down under the voice
(and under the name line, fed in only as a signal). Sources are not in the repository; see docs/knowledge/hero-films.md."""
import subprocess, sys, os, shutil
FILMS = {
  'last-banner': dict(length=46, fade=0.4,
    pieces=[('v1.mp4', 0.0, dict(ss=0.3)), ('black', 5.0, {}), ('p1.png', 7.3, dict(z=(1.0, 1.10), at=(0.5, 0.45))), ('p2.png', 14.0, dict(z=(1.12, 1.0), at=(0.5, 0.4))),
            ('p3.png', 20.0, dict(z=(1.0, 1.14), at=(0.55, 0.35))), ('v2.mp4', 27.5, {}), ('p4.png', 36.5, dict(z=(1.12, 1.0), at=(0.5, 0.4)))],
    lines=[('n1.mp3', 0.6), ('n2.mp3', 5.6), ('n3.mp3', 7.9), ('n4.mp3', 14.6), ('n5.mp3', 20.6), ('n7.mp3', 32.6), ('n8.mp3', 37.3)], name_at=30.3),
  'the-well': dict(length=47.5, fade=0.4,
    pieces=[('v1.mp4', 0.0, {}), ('p1.png', 5.5, dict(z=(1.0, 1.10), at=(0.5, 0.6))), ('p2.png', 11.7, dict(z=(1.0, 1.14), at=(0.5, 0.45))), ('p3.png', 17.2, dict(z=(1.14, 1.0), at=(0.45, 0.5))),
            ('v2.mp4', 25.3, {}), ('p4.png', 34.0, dict(z=(1.0, 1.10), at=(0.5, 0.45))), ('p5.png', 39.2, dict(z=(1.14, 1.0), at=(0.5, 0.6)))],
    lines=[('n1.mp3', 2.8), ('n2.mp3', 6.2), ('n3.mp3', 12.4), ('n4.mp3', 17.9), ('n6.mp3', 31.6), ('n7.mp3', 34.7), ('n8.mp3', 39.9)], name_at=29.4),
}
film, src = sys.argv[1], sys.argv[2]; F = FILMS[film]; out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'review', 'public', 'hero'); os.makedirs(os.path.join(out, 'names-' + film), exist_ok=True)
P, fade, L = F['pieces'], F['fade'], F['length']; ins, chains = [], []
for i, (name, start, o) in enumerate(P):
    dur = (P[i + 1][1] if i + 1 < len(P) else L) - start + fade; n = round(dur * 30)
    if name == 'black': ins += ['-f', 'lavfi', '-t', f'{dur}', '-i', 'color=black:s=1280x720:r=30']; chains.append(f'[{i}:v]format=yuv420p,setsar=1[a{i}]')
    elif name.endswith('.png'):
        (z0, z1), (fx, fy) = o['z'], o['at']; ins += ['-i', os.path.join(src, name)]
        chains.append(f"[{i}:v]scale=2752:1536:flags=lanczos,zoompan=z='{z0}+({z1}-{z0})*on/{n}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d={n}:s=1280x720:fps=30,format=yuv420p,setsar=1[a{i}]")
    else:
        ins += ['-ss', str(o.get('ss', 0)), '-i', os.path.join(src, name)]; last = i + 1 == len(P)
        chains.append(f"[{i}:v]scale=1280:720,fps=30,format=yuv420p,setsar=1,tpad=stop_mode=clone:stop_duration={dur}" + (',fade=t=in:d=1.0' if i == 0 else '') + f",trim=duration={dur},setpts=PTS-STARTPTS[a{i}]")
prev = 'a0'
for i in range(1, len(P)): chains.append(f'[{prev}][a{i}]xfade=transition=fade:duration={fade}:offset={P[i][1]}[x{i}]'); prev = f'x{i}'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(chains), '-map', f'[{prev}]', '-t', str(L), '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '35', '-row-mt', '1', '-cpu-used', '4', '-g', '30', os.path.join(out, film + '.webm')], check=True)
ins, ch, tags = [], [], []
for i, (name, at) in enumerate(F['lines']): ins += ['-i', os.path.join(src, name)]; ch.append(f'[{i}:a]adelay={int(at*1000)}|{int(at*1000)}[l{i}]'); tags.append(f'[l{i}]')
k, s = len(F['lines']), len(F['lines']) + 1; ins += ['-i', os.path.join(src, 'name_generic.mp3'), '-i', os.path.join(src, 'score.mp3')]; d = int(F['name_at'] * 1000)
ch += [f'[{k}:a]adelay={d}|{d}[k]', ''.join(tags) + f'amix=inputs={k}:normalize=0,volume=1.9,apad=whole_dur={L},asplit=2[voice][v2]', '[v2][k]amix=inputs=2:normalize=0[key]',
       f'[{s}:a]aformat=channel_layouts=stereo,volume=0.9,afade=t=in:d=0.6,afade=t=out:st={L-3}:d=3[sc]', '[sc][key]sidechaincompress=threshold=0.02:ratio=5:attack=40:release=700[duck]', '[duck][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95[o]']
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(ch), '-map', '[o]', '-t', str(L), '-ac', '2', '-ar', '44100', '-b:a', '192k', os.path.join(out, film + '.mp3')], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(src, 'name_generic.mp3'), '-af', 'volume=1.9', '-b:a', '160k', os.path.join(out, film + '-line.mp3')], check=True)
if os.path.exists(os.path.join(src, 'name_andie.mp3')): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(src, 'name_andie.mp3'), '-af', 'volume=1.9', '-b:a', '160k', os.path.join(out, 'names-' + film, 'andie-howard.mp3')], check=True)
print('built', film)
