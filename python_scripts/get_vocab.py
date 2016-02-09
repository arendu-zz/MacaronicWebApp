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
    opt.add_option('-i', dest='input_file', default='')
    (options, _) = opt.parse_args()
    if options.input_file == '':
        sys.stderr.write('Usage: python get_vocab.py -i FILE\n')
        exit(-1)
    else:
        pass
    toks = list(set(codecs.open(options.input_file, 'r', 'utf8').read().split()))
    print '\n'.join(toks)
