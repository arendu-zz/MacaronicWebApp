__author__ = 'arenduchintala'
import json
import random
import sys
import codecs
from optparse import OptionParser
from make_training_examples import SimpleNode, Guess, TrainingInstance
import matplotlib.pyplot as plt

if __name__ == '__main__':
    f_x_y = {}
    ma = 0
    f = '../data/de/mturk-data/non_empty_guess_ti.txt.train.random'
    for line in codecs.open(f, 'r', 'utf8').readlines():
        ti = TrainingInstance.from_dict(json.loads(line.strip()))
        gs = [g.guess for g in ti.current_guesses]
        c = len(gs)
        bc = [g.guess for g in ti.current_guesses if g.guess.strip() == '']
        # frac_c_bc = float(c - len(bc)) / float(c)
        frac_c_bc = float(c - len(bc))
        f_x_y[(frac_c_bc, c)] = f_x_y.get((frac_c_bc, c), 0) + 1
        if f_x_y[(frac_c_bc, c)] > ma:
            ma = f_x_y[(frac_c_bc, c)]
    x = []
    y = []
    sizes = []
    for i, v in f_x_y.iteritems():
        x.append(i[1])
        y.append(i[0])
        sizes.append(1500 * (float(v) / float(ma)))
    plt.xlabel("num gaps")
    plt.ylabel("num guesses")
    plt.scatter(x, y, s=sizes, alpha=0.75, c='b')
    plt.legend()
    plt.show()
