set -e
./un-preorder.py -o ../data/fr/newstest2013/newstest2013.input.tok.1 -i ../data/fr/newstest2013/newstest2013.input.tok.1 -a ../data/fr/newstest2013/newstest2013.output.1.wa > ../data/fr/newstest2013/newstest2013.i2o.alignments 
./untangle-wa.py -i ../data/fr/newstest2013/newstest2013.input.tok.1 -o ../data/fr/newstest2013/newstest2013.output.1.wa > ../data/fr/newstest2013/newstest2013.output.1.wa.untangled
./true-align.py -w ../data/fr/newstest2013/newstest2013.output.1.wa.untangled  -a ../data/fr/newstest2013/newstest2013.i2o.alignments > ../data/fr/newstest2013/newstest2013.output.1.wa.untangled.true.aligned
./coe-from-mt.py -i ../data/fr/newstest2013/newstest2013.input.tok.1 -o ../data/fr/newstest2013/newstest2013.output.1.wa.untangled.true.aligned -e ../data/fr/newstest2013/newstest2013.input.tok.1.edges.uniq.intermediate -p ../data/fr/newstest2013/newstest2013.input.tok.1.dep.parsed   --out  ../data/fr/newstest2013/newstest2013.fr
cp ../data/fr/newstest2013/newstest2013.fr.js  ../stories/newstest2013.fr.js
cp ../data/fr/newstest2013/newstest2013.fr.preview.js  ../stories/newstest2013.fr.preview.js

./un-preorder.py -i ../data/fr/little_prince/le_petit_prince.fr.tok -o ../data/fr/little_prince/le_petit_prince.fr.tok -a ../data/fr/little_prince/le_petit_prince.fr.wa > ../data/fr/little_prince/le_petit_prince.fr.i2o.alignments
./untangle-wa.py -i ../data/fr/little_prince/le_petit_prince.fr.tok -o ../data/fr/little_prince/le_petit_prince.fr.wa > ../data/fr/little_prince/le_petit_prince.fr.wa.untangled
./true-align.py -w ../data/fr/little_prince/le_petit_prince.fr.wa.untangled -a ../data/fr/little_prince/le_petit_prince.fr.i2o.alignments > ../data/fr/little_prince/le_petit_prince.fr.wa.untangled.true.aligned
./coe-from-mt.py -i ../data/fr/little_prince/le_petit_prince.fr.tok -o ../data/fr/little_prince/le_petit_prince.fr.wa.untangled.true.aligned -e ../data/fr/little_prince/le_petit_prince.fr.tok.edges.uniq.intermediate -p ../data/fr/little_prince/le_petit_prince.fr.tok.dep.parsed  --out ../data/fr/little_prince/le_petit_prince.fr
cp ../data/fr/little_prince/le_petit_prince.fr.js ../stories/le_petit_prince.fr.js
cp ../data/fr/little_prince/le_petit_prince.fr.preview.js ../stories/le_petit_prince.fr.preview.js
