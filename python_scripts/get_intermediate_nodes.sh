#!/bin/bash
#$ -cwd
#$ -M adithya.renduchintala@jhu.edu
#$ -m eas
#$ -l mem_free=5G,ram_free=5G
#$ -V
#$ -j y -o /home/arenduc1/MachineTranslation/MacaronicWebApp/python/get_int.log
. ~/.bashrc
set -e
PHRASE_TABLE_FILE=/home/arenduc1/MachineTranslation/little_prince/phrase-table.fr.single.thresholded
EDGES_FILE=/home/arenduc1/MachineTranslation/MacaronicWebApp/data/fr/jde/jde.fr.tok.edges.uniq
./get_intermediate_nodes.py -p $PHRASE_TABLE_FILE  -e $EDGES_FILE  > $EDGES_FILE.intermediate
echo "done 1"
PHRASE_TABLE_FILE=/home/arenduc1/MachineTranslation/little_prince/phrase-table.fr.single.thresholded
EDGES_FILE=/home/arenduc1/MachineTranslation/MacaronicWebApp/data/fr/little_prince/le_petit_prince.fr.tok.edges.uniq
./get_intermediate_nodes.py -p $PHRASE_TABLE_FILE  -e $EDGES_FILE  > $EDGES_FILE.intermediate
echo "done 2"
PHRASE_TABLE_FILE=/home/arenduc1/MachineTranslation/little_prince/phrase-table.de.single.thresholded
EDGES_FILE=/home/arenduc1/MachineTranslation/MacaronicWebApp/data/de/nachrichtenleicht/nachrichtenleicht.de.unsplit.edges.uniq
./get_intermediate_nodes.py -p $PHRASE_TABLE_FILE  -e $EDGES_FILE  > $EDGES_FILE.intermediate
echo "done 3"

