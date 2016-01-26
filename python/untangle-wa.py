#!/usr/bin/env python
__author__ = 'arenduchintala'
import codecs
from optparse import OptionParser
from itertools import groupby, product
from collection_of_edits import Sentence, Node, Graph, EN_LANG, DE_LANG, START, END, get_edges, Swap
from pets import get_swap_rules, get_split_sets
import json
import sys
import operator
import itertools
import fix_alignments

'''reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'
'''

VIS_LANG = 'de'
INPUT_LANG = 'de'
USE_SPLIT = False


def logit(str, priority=0):
    if priority > 5:
        sys.stderr.write(str)


def get_contiguous(lst):
    ranges = []
    for k, g in groupby(enumerate(lst), lambda (i, x): i - x):
        group = map(operator.itemgetter(1), g)
        ranges.append((group[0], group[-1]))
    return ranges


def swap_key(k, sw):
    assert isinstance(k, int)
    assert isinstance(sw, set)
    l = [i for i in sw]
    l.append(k)
    l.sort()
    return tuple(l)


def swap_notation(i, swap_i, swap_o):
    if i in swap_i:
        return i, swap_o[swap_i.index(i)]
    elif i in swap_o:
        return swap_i[swap_o.index(i)], i
    else:
        return i


def check_symmetric(wa_list):
    inp_wa, out_wa = make_inp_out(wa_list)
    inp_wa_sym = check_wa_dict(inp_wa)
    out_wa_sym = check_wa_dict(out_wa)
    return inp_wa_sym and out_wa_sym


def check_wa_dict(wa_dict):
    for k, v in wa_dict.items():
        if len(v) > 1:
            for v_ind in v:
                for v_all in wa_dict.values():
                    if v_ind in v_all and v_all is not v:
                        return False
    return True


def make_inp_out(wa_list):
    inp_wa = {}
    out_wa = {}
    for inp_a, out_a in wa_list:
        tmp = inp_wa.get(tuple([inp_a]), set([]))
        tmp = set(list(tmp))
        tmp.add(out_a)
        inp_wa[tuple([inp_a])] = tuple(list(tmp))
        tmp = out_wa.get(tuple([out_a]), set([]))
        tmp = set(list(tmp))
        tmp.add(inp_a)
        out_wa[tuple([out_a])] = tuple(list(tmp))

    return inp_wa, out_wa


def get_coverage(wa_list, original_wa_list):
    original_inp = set([i[0] for i in original_wa_list])
    original_out = set([i[1] for i in original_wa_list])
    current_inp = set([i[0] for i in wa_list])
    current_out = set([i[1] for i in wa_list])
    return len(original_inp - current_inp) + len(original_out - current_out)


def insert_epsilon_edge(wa_original, inp_phrase, out_phrase):
    wa = [a for a in wa_original]
    inp_cov = [0] * len(inp_phrase)
    out_cov = [0] * len(out_phrase)
    inp_pos_ratio = [float(idx) / len(inp_phrase) for idx, i in enumerate(inp_phrase)]
    out_pos_ratio = [float(idx) / len(out_phrase) for idx, i in enumerate(out_phrase)]
    while 0 in inp_cov or 0 in out_cov:
        for i, o in wa:
            inp_cov[i] = 1
            out_cov[o] = 1
        for i_idx, (pos_ratio, ic) in enumerate(zip(inp_pos_ratio, inp_cov)):
            if ic == 0:
                out_pos_ratio_diff = [(abs(pos_ratio - pr), o_idx) for o_idx, pr in enumerate(out_pos_ratio)]
                out_pos_ratio_diff.sort()
                best_out_alignment_idx = out_pos_ratio_diff[0][1]
                wa.append((i_idx, best_out_alignment_idx))
        for i, o in wa:
            inp_cov[i] = 1
            out_cov[o] = 1
        for o_idx, (pos_ratio, oc) in enumerate(zip(out_pos_ratio, out_cov)):
            if oc == 0:
                inp_pos_ratio_diff = [(abs(pos_ratio - pr), i_idx) for i_idx, pr in enumerate(inp_pos_ratio)]
                inp_pos_ratio_diff.sort()
                best_inp_alignment_idx = inp_pos_ratio_diff[0][1]
                wa.append((best_inp_alignment_idx, o_idx))
        for i, o in wa:
            inp_cov[i] = 1
            out_cov[o] = 1
    return wa


