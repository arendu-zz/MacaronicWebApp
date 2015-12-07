#!/usr/bin/env python
__author__ = 'arenduchintala'
import sys
import codecs
from optparse import OptionParser
import itertools
from itertools import groupby
import operator
from   pprint import pprint

reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'



def match_splits(d, tokens_in_key, unmatched_in_key, tokens_in_val, unmatched_in_val):
    contiguous_unmatched = get_contiguous(unmatched_in_key, len(unmatched_in_val))
    # print contiguous_unmatched
    if len(contiguous_unmatched) > 0:
        for c_group in contiguous_unmatched:
            ave_cg = sum(c_group) / len(c_group)
            parts = [tokens_in_key[cg] for cg in range(c_group[0], c_group[1] + 1)]
            for joined in get_joined(parts):
                # print c_group, ave_cg
                logit(joined + '\n')
                j2o_idxs = sorted([(abs(ave_cg - o_idx), o_idx) for o_idx, original_token in enumerate(tokens_in_val) if
                                   original_token == joined])
                if len(j2o_idxs) > 0:
                    j2o_idx = j2o_idxs[0][1]
                    # print 'found at', j2o_idx
                    for cg in range(c_group[0], c_group[1] + 1):
                        a_idx = d.get(cg, [])
                        a_idx.append(j2o_idx)
                        d[cg] = a_idx
                    break
    return d


def get_joined(parts, connecting_elements=['', 'n', 'en', 's', 'es']):
    joined = []
    for prod in itertools.product(connecting_elements, repeat=len(parts) - 1):
        zprod = list(prod) + ['']
        j = ''.join([i + x for i, x in zip(parts, zprod)])
        joined.append(j)
    return joined


def get_contiguous(lst, max_groups=10000):
    ranges = []
    for k, g in groupby(enumerate(lst), lambda (i, x): i - x):
        group = map(operator.itemgetter(1), g)
        ranges.append((group[0], group[-1]))
    if len(ranges) < max_groups:
        if ranges == [(2, 5)]:
            ranges = [(2, 3), (4, 5)]
        elif ranges == [(6, 9)]:
            ranges = [(6, 7), (8, 9)]
        else:
            pass
    return ranges


def logit(string, priority=1):
    if priority > 5:
        sys.stderr.write(string)


def score(permutation, other_unmatched):
    # print 'perms:', permutation
    s = []
    ave_gap = 0
    n_gap = 0
    for p1, p2 in permutation:
        if p1 != 'null' and p2 != 'null':
            ag = (max(p1, p2) - min(p1, p2)) / 2.0
            s.append(abs(p1 - p2))
            ave_gap += ag
            neighbors = [p2 - 1, p2 + 1]
            for n in neighbors:
                if n in other_unmatched:
                    # print 'p2', p2, 'has a unmatched neighor'
                    n_gap = 1

    return n_gap, min(s), ave_gap


def resolve_by_unique(d, tokens_of_key, other_d):
    word_match_groups = {}
    for i, v in d.iteritems():
        if len(v) > 1:
            i_tok = tokens_of_key[i]
            s_tup = word_match_groups.get(i_tok, (set([]), set([])))
            s_tup[0].add(i)
            s_tup[1].update(v)
            word_match_groups[i_tok] = s_tup

    # pprint(word_match_groups)
    other_unmatched = [k for k, v in other_d.iteritems() if len(v) == 0]
    resolved = {}
    for w, (s1, s2) in word_match_groups.iteritems():
        # print w
        s1 = list(s1)
        s2 = list(s2)
        # print s1
        # print s2
        if len(s1) == len(s2):
            pass
        else:
            if len(s1) < len(s2):
                pad = ['null'] * abs(len(s2) - len(s1))
                s1 += pad
            else:
                pad = ['null'] * abs(len(s1) - len(s2))
                s1 += pad
        if len(s1) <= 6:
            perms = [zip(x, s2) for x in itertools.permutations(s1, len(s2))]
            min_score = (float('inf'), float('inf'), float('inf'))
            min_p = None
            for p in perms:
                sp = score(p, other_unmatched)
                # print p, sp
                if sp < min_score:
                    min_score = sp
                    min_p = p
            resolved[w] = min_p
        else:

            raise BaseException('too many repeating words...')
    for w, p in resolved.iteritems():
        for p_inp, p_out in p:
            if p_inp != 'null' and p_out != 'null':
                d[p_inp] = [p_out]
                # print 'resolved', p_inp, d[p_inp]
    return d


