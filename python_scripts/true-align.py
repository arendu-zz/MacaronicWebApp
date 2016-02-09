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


def get_new_spans_and_wa(old_input_phrase, input_phrase, output_phrase, w_s, alignment):
    # print input_phrase, set([w[0] for w in w_s])
    # try:
    # assert len(input_phrase) == len(set([w[0] for w in w_s]))
    # except AssertionError:
    # print 'hmm'
    # raise AssertionError('input_phase length not eq to wa')
    input_phrase = [int(i) for i in input_phrase]
    input_alignment = (min(input_phrase), max(input_phrase))
    if len(input_phrase) > 1 and len(output_phrase) == 1:
        input_word_idx = [old_input_phrase[w[0]] for w in w_s]
        projected_input_word_idx = [alignment[iwx] for iwx in input_word_idx]
        new_ws = [p - min(projected_input_word_idx) for p in projected_input_word_idx]
        new_was = [(w, wa[1]) for w, wa in zip(new_ws, w_s)]
        wa_range = (min(projected_input_word_idx), max(projected_input_word_idx))
        return wa_range, new_was
    elif len(output_phrase) > 1 and len(input_phrase) == 1:
        assert len(input_phrase) == 1
        new_was = sorted(list(set([(0, idx) for idx, op in enumerate(output_phrase)])))
        return input_alignment, new_was
    elif len(input_phrase) == 1 and len(output_phrase) == 1:
        return input_alignment, [(0, 0)]
    else:
        raise BaseException('serious shit with untangle...')


def fixCoverage(converage_inp, final_wa):
    problem_idx = []
    for p_idx, v in converage_inp.iteritems():
        if len(v) > 1:
            problem_idx.append(p_idx)

    probem_spans = {}
    for idx, inp_range, toks, was in final_wa:
        for p_idx in problem_idx:
            r_st, r_end = (inp_range.split('-')[0], inp_range.split('-')[1])
            r_cov = range(int(r_st), int(r_end) + 1)
            if p_idx in r_cov:
                ps = probem_spans.get(p_idx, [])
                ps.append((len(r_cov), inp_range, was))
                probem_spans[p_idx] = ps

    for p_idx, ps in probem_spans.iteritems():
        ps.sort()
        to_fix = ps[-1]
        ws = [(pss.split('-')[0], pss) for pss in to_fix[2][3:].split()]
        w_r = [int(i) for i in to_fix[1].split('-')]
        w_range = range(min(w_r), max(w_r) + 1)
        fix_idx = w_range.index(p_idx)
        fixed_ws = [(f_idx, pss) for f_idx, pss in ws if int(f_idx) != int(fix_idx)]
        fixed_pss = [i[1] for i in fixed_ws]
        fixed_ws_idx = [int(i[0]) for i in fixed_ws]
        fixed_range = [w for w_idx, w in enumerate(w_range) if w_idx in fixed_ws_idx]
        fixed_range = str(min(fixed_range)) + '-' + str(max(fixed_range))
        fixed_pss = [str(i - min(fixed_ws_idx)) + '-0' for i in fixed_ws_idx]
        fixed_pss = 'wa=' + ' '.join(fixed_pss)
        ps[-1] = (0, fixed_range, fixed_pss)
        final_wa = [(f1, f2 if f2 != to_fix[1] else fixed_range, f3, f4 if f2 != to_fix[1] else fixed_pss) for
                    f1, f2, f3, f4 in final_wa]
        # print 'ok'

    return final_wa


def checkInputCoverage(final_wa, all_input_idx):
    input_wa_range = [tuple(i[1].split('-')) for i in final_wa]
    input_wa = [tuple(k.split('-')[0] for k in i[3][3:].split()) for i in final_wa]
    converage_inp = dict((i, 0) for i in all_input_idx)
    # print 'ok'
    for wa_range, wa in zip(input_wa_range, input_wa):
        for w in set(wa):
            converage_inp[int(wa_range[0]) + int(w)] += 1

    try:
        assert converage_inp.values() == [1] * len(converage_inp.values())
    except AssertionError:
        logit(' '.join([i[2] for i in final_wa]), 10)
        raise BaseException('true-align.py: Coverage Error')


def checkAndFixInputCoverage(final_wa, all_input_idx):
    input_wa_range = [tuple(i[1].split('-')) for i in final_wa]
    input_wa = [tuple(k.split('-')[0] for k in i[3][3:].split()) for i in final_wa]
    converage_inp = dict((i, []) for i in all_input_idx)
    # print 'ok'
    for wa_range, wa in zip(input_wa_range, input_wa):
        for w in set(wa):
            converage_inp[int(wa_range[0]) + int(w)] += [(wa_range, w)]

    for k, v in converage_inp.iteritems():
        if len(v) == 2:
            final_wa = fixCoverage(converage_inp, final_wa)
        elif len(v) < 1:
            logit(' '.join([i[2] for i in final_wa]), 10)
            raise BaseException('true-align.py: Unable to fix coverage')
        elif len(v) == 1:
            pass
    return final_wa


