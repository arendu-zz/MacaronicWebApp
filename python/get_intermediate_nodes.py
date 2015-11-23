#!/usr/bin/env python
__author__ = 'arenduchintala'
import codecs
from optparse import OptionParser
import sys
from pprint import pprint
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

class TopList(object):
    def __init__(self):
        self._list = []
    

    def get_list(self):
        return self._list

    def add(self, prob, token):
        if len(self._list) < 5:
            self._list.append((prob, token))
        else:
            # already have 5 items so drop the least prob
            min_prob_token = min(self._list)
            min_prob = min_prob_token[0]
            min_token = min_prob_token[1]
            if min_prob < prob:
                self._list = [(p, t) for p, t in self._list if p != min_prob]
                assert len(self._list) < 5
                self._list.append((prob, token))
            else:
                pass

  
if __name__ == '__main__':
    opt = OptionParser()
    opt.add_option('-p', dest="phrase_table", default='')
    opt.add_option('-e', dest='intermediate', default='')
    (options, _) = opt.parse_args()
    if options.phrase_table == '' or options.intermediate == '':
        sys.stderr.write('Usage: python get_intermediate_nodes.py -p PHRASE_TABLE_FILE -e EDGES_FILE\n')
        exit(-1)
    else:
        pass

    lex_f2e = {}
    for l in codecs.open(options.phrase_table, 'r', 'utf-8').readlines():

        items = l.strip().split('|||')
        prob = float(items[2].strip())
        fr = items[0].strip()
        en = items[1].strip()
        tl = lex_f2e.get(fr, TopList())
        tl.add(prob, en)
        lex_f2e[fr] = tl  # (en| fr)

    for b in codecs.open(options.intermediate, 'r', 'utf-8').readlines():
        try:
            [en,fr] = b.strip().split()
        except ValueError:
            sys.stderr.write("FAILED TO SPLIT:" + b + "\n")
            exit(-1)
        tl = lex_f2e.get(fr.strip(),None)
        if tl is not None:
            en_list = [n[1].strip() for n in tl.get_list()]
            en = en.strip()
            if en in en_list:
                pass
            else:
                (best_en_prob, best_en_tok) = max(tl.get_list())
                print en, fr, best_en_tok