def resolve_word_matches(i2o, o2i, input_mt_tokens, original_mt_tokens):
    assert isinstance(input_mt_tokens, list)
    assert isinstance(original_mt_tokens, list)
    i2o = resolve_by_unique(i2o, input_mt_tokens)
    o2i = resolve_by_unique(o2i, original_mt_tokens)


def check_alignment(d, input_mt_tokens):
    assert isinstance(input_mt_tokens, list)
    for i, v in d.iteritems():
        if len(v) > 1:
            # print i, v
            raise BaseException('multiple word matches...')
    i2o_keys_set = set([k for k, v in d.iteritems() if len(v) == 0])
    if len(i2o_keys_set) == 0:
        pass
    else:
        for idx in i2o_keys_set:
            # print input_mt_tokens[idx], idx
            pass
        raise BaseException('input tokens not covered')

    return True


def get_map(in_string, out_string):
    d = dict((i, []) for i, tok in enumerate(in_string))
    for in_idx, in_token in enumerate(in_string):
        matched_idxes = [idx for idx, out_token in enumerate(out_string) if out_token == in_token]
        a_idx = d.get(in_idx, [])
        a_idx += matched_idxes
        d[in_idx] = a_idx
    return d


def intersect_maps(d1, d2):
    d = dict((k, []) for k in d1.keys())
    for k, v in d1.iteritems():
        for vk in v:
            if k in d2[vk]:
                d[k].append(vk)
    return d


if __name__ == '__main__':
    opt = OptionParser()
    # insert options here
    opt.add_option('-o', dest='original_mt', default='')
    opt.add_option('-i', dest='input_mt', default='')
    opt.add_option('-a', dest='output_mt', default='')
    (options, _) = opt.parse_args()
    if options.original_mt == '' or options.input_mt == '' or options.output_mt == '':
        logit('Usage: python un-preorder.py -o ORIGINAL_MT_INPUT -i PRE_REORDERED_MT_INPUT -a MT_OUTPUT\n', 20)
        exit(-1)
    else:
        input_mt = codecs.open(options.input_mt, 'r', 'utf8').read().strip().split('\n')
        original_mt = codecs.open(options.original_mt, 'r', 'utf8').read().strip().split('\n')
        output_mt = codecs.open(options.output_mt, 'r', 'utf8').read().strip().split('\n')

        for line_num, (input_mt_line, original_mt_line, output_mt_line) in enumerate(
                zip(input_mt, original_mt, output_mt)[:]):  # 11, 15, 102, 1406, 1733, 2136, 4531
            input_mt_line = input_mt_line.lower().strip()
            original_mt_line = original_mt_line.lower().strip()
            input_mt_tokens = input_mt_line.lower().split()
            original_mt_tokens = original_mt_line.lower().split()
            if input_mt_line.lower().strip() != original_mt_line.lower().strip():
                logit(str(line_num) + '\n', 10)
                logit('original:' + original_mt_line + '\n', 10)
                logit('re      :' + input_mt_line + '\n', 10)
                is_split = len(input_mt_tokens) != len(original_mt_tokens)
                logit(str(is_split) + '\n')

                I2O = get_map(input_mt_tokens, original_mt_tokens)
                O2I = get_map(original_mt_tokens, input_mt_tokens)

                logit('INITIAL I20\n')
                # pprint(I2O)
                logit('resolving I2O\n')
                I2O = resolve_by_unique(I2O, input_mt_tokens, O2I)

                logit('RESOLVED I2O\n')
                # pprint(I2O)
                logit('INITIAL O2I\n')
                # pprint(O2I)
                logit('resolving O2I\n')
                O2I = resolve_by_unique(O2I, original_mt_tokens, I2O)

                logit('RESOLVED O2I\n')
                # pprint(O2I)

                I2O = intersect_maps(I2O, O2I)
                I2O_unmatched = [k for k, v in I2O.iteritems() if len(v) == 0]
                logit('INTERSECTED I2O\n')
                # pprint(I2O)
                O2I = intersect_maps(O2I, I2O)
                O2I_unmatched = [k for k, v in O2I.iteritems() if len(v) == 0]
                # #print 'INTERSECTED O2I'
                # #pprint(O2I)
                # resolve_word_matches(I2O, O2I, input_mt_tokens, original_mt_tokens)

                I2O = match_splits(I2O, input_mt_tokens, I2O_unmatched, original_mt_tokens, O2I_unmatched)

                logit('FINAL I2O\n')
                # pprint(I2O)

                check_alignment(I2O, input_mt_tokens)
                alignments = [str(I2O[i][0]) for i, tok in enumerate(input_mt_tokens)]
            else:
                alignments = [str(i) for i, tok in enumerate(input_mt_tokens)]
            print ' '.join(alignments)













