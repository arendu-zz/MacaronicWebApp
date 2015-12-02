#!/bin/sh
set -e
./coe-from-mt.py -i ../data/de/nachrichtenleicht/nachrichtenleicht.de.tok -o ../data/de/nachrichtenleicht/nachrichtenleicht.de.wa.untangled.true.aligned -e ../data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit.edges.uniq.intermediate -p ../data/de/nachrichtenleicht/nachrichtenleicht.de.tok.dep.parsed  -s Artikel > ../data/de/nachrichtenleicht/nachrichtenleicht.de.js
cp ../data/de/nachrichtenleicht/nachrichtenleicht.de.js ../stories/nachrichtenleicht.de.js

