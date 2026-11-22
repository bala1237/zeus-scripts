#!/bin/sh
# Builds every scripted model: Blender script -> raw/ -> normalised model in models/.
# Run from assets/. PY is the Python that has bpy and pillow installed (see README).
PY=${PY:-bl/bin/python}
b() { # name | script | script args | triangle budget | texture size
  $PY "blender/$2" $3 "raw/$1.glb" 2>&1 | grep "triangles$" || { echo "FAILED $1"; return 1; }
  node normalize.mjs "raw/$1.glb" "models/$1.glb" --fit 0,0,0 --yaw 0 --tris "$4" --tex "$5" | grep -v prune
}
only=$1
run() { [ -z "$only" ] || [ "$only" = "$1" ] || return 0; b "$@"; }
run home_villa-walls_t1_stone      villa_walls.py stone      30000 1024
run home_villa-walls_t2_ochre      villa_walls.py ochre      30000 1024
run home_villa-walls_t3_goldmarble villa_walls.py goldmarble 30000 1024
run decor_bench_t1_marble          bench.py       ""         9000  512