def make_symmetric(wa_list):
    _stack = []
    _stack.append((0, wa_list))
    while len(_stack) > 0:
        _stack.sort()
        curr_coverage, curr_wa_list = _stack.pop(0)
        if check_symmetric(curr_wa_list):
            return curr_coverage, curr_wa_list
        else:
            for i in range(0, len(curr_wa_list)):
                copy_wa_list = [item for idx, item in enumerate(curr_wa_list) if idx != i]
                # print 'removing an item', copy_wa_list, ' form ', curr_wa_list
                _stack.append((get_coverage(copy_wa_list, wa_list), copy_wa_list))
    return 0, []


def remove_subset(d):
    # print 'checking remove subset', d
    del_d = set([])
    for k, v in d.items():
        set_k = set(list(k))
        set_v = set(list(v))
        for sk, sv in d.items():
            set_sk = set(list(sk))
            set_sv = set(list(sv))
            # print 'compare', set_k, set_sk
            if set_k != set_sk and set_k.issubset(set_sk):
                del_d.add(tuple(set_k))
    # print 'delete', del_d, 'in ', d.keys()
    return del_d


def untangle_wa(wa_list):
    inp_wa_2_out_wa = {}
    out_wa_2_inp_wa = {}
    merged = {}
    for inp_a, out_a in wa_list:
        tmp = inp_wa_2_out_wa.get(tuple([inp_a]), set([]))
        tmp.add(out_a)
        inp_wa_2_out_wa[tuple([inp_a])] = tmp
        tmp = out_wa_2_inp_wa.get(tuple([out_a]), set([]))
        tmp.add(inp_a)
        out_wa_2_inp_wa[tuple([out_a])] = tmp

    # print 'before'

    same = False
    p_r_i = None
    p_r_o = None
    while not same:
        del_inp = set([])
        del_out = set([])
        for ko, vi in out_wa_2_inp_wa.items():
            for v in vi:
                update1 = inp_wa_2_out_wa.get(tuple([v]), set([]))
                update2 = inp_wa_2_out_wa.get(tuple(vi), set([]))
                inp_wa_2_out_wa[tuple(vi)] = update1.union(update2)
                del_inp.add(tuple([v]))
        for ki, vo in inp_wa_2_out_wa.items():
            for v in vo:
                update1 = out_wa_2_inp_wa.get(tuple([v]), set([]))
                update2 = out_wa_2_inp_wa.get(tuple(vo), set([]))
                out_wa_2_inp_wa[tuple(vo)] = update1.union(update2)
                del_out.add(tuple([v]))
        # print 'after'
        r_i = remove_subset(inp_wa_2_out_wa)
        r_o = remove_subset(out_wa_2_inp_wa)
        if r_i == p_r_i and r_o == p_r_o:
            same = True
        else:
            same = False
        p_r_i = r_i
        p_r_o = r_o

    # print 'deleting subsets'
    for rem_ro in p_r_o:
        del out_wa_2_inp_wa[rem_ro]
    for rem_ri in p_r_i:
        del inp_wa_2_out_wa[rem_ri]

    for k, v in inp_wa_2_out_wa.items():
        inp_wa_2_out_wa[k] = tuple(list(v))
    return inp_wa_2_out_wa


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


