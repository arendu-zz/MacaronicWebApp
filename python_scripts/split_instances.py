__author__ = 'arenduchintala'
import json
import random
import sys
import codecs
from optparse import OptionParser
from make_training_examples import SimpleNode, Guess, TrainingInstance

test_new = [131, 4, 134, 135, 137, 12, 141, 144, 18, 148, 24, 132, 175, 158, 31, 54, 9, 185, 60, 61]
dev_new = [161, 163, 165, 43, 44, 46, 178, 52, 30, 71, 77, 57, 88, 93, 104, 106, 189, 115, 120, 127]


def write_out(lst, label):
    w = codecs.open(options.training_instances + '.' + label, 'w', 'utf8')
    for ti in lst:
        w.write(json.dumps(ti) + '\n')
    w.flush()
    w.close()


if __name__ == '__main__':
    opt = OptionParser()
    opt.add_option('-i', dest='training_instances', default='')
    (options, _) = opt.parse_args()
    if options.training_instances.strip() == '':
        sys.stderr.write("Usage: python get_guesses_per_instances.py -i [TRAINING INSTANCES FILE]\n")
        exit(1)

    train = []
    dev = []
    test = []
    s = 0.15 * 28662
    for ti_line in codecs.open(options.training_instances, 'r', 'utf8').readlines():
        if ti_line.strip() != '':
            ti = TrainingInstance.from_dict(json.loads(ti_line.strip()))
            sent_id = int(ti.current_sent[0].sent_id)
            if sent_id in dev_new:
                dev.append(ti)
            elif sent_id in test_new:
                test.append(ti)
            else:
                train.append(ti)

    while len(dev) < s:
        idx = random.randint(0, len(train) - 1)
        t = train.pop(idx)
        dev.append(t)

    while len(test) < s:
        idx = random.randint(0, len(train) - 1)
        t = train.pop(idx)
        test.append(t)

    write_out(train, 'train')
    write_out(test, 'test')
    write_out(dev, 'dev')
