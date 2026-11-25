#!/bin/bash
# Assembles The Fire-Bringer hero film from its six shots and the narration (ZW-047).
#   bash hero-build/fire-bringer.sh <folder with s2.mp4 … s7.mp4, n1.mp3 … n7.mp3, n5_generic.mp3 and, if there is one, score.mp3>
# The picture: 6 s of black (the page draws the ember there), then the shots with half-second dissolves, then the last frame held for the end card.
# Shot 5 starts at 28.6 s so that its fire erupts (4.8 s into the shot) at 33.4 s, which is when the name is forged.
set -e
SRC="$1"; OUT="$(cd "$(dirname "$0")/.." && pwd)/review/public/hero"; mkdir -p "$OUT/names"
V="scale=1280:720,fps=30,format=yuv420p,setsar=1"
ffmpeg -v error -y -f lavfi -t 6.5 -i "color=black:s=1280x720:r=30" \
  -ss 0.25 -t 8.5 -i "$SRC/s2.mp4" -ss 0.25 -t 8.5 -i "$SRC/s3.mp4" -ss 3.9 -t 7.1 -i "$SRC/s4.mp4" -i "$SRC/s5.mp4" -i "$SRC/s6.mp4" -i "$SRC/s7.mp4" \
  -filter_complex "[0:v]format=yuv420p,setsar=1[b];[1:v]$V[a2];[2:v]$V[a3];[3:v]$V[a4];[4:v]$V[a5];[5:v]$V[a6];[6:v]$V,tpad=stop_mode=clone:stop_duration=4.4[a7];
   [b][a2]xfade=transition=fade:duration=0.5:offset=6.0[x2];[x2][a3]xfade=transition=fade:duration=0.5:offset=14.0[x3];[x3][a4]xfade=transition=fade:duration=0.5:offset=22.0[x4];
   [x4][a5]xfade=transition=fade:duration=0.5:offset=28.6[x5];[x5][a6]xfade=transition=fade:duration=0.5:offset=39.1[x6];[x6][a7]xfade=transition=fade:duration=0.5:offset=49.6[v]" \
  -map "[v]" -t 63 -an -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -cpu-used 4 -g 30 "$OUT/fire-bringer.webm"
# The sound: every line except the one with the name, at its time, over the score when there is one.
D() { echo "adelay=$1|$1"; }
if [ -f "$SRC/score.mp3" ]; then SCORE=(-i "$SRC/score.mp3"); BED="[6:a]volume=0.5,afade=t=in:d=1.5,afade=t=out:st=60:d=3[s];"; MIX="[s]"; N=7; else SCORE=(); BED=""; MIX=""; N=6; fi
ffmpeg -v error -y -i "$SRC/n1.mp3" -i "$SRC/n2.mp3" -i "$SRC/n3.mp3" -i "$SRC/n4.mp3" -i "$SRC/n6.mp3" -i "$SRC/n7.mp3" "${SCORE[@]}" \
  -filter_complex "[0:a]$(D 800)[a];[1:a]$(D 6600)[b];[2:a]$(D 15000)[c];[3:a]$(D 22600)[d];[4:a]$(D 43200)[e];[5:a]$(D 52600)[f];$BED[a][b][c][d][e][f]${MIX}amix=inputs=$N:normalize=0,apad=whole_dur=63[o]" \
  -map "[o]" -t 63 -ac 2 -ar 44100 -b:a 160k "$OUT/fire-bringer.mp3"
cp "$SRC/n5_generic.mp3" "$OUT/fire-bringer-line5.mp3"
[ -f "$SRC/n5.mp3" ] && cp "$SRC/n5.mp3" "$OUT/names/andie-howard.mp3"
ls -la "$OUT" "$OUT/names"