if __name__ == '__main__':
    opt = OptionParser()

    opt.add_option('-i', dest='input_mt', default='../data/fr/newstest2013/newstest2013.input.tok.1')
    # opt.add_option('-i', dest='input_mt', default='')
    opt.add_option('-o', dest='output_mt', default='../data/fr/newstest2013/newstest2013.output.1.wa')
    # opt.add_option('-o', dest='output_mt', default='')
    (options, _) = opt.parse_args()
    if options.input_mt == '' or options.output_mt == '':
        logit('Usage: python coe-from-mt.py -i INPUT_MT -o OUTPUT_MT\n', 10)
        exit(-1)
    else:
        pass

    input_mt = codecs.open(options.input_mt, 'r', 'utf-8').readlines()
    output_mt = codecs.open(options.output_mt, 'r', 'utf-8').readlines()
    assert len(input_mt) == len(output_mt)
    sent_idx = 0
    eps_word_alignment = 0
    all_coe_sentences = []
    coe_sentences = []
    for input_line, output_line in zip(input_mt, output_mt)[:]:
        logit('SENT' + str(sent_idx) + '\n')
        input_sent = input_line.strip().split()
        output_items = output_line.strip().split('|')
        output_phrases = [oi.strip() for idx, oi in enumerate(output_items) if idx % 2 == 0 and oi.strip() != '']
        output_sent = ' '.join(output_phrases).split()
        output_spans = get_output_phrase_as_spans(output_phrases)
        output_meta = [tuple(om.split(',wa=')) for idx, om in enumerate(output_items) if idx % 2 != 0]
        input_spans = [tuple([int(i) for i in om[0].split('-')]) for om in output_meta]
        wa_per_span = [[tuple([int(i) for i in a.split('-')]) for a in om[1].split()] for om in output_meta]
        input_tok_group = [-1] * len(input_sent)
        output_tok_group = [-1] * len(output_sent)

        logit('input sent:' + ' '.join(input_sent) + '\n')
        logit('output sent:' + ' '.join(output_sent) + '\n')

        sent_idx += 1
        assert len(wa_per_span) == len(input_spans) == len(output_spans)
        input_coverage = [0] * len(input_sent)
        untangle_wa_line = []
        for idx, (out_span, inp_span, wa) in enumerate(zip(output_spans, input_spans, wa_per_span)):
            out_phrase = output_sent[out_span[0]:out_span[1] + 1]
            inp_phrase = input_sent[inp_span[0]:inp_span[1] + 1]
            # print '\t phrases:', input_sent[inp_span[0]:inp_span[1] + 1], '-', output_sent[out_span[0]:out_span[1] + 1]
            # print '\t phrase spans:', inp_span, '-', out_span
            # print '\twa:', wa
            # print '\t\tsofar:', untangle_wa_line
            '''wa_no_null = insert_epsilon_edge(wa, input_sent[inp_span[0]:inp_span[1] + 1],
                                             output_sent[out_span[0]:out_span[1] + 1])
            sym_coverage, sym_wa = make_symmetric(wa_no_null)
            assert sym_coverage == 0
            untangle = untangle_wa(sym_wa)'''

            fixed_wa = fix_alignments.fix_alignment(wa, inp_phrase, out_phrase)
            untangle = untangle_wa(fixed_wa)

            sorted_by_output_untangle = sorted(untangle.items(), key=operator.itemgetter(1))
            for k, v in sorted_by_output_untangle:
                untangle_inp_span = str(min(inp_span) + min(k)) + '-' + str(min(inp_span) + max(k))
                untangle_out_span = (min(out_span) + min(v), min(out_span) + max(v))
                new_out_phrase = ' '.join(output_sent[untangle_out_span[0]:untangle_out_span[1] + 1])
                new_wa = ' '.join(
                    [str(wa_de - min(k)) + '-' + str(wa_en - min(v)) for wa_de, wa_en in
                     itertools.product(list(k), list(v))])
                untangle_wa_line.append(new_out_phrase + '|' + untangle_inp_span + ',wa=' + new_wa + '|')
        print ' '.join(untangle_wa_line)