def merge(merged_wa):
    new_merged_wa = {}
    for k, lst in merged_wa.iteritems():
        ks = [int(i) for i in k.strip().split('-')]
        if ks[0] != ks[1]:
            assert len(lst) == 1
            new_merged_wa[k] = (lst[0][0], k, lst[0][1], lst[0][2])
        else:
            if len(lst) > 1:
                m = min(lst)[0]
                new_op = ' '.join([op for op_idx, op, wa_list in lst])
                new_wa_str = 'wa=' + ' '.join(['0-' + str(_idx) for _idx, new_op_tok in enumerate(new_op.split())])
                new_lst = (m, k, new_op, new_wa_str)
                if len(lst) > 1:
                    for op_idx, op, wa_str in lst:
                        if wa_str == 'wa=0-0':
                            pass
                        else:
                            # pdb.set_trace()
                            # raise BaseException('what is wa?')
                            pass
                new_merged_wa[k] = new_lst
            else:
                new_merged_wa[k] = (lst[0][0], k, lst[0][1], lst[0][2])
    full_list = sorted(new_merged_wa.values())
    return full_list


if __name__ == '__main__':
    opt = OptionParser()
    opt.add_option('-w', dest='wa', default='')
    opt.add_option('-a', dest='alignment', default='')
    (options, _) = opt.parse_args()
    if options.wa == '' or options.alignment == '':
        logit('Usage: python true-align.py -w UNTANGLED_WA_FILE -a ALIGNMENT_FILE\n', 10)
        exit(-1)
    else:
        pass
    all_alignments = codecs.open(options.alignment, 'r', 'utf8').readlines()
    all_was = codecs.open(options.wa, 'r', 'utf8').readlines()

    for sent_idx, (was, alignment) in enumerate(zip(all_was, all_alignments)[:]):
        logit("SENT_IDX:" + str(sent_idx) + "\n", 10)
        input_sent = alignment.strip().split()
        alignment = [int(i) for i in alignment.strip().split()]
        output_items = was.strip().split('|')
        output_phrases = [oi.strip() for idx, oi in enumerate(output_items) if idx % 2 == 0 and oi.strip() != '']
        output_sent = ' '.join(output_phrases).split()
        output_spans = get_output_phrase_as_spans(output_phrases)
        output_meta = [tuple(om.split(',wa=')) for idx, om in enumerate(output_items) if idx % 2 != 0]
        input_spans = [tuple([int(i) for i in om[0].split('-')]) for om in output_meta]
        projected_input_spans = [(alignment[i[0]], alignment[i[1]]) for i in input_spans]
        wa_per_span = [[tuple([int(i) for i in a.split('-')]) for a in om[1].split()] for om in output_meta]
        assert len(output_phrases) == len(output_spans)
        assert len(input_spans) == len(output_spans) == len(wa_per_span)
        new_was = []
        merged_wa = {}
        for op_idx, (o_p, o_s, i_s, old_i_s, w_s) in enumerate(
                zip(output_phrases, output_spans, projected_input_spans, input_spans, wa_per_span)):
            out_phrase = output_sent[o_s[0]:o_s[1] + 1]
            inp_phrase = range(min(i_s), max(i_s) + 1)
            old_inp_phrase = range(old_i_s[0], old_i_s[1] + 1)
            logit('\t' + ' '.join(out_phrase) + ' --- ' + str(inp_phrase) + "\n", 10)
            # print '\t', o_s, ' --- ', i_s, inp_phrase
            # print '\t', w_s
            new_i_s, new_w_s = get_new_spans_and_wa(old_inp_phrase, inp_phrase, out_phrase, w_s, alignment)

            wa_str = 'wa=' + ' '.join([str(w1) + '-' + str(w2) for w1, w2 in new_w_s])
            ph_str = ' '.join(out_phrase) + '|' + str(new_i_s[0]) + '-' + str(new_i_s[1]) + ',' + wa_str + '|'
            m_wa = str(new_i_s[0]) + '-' + str(new_i_s[1])
            merged_wa[m_wa] = merged_wa.get(m_wa, []) + [(op_idx, ' '.join(out_phrase), wa_str)]
            # print 'new wa phrase:', ph_str
            new_was.append(ph_str)
        new_merged_was = merge(merged_wa)
        new_merged_was = checkAndFixInputCoverage(new_merged_was, alignment)
        checkInputCoverage(new_merged_was, alignment)
        new_merged_was = [op + '|' + k + ',' + wa_str + '|' for op_idx, k, op, wa_str in new_merged_was]
        print ' '.join(new_merged_was)

