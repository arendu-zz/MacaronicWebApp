#!/bin/sh
set -e
./coe-from-mt.py -i ../data/fr/jde/jde.fr.tok -o ../data/fr/jde/jde.fr.wa -e ../data/fr/jde/jde.fr.tok.edges.uniq.intermediate -p ../data/fr/jde/jde.fr.tok.dep.parsed -s Article > ../data/fr/jde/jde.fr.js
cp ../data/fr/jde/jde.fr.js ../stories/jde.fr.js
./coe-from-mt.py -i ../data/fr/little_prince/le_petit_prince.fr.tok -o ../data/fr/little_prince/le_petit_prince.fr.wa -e ../data/fr/little_prince/le_petit_prince.fr.tok.edges.uniq.intermediate -p ../data/fr/little_prince/le_petit_prince.fr.tok.dep.parsed  > ../data/fr/little_prince/le_petit_prince.fr.js
cp ../data/fr/little_prince/le_petit_prince.fr.js ../stories/le_petit_prince.fr.js
./coe-from-mt.py -i ../data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit -o ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa -e ../data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit.edges.uniq.intermediate -p ../data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit.dep.parsed -s Artikel > ../data/de/nachrichtenleicht/nachrichtenleicht.de.js
cp ../data/de/nachrichtenleicht/nachrichtenleicht.de.js ../stories/nachrichtenleicht/nachrichtenleicht.de.js
