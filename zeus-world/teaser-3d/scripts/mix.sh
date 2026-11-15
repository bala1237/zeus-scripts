#!/bin/sh
# Mixes out/vo.wav (from scripts/voice.py) over out/teaser-audio.wav, ducking the music under the voice,
# and muxes it onto the recorded video without re-rendering.
cd "$(dirname "$0")/.." && \
ffmpeg -y -loglevel error -i out/teaser-audio.wav -i out/vo.wav -filter_complex "
[1:a]aformat=channel_layouts=stereo,highpass=f=85,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,aecho=0.85:0.6:45|90:0.12|0.07,asplit=2[v][sc];
[0:a]volume=0.85[m];
[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck];
[duck][v]amix=inputs=2:weights=1 1.1:normalize=0,volume=5dB,alimiter=limit=0.9[o]" -map "[o]" -ar 48000 out/teaser-mix.wav && \
ffmpeg -y -loglevel error -i out/zeus-world-teaser.mp4 -i out/teaser-mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out/zeus-world-teaser-vo.mp4 && \
ffprobe -v error -show_entries format=duration -of csv=p=0 out/zeus-world-teaser-vo.mp4
