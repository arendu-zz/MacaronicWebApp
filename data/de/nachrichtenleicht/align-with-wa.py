#!/usr/bin/env python
__author__ = 'arenduchintala'
import sys
import codecs
from optparse import OptionParser
from itertools import groupby
import operator

reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'


def logit(str, priority=10):
    if priority > 5:
        sys.stderr.write(str)


def get_contiguous(lst):
    ranges = []
    for k, g in groupby(enumerate(lst), lambda (i, x): i - x):
        group = map(operator.itemgetter(1), g)
        ranges.append((group[0], group[-1]))
    return ranges


def get_output_phrase_as_spans(output_phrases):
    op_spans = []
    st_idx = 0
    end_idx = 0
    for op in output_phrases:
        l = len(op.split()) - 1
        end_idx = st_idx + l
        op_spans.append((st_idx, end_idx))
        st_idx = end_idx + 1
    return op_spans


def get_new_spans_and_wa(input_phrase, output_phrase):
    input_phrase = [int(i) for i in input_phrase]
    input_alignment = (min(input_phrase), max(input_phrase))
    if len(input_phrase) > 1:
        assert len(output_phrase) == 1
        new_was = sorted(list(set([(i - min(input_phrase), 0) for i in input_phrase])))
        return input_alignment, new_was

    elif len(output_phrase) > 1:
        assert len(input_phrase) == 1
        new_was = sorted(list(set([(0, idx) for idx, op in enumerate(output_phrase)])))
        return input_alignment, new_was
    elif len(input_phrase) == 1 and len(output_phrase) == 1:
        return input_alignment, [(0, 0)]
    else:
        raise BaseException('serious shit with untangle...')


if __name__ == '__main__':
    opt = OptionParser()
    opt.add_option('-w', dest='wa', default='')
    opt.add_option('-a', dest='alignment', default='')
    (options, _) = opt.parse_args()
    if options.wa == '' or options.alignment == '':
        logit('Usage: python align-with-wa.py -w WA_FILE -a ALIGNMENT_FILE\n', 10)
        exit(-1)
    else:
        pass
    all_alignments = codecs.open(options.alignment, 'r', 'utf8').readlines()
    all_was = codecs.open(options.wa, 'r', 'utf8').readlines()

    for sent_idx, (was, alignment) in enumerate(zip(all_was, all_alignments)[:]):
        input_sent = alignment.strip().split()
        output_items = was.strip().split('|')
        output_phrases = [oi.strip() for idx, oi in enumerate(output_items) if idx % 2 == 0 and oi.strip() != '']
        output_sent = ' '.join(output_phrases).split()
        output_spans = get_output_phrase_as_spans(output_phrases)
        output_meta = [tuple(om.split(',wa=')) for idx, om in enumerate(output_items) if idx % 2 != 0]
        input_spans = [tuple([int(i) for i in om[0].split('-')]) for om in output_meta]
        wa_per_span = [[tuple([int(i) for i in a.split('-')]) for a in om[1].split()] for om in output_meta]
        assert len(output_phrases) == len(output_spans)
        assert len(input_spans) == len(output_spans) == len(wa_per_span)
        new_was = []
        for o_p, o_s, i_s, w_s in zip(output_phrases, output_spans, input_spans, wa_per_span):
            out_phrase = output_sent[o_s[0]:o_s[1] + 1]
            inp_phrase = input_sent[i_s[0]:i_s[1] + 1]
            # print('\t' + ' '.join(out_phrase) + ' --- ' + ' '.join(inp_phrase))
            # print '\t', o_s, ' --- ', i_s, inp_phrase
            # print '\t', w_s
            new_i_s, new_w_s = get_new_spans_and_wa(inp_phrase, out_phrase)
            wa_str = 'wa=' + ' '.join([str(w1) + '-' + str(w2) for w1, w2 in new_w_s])
            ph_str = ' '.join(out_phrase) + '|' + str(new_i_s[0]) + '-' + str(new_i_s[1]) + ',' + wa_str + '|'
            # print 'new wa phrase:', ph_str
            new_was.append(ph_str)
        print ' '.join(new_was)

