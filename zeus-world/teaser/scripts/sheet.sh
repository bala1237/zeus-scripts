#!/bin/sh
# Contact sheet of stills for quick review: scripts/sheet.sh "1,2,3,4" name
cd "$(dirname "$0")/.." && rm -f out/still-*.jpg && node scripts/capture.mjs --stills "$1" 2>&1 | grep -vE "^still|PCFSoft|toNonIndexed"
n=$(ls out/still-*.jpg | wc -l)
ffmpeg -y -loglevel error -pattern_type glob -i 'out/still-*.jpg' -vf "scale=486:864,tile=${n}x1" -q:v 3 "out/sheet-$2.jpg"
