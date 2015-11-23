#!/bin/bash
#$ -cwd
#$ -M adithya.renduchintala@jhu.edu
#$ -m eas
#$ -l mem_free=250G,ram_free=250G
#$ -V
#$ -j y -o /home/arenduc1/MachineTranslation/little_prince/pipeline_de.log
. ~/.bashrc
set -e
WORKING_DIR="/home/arenduc1/MachineTranslation/little_prince"
MOSES_HOME="/home/pkoehn/moses"
LANG="de"
LANG_OUT="en"
INPUT_TXT="nachrichtenleicht.de"
EVAL_DIR=$WORKING_DIR/evaluation-$INPUT_TXT
FACTORS_DIR=$WORKING_DIR/factor-$INPUT_TXT
FILTERED_DIR=$WORKING_DIR/filtered-$INPUT_TXT
ANALYSIS_DIR=$WORKING_DIR/analysis-$INPUT_TXT
echo "STARTING........."
mkdir -p $EVAL_DIR
$MOSES_HOME/scripts/tokenizer/normalize-punctuation.perl $LANG < $WORKING_DIR/$INPUT_TXT | $MOSES_HOME/scripts/tokenizer/tokenizer.perl -a -l $LANG > $WORKING_DIR/$INPUT_TXT.tok
echo "MAKING FACTORIZED FILES........."

mkdir -p $FACTORS_DIR
$MOSES_HOME/scripts/training/wrappers/make-factor-de-lemma.perl $WORKING_DIR/$INPUT_TXT.tok $WORKING_DIR/$INPUT_TXT.tok.factorized.lemma $FACTORS_DIR
$MOSES_HOME/scripts/training/wrappers/make-factor-de-morph.perl $WORKING_DIR/$INPUT_TXT.tok $WORKING_DIR/$INPUT_TXT.tok.factorized.morph $FACTORS_DIR
$MOSES_HOME/scripts/training/combine_factors.pl $WORKING_DIR/$INPUT_TXT.tok $WORKING_DIR/$INPUT_TXT.tok.factorized.lemma $WORKING_DIR/$INPUT_TXT.tok.factorized.morph > $WORKING_DIR/$INPUT_TXT.tok.factorized
echo "REORDER AND TRUCASING...."


/home/pkoehn/statmt/project/de-syntax-reordering/mit-reorder-de2en-berkeley.perl $WORKING_DIR/tmp.reorder < $WORKING_DIR/$INPUT_TXT.tok.factorized | $MOSES_HOME/scripts/recaser/truecase.perl -model /home/pkoehn/experiment/wmt15-de-en/truecaser/truecase-model.1.de  > $WORKING_DIR/$INPUT_TXT.tc
echo "SPLITTING..."

$MOSES_HOME/scripts/generic/compound-splitter.perl -max-count 100 -model /home/pkoehn/experiment/wmt15-de-en/splitter/split-model.1.de < $WORKING_DIR/$INPUT_TXT.tc > $WORKING_DIR/$INPUT_TXT.split
echo "ANALYSIS...."

$MOSES_HOME/scripts/ems/support/analysis.perl -input $WORKING_DIR/$INPUT_TXT.split -input-corpus /home/pkoehn/experiment/wmt15-de-en/training/corpus.1.de -input-factors 3 -input-factor-names 'word,morph,lemma' -output-factor-names 'word,lemma,pos' -factored-ttable 0,1,2:/home/pkoehn/experiment/wmt15-de-en/model/phrase-table.1.0,1,2-0,1,2 -factored-ttable 1:/home/pkoehn/experiment/wmt15-de-en/model/phrase-table.1.1-1 -factored-ttable 2:/home/pkoehn/experiment/wmt15-de-en/model/phrase-table.1.2-2 -dir $WORKING_DIR/$ANALYSIS_DIR -score-options ' --GoodTuring --CountBinFeature 1 2 3 4 6 10 --MinScore 2:0.0001'

echo "ALINGMENT...."
touch $WORKING_DIR/$INPUT_TXT.moses.table.ini
$MOSES_HOME/scripts/training/train-model.perl -mgiza -mgiza-cpus 9 -sort-buffer-size 20G -sort-compress gzip -cores 24 -dont-zip -first-step 9 -external-bin-dir /home/pkoehn/statmt/bin -f de -e en -alignment grow-diag-final-and -max-phrase-length 5  -parts 50 -reordering hier-mslr-bidirectional-fe -score-options ' --GoodTuring --Cou    ntBinFeature 1 2 3 4 6 10 --MinScore 2:0.0001' -input-factor-max 2 -alignment-factors  0-0 -translation-factors 0,1,2-0,1,2+1-1+2-2 -reordering-factors 1-1 -generation-factors 1-2+2,1-0 -decoding-steps t0:t1,g0,t2,g1 -phrase-translation-table /home/pkoehn/experiment/wmt15-de-en/model/phrase-table.1.0,1,2-0,1,2 -phrase-translation-table /home/pkoehn/experiment/wmt15-de-en/model/phrase-table.1.1-1 -phrase-translation-table /home/pkoehn/experiment/wmt15-de-en/model/phrase-table.1.2-2 -reordering-table /home/pkoehn/experiment/wmt15-de-en/model/reordering-table.1.1-1 -config $WORKING_DIR/$INPUT_TXT.moses.table.ini -decoding-graph-backoff "0 1" -score-options '--DomainIndicator /home/pkoehn/experiment/wmt15-de-en/model/domains.1' -lm 0:3:$WORKING_DIR/$INPUT_TXT.moses.table.ini:8

echo "FILTERING...."

$MOSES_HOME/scripts/training/filter-model-given-input.pl $FILTERED_DIR /home/pkoehn/experiment/wmt15-de-en/tuning/moses.tuned.ini.1 $WORKING_DIR/$INPUT_TXT.split  -Binarizer "/home/pkoehn/moses/bin/processPhraseTableMin"
echo "DECODING...."

$MOSES_HOME/bin/moses.2015-04-01.kenlm7 -config $FILTERED_DIR/moses.ini -input-file $WORKING_DIR/$INPUT_TXT.split -mbr -mp -search-algorithm 1 -cube-pruning-pop-limit 5000 -s 5000  -max-trans-opt-per-coverage 100 -tt > $WORKING_DIR/$INPUT_TXT.output

$MOSES_HOME/scripts/ems/support/remove-segmentation-markup.perl < $WORKING_DIR/$INPUT_TXT.output > $WORKING_DIR/$INPUT_TXT.cleaned

$MOSES_HOME/scripts/recaser/detruecase.perl < $WORKING_DIR/$INPUT_TXT.cleaned > $WORKING_DIR/$INPUT_TXT.truecased

$MOSES_HOME/scripts/tokenizer/detokenizer.perl -l $LANG_OUT < $WORKING_DIR/$INPUT_TXT.truecased > $WORKING_DIR/$INPUT_TXT.detokenized

