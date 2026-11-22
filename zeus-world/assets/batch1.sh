#!/bin/sh
# Batch 1 (P1 small items): raw Trellis 2 models -> catalogue models. Run from assets/ with the raw files in raw/.
# name | fit box W,H,D in metres (0 = free) | yaw | triangle budget | texture size | max simplification error
n() { node normalize.mjs "raw/$1.glb" "models/$1.glb" --fit "$2" --yaw "$3" --tris "$4" --tex "$5" --maxerr "$6"; }
n nature_bush_t1_myrtle         0,1.0,0   0 10000 1024 0.003
n nature_bush_t1_oleander       0,1.4,0   0 10000 1024 0.003
n nature_hedge_t1_box           2.0,0,0   0 10000 1024 0.003
n nature_flowers_t1_wild        0,0.5,0   0 10000 512 0.003
n nature_grass_t1_tuft          0,0.4,0   0 10000 512 0.003
n decor_bench_t1_marble         1.5,0,0   0 5000  512 0.01
n decor_lantern_t1_bronze       0,2.6,0   0 5000  512 0.01
n decor_pot_t1_small            0,0.5,0   0 5000  512 0.01
n decor_pot_t1_medium           0,0.8,0   0 5000  512 0.01
n decor_pot_t1_large            0,1.7,0   0 5000  512 0.01
n decor_amphorae_t1_cluster     0,1.0,0   0 5000  512 0.01
n decor_garden-wall_t1_plaster  2.0,0,0   0 5000  512 0.01
n decor_garden-gate_t1_azure    2.0,0,0   0 10000 1024 0.01
n nature_citizen-tree_stage1    0,0.9,0   0 10000 512 0.003
n nature_citizen-tree_stage2    0,2.5,0   0 10000 1024 0.003
n nature_citizen-tree_stage3    0,5.0,0   0 10000 1024 0.003
n nature_citizen-tree_stage4    0,7.0,0   0 10000 1024 0.003
