#!/bin/sh
# Renders a quality-check still of several models side by side: ./qc.sh <out name> <props|wide> <label> model model ...
out=$1; mode=$2; label=$3; shift 3; m=""
for n in "$@"; do m="$m${m:+,}models/$n.glb"; done
[ "$mode" = props ] && pre="props&" || pre=""
node shot.mjs "renders/$out.png" "${pre}m=$m&view=${VIEW:-3q}&light=${LIGHT:-day}&label=$label" 1700 900
