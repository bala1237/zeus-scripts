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
run infra_tile_t1_road        kit.py tile_road    1000  1024
run infra_tile_t1_plaza       kit.py tile_plaza   1000  1024
run infra_tile_t1_mosaic      kit.py tile_mosaic  1000  1024
run infra_boundary_t1_stones  kit.py boundary     5000  512
run infra_street-lamp_t1      kit.py street_lamp  9000  512
run decor_plaque_t1_bronze    kit.py plaque       5000  512
run build_scaffolding_t1      kit.py scaffolding  12000 512
run build_stone-blocks_t1     kit.py stone_blocks 5000  512
run build_timber-stack_t1     kit.py timber_stack 5000  512
run build_crates_t1           kit.py crates       9000  512
run build_crane_t1            kit.py crane        12000 512
run decor_lantern_t1_bronze   kit.py lantern_post 6000  512
run decor_amphorae_t1_cluster kit.py amphorae     7000  512
run decor_garden-wall_t1_plaster kit.py garden_wall 5000 512
run decor_garden-gate_t1_azure   kit.py garden_gate 9000 512
run home_villa-roof_t1_terracotta villa_roof.py  terracotta 30000 512
run home_villa-roof_t3_azure      villa_roof.py  azure      30000 512
run home_villa-porch_t2_doric     villa_porch.py doric      20000 512
run home_villa-porch_t3_ionic     villa_porch.py ionic      20000 512
run civic_temple-zeus_stage1 temple.py 1 80000 1024
run civic_temple-zeus_stage2 temple.py 2 80000 1024
run civic_temple-zeus_stage3 temple.py 3 80000 1024
run civic_temple-zeus_stage4 temple.py 4 80000 1024
run civic_stoa               city.py stoa            80000 1024
run civic_fountain-plaza     city.py fountain        10000 512
run civic_tholos             city.py tholos          80000 1024
run civic_amphitheatre       city.py amphitheatre    80000 1024
run civic_library            city.py library         80000 1024
run civic_council-hall       city.py council_hall    80000 1024
run civic_bathhouse          city.py bathhouse       80000 1024
run civic_gymnasium          city.py gymnasium       80000 1024
run civic_lighthouse         city.py lighthouse      80000 1024
run civic_aqueduct           city.py aqueduct        30000 1024
run infra_city-wall          city.py city_wall       30000 1024
run infra_wall-tower         city.py wall_tower      30000 1024
run infra_wall-gate          city.py wall_gate       30000 1024
run infra_bridge             city.py bridge          30000 1024
run infra_signpost           city.py signpost        5000  512
run decor_obelisk            city.py obelisk         5000  512
run decor_victory-column     city.py victory_column  5000  512
run decor_altar              city.py altar           5000  512
run decor_sundial            city.py sundial         5000  512
run decor_shrine             city.py shrine          5000  512
run decor_banner_t1_red      city.py banner_red      5000  512
run decor_banner_t1_azure    city.py banner_azure    5000  512
run water_pond               city.py pond            10000 512
run water_river-straight     city.py river_straight  5000  512
run water_river-bend         city.py river_bend      5000  512
run water_stepping-stones    city.py stepping_stones 5000  512
run water_quay               city.py quay            5000  1024
run water_pier               city.py pier            5000  512
run water_well               city.py well            5000  512
run water_reflecting-pool    city.py reflecting_pool 5000  512
