#!/bin/bash
# Assembles The Fire-Bringer hero film from its six shots, the narration and the score (ZW-047, second cut).
#   bash hero-build/fire-bringer.sh <folder with s2.mp4 … s7.mp4, n1.mp3 … n10.mp3, n7_generic.mp3 and score.mp3>
# The picture:
#   0.0   the hook: faces in gold light, looking up at something not shown (the end of shot 6)
#   4.4   black; the page draws an ember crossing it
#   8.6   shot 2, the fire dying     14.6  shot 3, the choice     20.6  shot 4, the climb and the flame nearly lost
#   28.6  shot 5: its fire erupts 4.8 s in, so at 33.4, where the score lifts and the name is forged
#   39.1  shot 6, the city lit and the faces again     49.6  shot 7, dawn; the last frame is held for the end card
set -e
SRC="$1"; OUT="$(cd "$(dirname "$0")/.." && pwd)/review/public/hero"; mkdir -p "$OUT/names"
V="scale=1280:720,fps=30,format=yuv420p,setsar=1"
ffmpeg -v error -y -ss 6.1 -t 4.9 -i "$SRC/s6.mp4" -f lavfi -t 4.7 -i "color=black:s=1280x720:r=30" \
  -ss 0.25 -t 6.5 -i "$SRC/s2.mp4" -ss 0.25 -t 6.5 -i "$SRC/s3.mp4" -ss 2.5 -t 8.5 -i "$SRC/s4.mp4" -i "$SRC/s5.mp4" -i "$SRC/s6.mp4" -i "$SRC/s7.mp4" \
  -filter_complex "[0:v]$V,fade=t=in:d=1.2[h];[1:v]format=yuv420p,setsar=1[b];[2:v]$V[a2];[3:v]$V[a3];[4:v]$V[a4];[5:v]$V[a5];[6:v]$V[a6];[7:v]$V,tpad=stop_mode=clone:stop_duration=4.4[a7];
   [h][b]xfade=transition=fade:duration=0.5:offset=4.4[x1];[x1][a2]xfade=transition=fade:duration=0.5:offset=8.6[x2];[x2][a3]xfade=transition=fade:duration=0.5:offset=14.6[x3];[x3][a4]xfade=transition=fade:duration=0.5:offset=20.6[x4];
   [x4][a5]xfade=transition=fade:duration=0.5:offset=28.6[x5];[x5][a6]xfade=transition=fade:duration=0.5:offset=39.1[x6];[x6][a7]xfade=transition=fade:duration=0.5:offset=49.6[v]" \
  -map "[v]" -t 63 -an -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -cpu-used 4 -g 30 "$OUT/fire-bringer.webm"
# The sound: every line except the one with the name, over the score. The score steps down under the voice,
# and also under the name line (which is a separate file, so it is used here only to tell the score when to step down).
D() { echo "adelay=$1|$1"; }
ffmpeg -v error -y -i "$SRC/n1.mp3" -i "$SRC/n2.mp3" -i "$SRC/n3.mp3" -i "$SRC/n4.mp3" -i "$SRC/n5.mp3" -i "$SRC/n6.mp3" -i "$SRC/n8.mp3" -i "$SRC/n9.mp3" -i "$SRC/n10.mp3" -i "$SRC/n7.mp3" -i "$SRC/score.mp3" \
  -filter_complex "[0:a]$(D 800)[a];[1:a]$(D 5400)[b];[2:a]$(D 9200)[c];[3:a]$(D 15400)[d];[4:a]$(D 21400)[e];[5:a]$(D 27400)[f];[6:a]$(D 42600)[g];[7:a]$(D 47400)[h];[8:a]$(D 52600)[i];[9:a]$(D 34900)[k];
   [a][b][c][d][e][f][g][h][i]amix=inputs=9:normalize=0,volume=1.9,apad=whole_dur=63,asplit=2[voice][v2];[v2][k]amix=inputs=2:normalize=0[key];
   [10:a]aformat=channel_layouts=stereo,volume=0.95,afade=t=in:d=0.6[s];[s][key]sidechaincompress=threshold=0.02:ratio=5:attack=40:release=700[duck];
   [duck][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95[o]" \
  -map "[o]" -t 63 -ac 2 -ar 44100 -b:a 192k "$OUT/fire-bringer.mp3"
ffmpeg -v error -y -i "$SRC/n7_generic.mp3" -af volume=1.9 -b:a 160k "$OUT/fire-bringer-line5.mp3"
ffmpeg -v error -y -i "$SRC/n7.mp3" -af volume=1.9 -b:a 160k "$OUT/names/andie-howard.mp3"
ls -la "$OUT" "$OUT/names"
