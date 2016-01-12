#!/bin/sh
set -e
#./un-preorder.py -o ../data/fr/newstest2013/newstest2013.fr.tok -i ../data/fr/newstest2013/newstest2013.fr.tok -a ../data/fr/newstest2013/newstest2013.fr.wa > ../data/fr/newstest2013/newstest2013.fr.alignment
#./untangle-wa.py -i ../data/fr/newstest2013/newstest2013.fr.tok -o ../data/fr/newstest2013/newstest2013.fr.wa > ../data/fr/newstest2013/newstest2013.fr.wa.untangled
#./true-align.py -w ../data/fr/newstest2013/newstest2013.fr.wa.untangled -a ../data/fr/newstest2013/newstest2013.fr.alignment > ../data/fr/newstest2013/newstest2013.fr.wa.untangled.true.aligned
#./coe-from-mt.py -i ../data/fr/newstest2013/newstest2013.fr.tok -o ../data/fr/newstest2013/newstest2013.fr.wa.untangled.true.aligned -e ../data/fr/newstest2013/newstest2013.fr.tok.edges.uniq.intermediate -p ../data/fr/newstest2013/newstest2013.fr.tok.dep.parsed  -s Artikel --out  ../data/fr/newstest2013/newstest2013.fr
#cp ../data/fr/newstest2013/newstest2013.fr.js ../stories/newstest2013.fr.js
#cp ../data/fr/newstest2013/newstest2013.fr.preview.js ../stories/newstest2013.fr.preview.js

./un-preorder.py -o ../data/fr/jde/jde.fr.tok -i ../data/fr/jde/jde.fr.tok -a ../data/fr/jde/jde.fr.wa > ../data/fr/jde/jde.fr.alignment
./untangle-wa.py -i ../data/fr/jde/jde.fr.tok -o ../data/fr/jde/jde.fr.wa > ../data/fr/jde/jde.fr.wa.untangled
./true-align.py -w ../data/fr/jde/jde.fr.wa.untangled -a ../data/fr/jde/jde.fr.alignment > ../data/fr/jde/jde.fr.wa.untangled.true.aligned
./coe-from-mt.py -i ../data/fr/jde/jde.fr.tok -o ../data/fr/jde/jde.fr.wa.untangled.true.aligned -e ../data/fr/jde/jde.fr.tok.edges.uniq.intermediate -p ../data/fr/jde/jde.fr.tok.dep.parsed  -s Artikel --out  ../data/fr/jde/jde.fr
cp ../data/fr/jde/jde.fr.js ../stories/jde.fr.js
cp ../data/fr/jde/jde.fr.preview.js ../stories/jde.fr.preview.js
