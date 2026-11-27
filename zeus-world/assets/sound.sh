#!/bin/sh
# The open world's sounds (ZW-054, item 6): the generated mp3s in raw/sound/ -> review/public/sound/*.webm (Opus, 64 kbit/s).
# Each is brought to the same loudness, so the mixing in worldsound.js is by ear from one level. mp3 is not used on the page:
# its padding leaves a gap at the join of a loop.
for f in raw/sound/*.mp3; do n=$(basename "$f" .mp3); ffmpeg -hide_banner -loglevel error -y -i "$f" -af "loudnorm=I=-20:TP=-2:LRA=11" -ar 48000 -c:a libopus -b:a 64k "review/public/sound/$n.webm" && echo "$n $(ffprobe -v error -show_entries format=duration -of csv=p=0 review/public/sound/$n.webm) s"; done
