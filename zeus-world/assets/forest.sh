#!/bin/sh
# The forest kit (ZW-049): raw Trellis 2 models -> catalogue models, then their far-view and middle-distance versions.
# Run from assets/ with the raw files in raw/. Heights are real: a forest oak is taller than the city's garden trees.
# name | fit box W,H,D in metres (0 = free) | yaw | triangle budget | texture size | max simplification error
n() { node normalize.mjs "raw/$1.glb" "models/$1.glb" --fit "$2" --yaw "$3" --tris "$4" --tex "$5" --maxerr "$6"; }
n nature_tree_holm-oak    0,12.0,0  0 14000 1024 0.003
n nature_tree_stone-pine  0,14.0,0  0 12000 1024 0.003
n nature_tree_olive       0,6.5,0   0 14000 1024 0.003
n nature_tree_plane       0,16.0,0  0 14000 1024 0.003
n nature_tree_fir         0,15.0,0  0 12000 1024 0.003
n nature_tree_laurel      0,4.5,0   0 10000 1024 0.003
n nature_fern             0,0.8,0   0 6000  512  0.003
n nature_shrub_broom      0,1.5,0   0 8000  512  0.003
n nature_log_fallen       3.2,0,0   0 6000  1024 0.006
# far-view versions (models/far/): the same shape in few triangles, coloured by vertex, for trees that are not close
f() { node lod.mjs "models/$1.glb" "$2" round; }
f nature_tree_holm-oak 6000; f nature_tree_stone-pine 5000; f nature_tree_olive 5000; f nature_tree_plane 6000; f nature_tree_fir 5000; f nature_tree_laurel 4000; f nature_fern 1200; f nature_shrub_broom 2500
# middle-distance versions (models/mid/): lighter again. lod.mjs always writes into a far/ folder beside its input, so it is run on copies.
T=$(mktemp -d); m() { cp "models/$1.glb" "$T/"; node lod.mjs "$T/$1.glb" "$2" round; cp "$T/far/$1.glb" "models/mid/$1.glb"; }
mkdir -p models/mid; m nature_tree_holm-oak 1500; m nature_tree_stone-pine 1200; m nature_tree_olive 1300; m nature_tree_plane 1500; m nature_tree_fir 1100; m nature_tree_laurel 900; m nature_fern 300; m nature_shrub_broom 500; rm -rf "$T"
