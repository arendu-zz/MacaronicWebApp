__author__ = 'arenduchintala'
import sys
import codecs
from pprint import pprint

reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'


def has_epsilons(wa, inp_phrase, out_phrase):
    inp_cov = [0] * len(inp_phrase)
    out_cov = [0] * len(out_phrase)
    for i, o in wa:
        inp_cov[i] = 1
        out_cov[o] = 1
    return 0 in inp_cov or 0 in out_cov


def new_possible_edges(wa, inp_phrase, out_phrase):
    # simply pick and i_idx, o_idx (randomly)
    # check if it is still symmetric
    # if it is then add the edge...
    inp_cov = [0] * len(inp_phrase)
    out_cov = [0] * len(out_phrase)
    for i, o in wa:
        inp_cov[i] = 1
        out_cov[o] = 1
    possible_additional_edges = []
    for idx_inp_cov, i_cov in enumerate(inp_cov):
        if i_cov == 0:
            additional_edges = [(idx_inp_cov, idx_out_cov) for idx_out_cov, o_cov in enumerate(out_cov)]
            possible_additional_edges += additional_edges
    for idx_out_cov, o_cov in enumerate(out_cov):
        if o_cov == 0:
            additional_edges = [(idx_inp_cov, idx_out_cov) for idx_inp_cov, i_cov in enumerate(inp_cov)]
            possible_additional_edges += additional_edges
    symmetric_possible_edges = []
    for pe in possible_additional_edges:
        new_wa = wa + [pe]
        if check_symmetric(new_wa) and pe not in symmetric_possible_edges:
            symmetric_possible_edges.append(pe)
    return symmetric_possible_edges


def add_an_edge_bak(wa, inp_phrase, out_phrase):
    possible_edge_additions = []
    inp_cov = [0] * len(inp_phrase)
    out_cov = [0] * len(out_phrase)
    for i, o in wa:
        inp_cov[i] = 1
        out_cov[o] = 1
    inp_aligned_to = {}
    out_aligned_to = {}
    for idx, i in enumerate(inp_phrase):
        inp_aligned_to[idx] = []
    for odx, o in enumerate(out_phrase):
        out_aligned_to[odx] = []
    for i, o in wa:
        inp_aligned_to[i] = inp_aligned_to[i] + [o]
        out_aligned_to[o] = out_aligned_to[o] + [i]

    for idx, ic in enumerate(inp_cov):
        if ic == 0:
            if 0 in out_cov:
                for odx, aligned_idxs in out_aligned_to.iteritems():
                    if len(aligned_idxs) == 0:
                        additional_wa = [w for w in wa]
                        additional_wa.append((idx, odx))
                        possible_edge_additions.append(additional_wa)

            near_idx = sorted([(abs(other_idx - idx), other_idx) for other_idx in range(len(inp_cov))])
            near_idx = [other_idx for d, other_idx in near_idx]
            near_idx.pop(0)  # first near_idx == idx
            for n_idx in near_idx:
                possible_odxs = sorted([(len(out_aligned_to[p_odx]), p_odx) for p_odx in inp_aligned_to[n_idx]])
                possible_odxs = [p_odx for num_aligned, p_odx in possible_odxs]
                for p_odx in possible_odxs:
                    if len(out_aligned_to[p_odx]) <= 1:
                        additional_wa = [w for w in wa]
                        additional_wa.append((idx, p_odx))
                        possible_edge_additions.append(additional_wa)
        else:
            pass
    return possible_edge_additions


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


def edge_insert_score(wa):
    inp_aligned_to = {}
    out_aligned_to = {}
    for i, o in wa:
        inp_aligned_to[i] = inp_aligned_to.get(i, []) + [o]
        out_aligned_to[o] = out_aligned_to.get(o, []) + [i]
    score = 0
    for k, v in inp_aligned_to.iteritems():
        s1 = 2 * abs(min(v) - max(v))
        s2 = 0.5 * max(abs(k - min(v)), abs(k - max(v)))
        score = score + s1 + s2

    for k, v in out_aligned_to.iteritems():
        s1 = 2 * abs(min(v) - max(v))
        s2 = 0.5 * max(abs(k - min(v)), abs(k - max(v)))
        score = score + s1 + s2
    # score = score + float('inf') if check_symmetric(wa) else 0
    if check_symmetric(wa):
        return score  # lower the better
    else:
        raise BaseException('should not reach this point')
        return float('inf')  # lower the better


