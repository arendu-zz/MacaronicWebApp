#!/bin/sh
set -e
./un-preorder.py -o ../data/fr/newstest2013/newstest2013.input.tok.1 -i ../data/fr/newstest2013/newstest2013.input.tok.1 -a ../data/fr/newstest2013/newstest2013.output.1.wa > ../data/fr/newstest2013/newstest2013.i2o.alignments 
./untangle-wa.py -i ../data/fr/newstest2013/newstest2013.input.tok.1 -o ../data/fr/newstest2013/newstest2013.output.1.wa > ../data/fr/newstest2013/newstest2013.output.1.wa.untangled
./true-align.py -w ../data/fr/newstest2013/newstest2013.output.1.wa.untangled  -a ../data/fr/newstest2013/newstest2013.i2o.alignments > ../data/fr/newstest2013/newstest2013.output.1.wa.untangled.true.aligned
./coe-from-mt.py -i ../data/fr/newstest2013/newstest2013.input.tok.1 -o ../data/fr/newstest2013/newstest2013.output.1.wa.untangled.true.aligned -e ../data/fr/newstest2013/newstest2013.input.tok.1.edges.uniq.intermediate -p ../data/fr/newstest2013/newstest2013.input.tok.1.dep.parsed   --out  ../data/fr/newstest2013/newstest2013.fr
cp ../data/fr/newstest2013/newstest2013.fr.js  ../stories/newstest2013.fr.js
cp ../data/fr/newstest2013/newstest2013.fr.preview.js  ../stories/newstest2013.fr.preview.js
exit 0
./coe-from-mt.py -i ../data/fr/jde/jde.fr.tok -o ../data/fr/jde/jde.fr.wa -e ../data/fr/jde/jde.fr.tok.edges.uniq.intermediate -p ../data/fr/jde/jde.fr.tok.dep.parsed  -s Article --out  ../data/fr/jde/jde.fr
cp ../data/fr/jde/jde.fr.js ../stories/jde.fr.js
cp ../data/fr/jde/jde.fr.preview.js ../stories/jde.fr.preview.js
./coe-from-mt.py -i ../data/fr/little_prince/le_petit_prince.fr.tok -o ../data/fr/little_prince/le_petit_prince.fr.wa -e ../data/fr/little_prince/le_petit_prince.fr.tok.edges.uniq.intermediate -p ../data/fr/little_prince/le_petit_prince.fr.tok.dep.parsed  --out ../data/fr/little_prince/le_petit_prince.fr
cp ../data/fr/little_prince/le_petit_prince.fr.js ../stories/le_petit_prince.fr.js
cp ../data/fr/little_prince/le_petit_prince.fr.preview.js ../stories/le_petit_prince.fr.preview.js
