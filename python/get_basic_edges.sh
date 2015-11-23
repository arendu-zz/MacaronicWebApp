#!/bin/sh
set -e
MT_INPUT_FILE=$1
MT_OUTPUT_FILE=$2
PARSED_MT_INPUT_FILE=$3
./get_basic_edges.py -i $MT_INPUT_FILE -o $MT_OUTPUT_FILE -p $PARSED_MT_INPUT_FILE > $MT_INPUT_FILE.edges
sort $MT_INPUT_FILE.edges  | uniq > $MT_INPUT_FILE.edges.uniq
