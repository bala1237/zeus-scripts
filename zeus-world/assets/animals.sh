#!/bin/sh
# The animals (ZW-051, phase 6): raw Trellis 2 models -> catalogue models and their far-view versions.
# Run from assets/ with the raw files in raw/ (animal_<name>.glb). Heights are real, to the top of the head or horns.
# name | fit box W,H,D in metres (0 = free) | yaw | triangle budget
n() { node normalize.mjs "raw/animal_$1.glb" "models/animal_$1.glb" --fit "$2" --yaw "$3" --tris "$4" --tex 1024 --maxerr "${6:-0.003}"; node lod.mjs "models/animal_$1.glb" "$5" round; }
n sheep 0,0.95,0 0 9000 900
n goat  0,1.05,0 90 9000 900
n horse 0,1.75,0 0 12000 1200
n ox    0,1.7,0  0 12000 1200
n dog   0,0.8,0  0 8000 800
n eagle 2.1,0,0  0 9000 900 0.01
