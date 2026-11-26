#!/bin/sh
# Far-view versions of everything the open world sets down as a building or a prop (ZW-052): a home 200 m away is drawn from a
# few hundred triangles with no textures. Run from assets/ after any of these models change. Budgets by kind.
f() { [ -f "models/$1.glb" ] && node lod.mjs "models/$1.glb" "$2" plain | tail -1; }
for p in models/home_*.glb models/civic_*.glb models/landmark_*.glb models/country_*.glb; do n=$(basename "$p" .glb); case "$n" in *.tripo|*hunyuan*) continue;; esac; f "$n" 1600; done
for p in models/biz_*.glb; do f "$(basename "$p" .glb)" 1000; done
for p in models/decor_*.glb models/build_*.glb models/water_*.glb models/infra_*.glb; do n=$(basename "$p" .glb); case "$n" in infra_tile*|*.tripo) continue;; esac; f "$n" 350; done
