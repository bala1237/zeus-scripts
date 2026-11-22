#!/bin/sh
# Far-view versions of the heaviest models that appear many times: citizens, trees and bushes. Run from assets/ after their models change.
# name | triangle budget | "round" for foliage (lit as one rounded mass); anything else for the rest
f() { node lod.mjs "models/$1.glb" "$2" "$3"; }
f char_citizen_man           4000 plain
f char_citizen_woman         4000 plain
f char_citizen_elder         4000 plain
f nature_cypress_t1          2500 round
f nature_bush_t1_myrtle      5000 round
f nature_bush_t1_oleander    5000 round
f nature_citizen-tree_stage2 5000 round
f nature_citizen-tree_stage3 7000 round
f nature_citizen-tree_stage4 7000 round
