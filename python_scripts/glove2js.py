__author__ = 'arenduchintala'
import sys
import json
import codecs
from optparse import OptionParser
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

if __name__ == '__main__':
    opt = OptionParser()
    #insert options here
    opt.add_option('-i', dest='glove_vecs', default='')
    (options, _) = opt.parse_args()
    d = {}
    for i in codecs.open(options.glove_vecs, 'r', 'utf8').readlines():
        items = i.strip().split()
        d[items[0].strip()] = [float(x) for x in items[1:]]
    
    
    print 'var_glove = ',  json.dumps(d)