def remove_epsilons(wa, inp_phrase, out_phrase, init_score=0):
    solutions = []
    _stack = []
    _stack.append((edge_insert_score(wa) + init_score, wa, inp_phrase, out_phrase))
    while len(_stack) > 0:
        _stack.sort()
        score_curr_wa, curr_wa, curr_ip, curr_op = _stack.pop(0)
        if score_curr_wa < float('inf'):
            if has_epsilons(curr_wa, curr_ip, curr_op):
                new_edges = new_possible_edges(curr_wa, curr_ip, curr_op)
                for ne in new_edges:
                    new_wa = curr_wa + [ne]
                    _stack.append((edge_insert_score(new_wa) + init_score, new_wa, curr_ip, curr_op))
            else:
                solutions.append((score_curr_wa + init_score, curr_wa))
        else:
            pass
    solutions.sort()
    return solutions


def coverage_score(wa, inp_phrase, out_phrase):
    inp_cov = [0] * len(inp_phrase)
    out_cov = [0] * len(out_phrase)
    for i, o in wa:
        inp_cov[i] = 1
        out_cov[o] = 1
    return (len(inp_cov) + len(out_cov)) - (sum(inp_cov) + sum(out_cov))  # lower the better


def remove_edges(wa, inp_phrase, out_phrase):
    solutions = []
    _stack = []
    cov_score = coverage_score(wa, inp_phrase, out_phrase)
    _stack.append((cov_score, wa, inp_phrase, out_phrase))
    while len(_stack) > 0:
        _stack.sort()
        curr_score, curr_wa, curr_inp_phrase, curr_out_phrase = _stack.pop()
        if check_symmetric(curr_wa):
            solutions.append((curr_score, curr_wa))
        else:
            for idx, (wa_i, wa_o) in enumerate(curr_wa):
                new_wa = [(i, o) for i, o in curr_wa if (i, o) != (wa_i, wa_o)]
                score_new_wa = coverage_score(new_wa, inp_phrase, out_phrase)
                if score_new_wa < curr_score:
                    pass
                else:
                    _stack.append((score_new_wa, new_wa, inp_phrase, out_phrase))
    solutions.sort()
    return solutions


def fix(wa, inp_phrase, out_phrase):
    fixed_solutions = []
    sym_solutions = remove_edges(wa, inp_phrase, out_phrase)
    for sym_score, sym_solution in sym_solutions[:5]:
        new_sols = remove_epsilons(sym_solution, inp_phrase, out_phrase, init_score=sym_score)
        fixed_solutions += new_sols
    fixed_solutions.sort()
    return fixed_solutions


def fix_alignment(wa, inp_phrase, out_phrase):
    perfect_sol = []
    _stack = [(wa, inp_phrase, out_phrase)]
    while len(_stack) > 0:
        curr_wa, ip, op = _stack.pop()
        fixed = fix(curr_wa, ip, op)
        if len(fixed) == 0:
            for idx in range((len(curr_wa))):
                del_original_edges_wa = [wa for wa_idx, wa in enumerate(curr_wa) if wa_idx != idx]
                _stack.append((del_original_edges_wa, ip, op))
        else:
            perfect_sol += fixed
            break
    perfect_sol.sort()
    final_score, final_sol = perfect_sol[0]
    return final_sol


if __name__ == '__main__':
    # wa = [(0, 2), (0, 1), (1, 1), (0, 3), (1, 2), (3, 3)]
    '''wa = [(0, 2), (1, 1), (1, 2)]
    inp_phrase = ['a', 'b', 'c', 'd']
    out_phrase = ['A', 'B', 'C']'''

    '''wa = [(2, 0)]
    inp_phrase = ['a', 'b', 'c']
    out_phrase = ['A']'''

    '''wa = [(3, 0), (3, 1)]
    inp_phrase = ['a', 'b', 'c', 'd']
    out_phrase = ['A', 'B']'''

    wa = [(0, 2), (1, 1)]
    inp_phrase = ['a', 'b']
    out_phrase = ['A', 'B', 'C']
    tmp = fix(wa, inp_phrase, out_phrase)
    for t in tmp:
        print 'score:', t[0], 'wa:', t[1]













