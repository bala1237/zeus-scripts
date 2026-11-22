#!/bin/sh
# The 12 teaser models -> catalogue models. Run from assets/. Sources are the teaser's own compressed files.
# name | source | fit box W,H,D in metres (0 = free) | yaw | triangle budget | texture size | max simplification error
S=../teaser-3d/public/models
n() { node normalize.mjs "$S/$2.glb" "models/$1.glb" --fit "$3" --yaw "$4" --tris "$5" --tex "$6" --maxerr "$7" --rescale "${8:-1}"; }
n civic_city-gate          gate      0,12,0   0 80000 2048 0.01
n civic_city-gate-door     door      0,2.6,0  0 30000 1024 0.01
n civic_stadium_stage4     stadium   0,15,0   0 80000 2048 0.01
n civic_founders-wall      namewall  0,6,0    0 80000 2048 0.01
n biz_cafe_t1              cafebldg  0,5,0    0 30000 1024 0.01
n nature_cypress_t1        cypress   0,7,0    0  60000 1024 0.003
n landmark_colossus        colossus  0,24,0   0 80000 2048 0.01
n landmark_sky-temple      skyisland 0,30,0   0 80000 2048 0.01
n landmark_trireme         trireme   0,0,24   0 80000 2048 0.01
n landmark_vault           vault     0,10,0   0 80000 2048 0.01
# Rigged citizens: the last value corrects the height, measured as window.sizes in the review scene (see README).
n char_citizen_woman       citizen_f     0,1.75,0 0 20000 1024 0.01 0.011908
# The generator bound her upper body and head to her left forearm; this rebuilds the binding from her shape (see docs/knowledge/characters.md).
node reskin.mjs models/char_citizen_woman.glb
# The man comes from the style test's copy (59,000 triangles); this is the catalogue copy at 20,000, as used in the city.
node normalize.mjs ../style-test/public/models/citizen.glb models/char_citizen_man.glb --fit 0,1.75,0 --yaw 0 --tris 20000 --tex 1024 --maxerr 0.01 --rescale 0.0119
# After any change to the citizens or plants, rebuild their far-view versions: ./far.sh
n char_citizen_elder       citizen_elder 0,1.75,0 0 20000 1024 0.01 0.011644
