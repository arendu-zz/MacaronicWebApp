#!/bin/sh
set -e
./un-preorder.py -o ../data/de/nachrichtenleicht/nachrichtenleicht.de.tok -i ../data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit -a ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa > ../data/de/nachrichtenleicht/nachrichtenleicht.de.alignment
./untangle-wa.py -i ../data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit -o ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa > ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa.untangled
./true-align.py -w ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa.untangled -a ../data/de/nachrichtenleicht/nachrichtenleicht.de.alignment > ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa.untangled.true.aligned
./coe-from-mt.py -i ../data/de/nachrichtenleicht/nachrichtenleicht.de.tok -o ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa.untangled.true.aligned -e ../data/de/nachrichtenleicht/nachrichtenleicht.de.tok.edges.uniq.intermediate -p ../data/de/nachrichtenleicht/nachrichtenleicht.de.tok.dep.parsed  -s Artikel --out  ../data/de/nachrichtenleicht/nachrichtenleicht.de
cp ../data/de/nachrichtenleicht/nachrichtenleicht.de.js ../stories/nachrichtenleicht.de.js
cp ../data/de/nachrichtenleicht/nachrichtenleicht.de.preview.js ../stories/nachrichtenleicht.de.preview.js

