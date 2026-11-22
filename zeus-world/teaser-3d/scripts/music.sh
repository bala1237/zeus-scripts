#!/bin/sh
# Cuts music/mythic-dawn.mp3 to the teaser: the opening 27.35s, then a short
# crossfade into the track's final swell so its peak (152.3s) lands on the title (29.0s).
cd "$(dirname "$0")/.." && mkdir -p out
ffmpeg -y -loglevel error -i music/mythic-dawn.mp3 -filter_complex "[0:a]atrim=0:27.35,asetpts=PTS-STARTPTS[a];[0:a]atrim=150.35:155.8,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.3:c1=tri:c2=tri,afade=t=out:st=31.5:d=1.0[o]" -map "[o]" -ar 48000 out/teaser-audio.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 out/teaser-audio.wav
