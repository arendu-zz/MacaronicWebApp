__author__ = 'arenduchintala'
import json
import sys
import codecs
from optparse import OptionParser

'''reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'
'''
from make_training_examples import SimpleNode, Guess, TrainingInstance


def unique(seq):
    """
    return a unique/distinct items while preserving the order in which they occurred in the original input
    :param seq: input list with duplicates.
    :return:
    """
    seen = set()
    for item in seq:
        if item not in seen:
            seen.add(item)
            yield item


def log(msg, priority=20):
    if priority > 10:
        sys.stderr.write(msg + "\n")


if __name__ == '__main__':
    training_instances = []
    opt = OptionParser()
    opt.add_option('-i', dest='training_instances', default='')
    (options, _) = opt.parse_args()
    if options.training_instances.strip() == '':
        sys.stderr.write("Usage: python get_guesses_per_instances.py -i [TRAINING INSTANCES FILE]\n")
        exit(1)

    sentence2guesses = {}
    for ti_line in codecs.open(options.training_instances, 'r', 'utf8').readlines():
        if ti_line.strip() != '':
            ti = TrainingInstance.from_dict(json.loads(ti_line.strip()))
            sent_id = None
            for sn in ti.current_sent:
                sent_id = int(sn.sent_id)
                if sn.l1_parent.strip() != '':
                    sentence2guesses[sent_id] = sentence2guesses.get(sent_id, set([])).union([sn.l1_parent])

            for g in ti.current_guesses:
                if g.guess.strip() != '':
                    sentence2guesses[sent_id] = sentence2guesses.get(sent_id, set([])).union([g.guess])
    for s, glist in sentence2guesses.iteritems():
        print s, ' '.join(glist)
