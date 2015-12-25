__author__ = 'arenduchintala'
import sys
#import codecs
from optparse import OptionParser
#reload(sys)
#sys.setdefaultencoding('utf-8')
#sys.stdin = codecs.getreader('utf-8')(sys.stdin)
#sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
#sys.stdout.encoding = 'utf-8'

if __name__ == '__main__':
    opt = OptionParser()
    #insert options here
    opt.add_option('-a', dest='approve_file', default='assignment.accept')
    opt.add_option('-r', dest='reject_file', default='assignment.reject')
    opt.add_option('--review', dest='review_file', default='assignment.review')
    (options, _) = opt.parse_args()
    if options.approve_file == '' or options.reject_file == '' or options.review_file == '':
        sys.stderr.write('Useage: python review.py -a [APPROVE FILE] -r [REJECT FILE] --review [REVIEW FILE]\n')
        exit(-1)
    approve = [i.strip() for i in open(options.approve_file, 'r').readlines()]
    reject = [i.strip() for i in open(options.reject_file, 'r').readlines()]
    review = {}
    for line in open(options.review_file, 'r').readlines():
        items = line.split('\t')
        attempts = review.get(items[0].strip(), [])
        attempts.append((items[1], items[2], items[3]))
        review[items[0].strip()] = attempts

    for assignment_id, atts in review.iteritems():
        print assignment_id
        print atts[0][0]
        for a1, a2, a3 in atts:
            print '\t',a2
            print '\t',a3
            print ''
        try:
            accept = raw_input("accept? (y/n)")
        except BasicException:
            raise BasicException;
        print 'accepted:' , accept == 'y'
        if accept == 'y':
            reject.remove(assignment_id.strip())
            approve.append(assignment_id.strip())
        else:
            pass
    w = open(options.reject_file, 'w')
    w.write('\n'.join(reject))
    w.flush()
    w.close()

    w = open(options.approve_file, 'w')
    w.write('\n'.join(approve))
    w.flush()
    w.close()


