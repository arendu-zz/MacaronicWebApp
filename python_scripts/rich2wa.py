#!/usr/bin/env python
__author__ = 'arenduchintala'
import sys
import codecs
from optparse import OptionParser
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

if __name__ == '__main__':
    opt = OptionParser()
    opt.add_option('-r', dest='rich', default="")
    (options, _) = opt.parse_args()
    if (options.rich == ""):
        sys.stderr.write('Usage: python rich2wa.py -r FILE\n')
        exit(-1)
    else:
        pass
    fp = options.rich 
    inp = []
    for line in open(fp, 'r').readlines():
        items = line.split('|')
        tokens = [i.strip() for idx,i in enumerate(items) if idx%2 == 0 and i.strip() != '']
        info = [i.strip() for idx,i in enumerate(items) if idx%2 != 0 and i.strip() != '']
        info = [','.join(i.split(',')[:2]) for i in info]
        re_items = [i1+'|' + i2.strip()+'|' for i1, i2 in zip(tokens, info)]
        print ' '.join(re_items)
