#!/bin/sh
set -e
./coe-from-mt.py -i ../data/fr/jde/jde.fr.tok -o ../data/fr/jde/jde.fr.wa -e ../data/fr/jde/jde.fr.tok.edges.uniq.intermediate -p ../data/fr/jde/jde.fr.tok.dep.parsed  -s Article --out  ../data/fr/jde/jde.fr
cp ../data/fr/jde/jde.fr.js ../stories/jde.fr.js
cp ../data/fr/jde/jde.fr.preview.js ../stories/jde.fr.preview.js
./coe-from-mt.py -i ../data/fr/little_prince/le_petit_prince.fr.tok -o ../data/fr/little_prince/le_petit_prince.fr.wa -e ../data/fr/little_prince/le_petit_prince.fr.tok.edges.uniq.intermediate -p ../data/fr/little_prince/le_petit_prince.fr.tok.dep.parsed  --out ../data/fr/little_prince/le_petit_prince.fr
cp ../data/fr/little_prince/le_petit_prince.fr.js ../stories/le_petit_prince.fr.js
cp ../data/fr/little_prince/le_petit_prince.fr.preview.js ../stories/le_petit_prince.fr.preview.js
