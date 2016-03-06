__author__ = 'arenduchintala'
import json
import sys
import codecs
from optparse import OptionParser
from training_classes import TrainingInstance, SimpleNode, Guess

reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

if __name__ == '__main__':
    opt = OptionParser()
    opt.add_option('-t', dest='training_instances', default='')
    opt.add_option('-o', dest='output_vocab', default='')
    (options, _) = opt.parse_args()
    if options.training_instances.strip() == '' or options.output_vocab == '':
        sys.stderr.write(
            'Usage: python get_training_vocab.py -t [Training instance file] -o [prefix for output vocab]\n')
        exit(1)
    else:
        pass
    de_vocab = set([])
    en_vocab = set([])
    for ti_line in codecs.open(options.training_instances, 'r', 'utf8').readlines():
        j = json.loads(ti_line)
        ti = TrainingInstance.from_dict(j)
        obs = [o.l2_word for o in ti.current_sent if o.lang == 'de' if o.l2_word.strip() != '']
        obs += [g.l2_word for g in ti.past_guesses_for_current_sent if g.l2_word.strip() != '']
        obs += [g.l2_word for g in ti.past_correct_guesses if g.l2_word.strip() != '']
        obs = [o.split() for o in obs]

        guesses = [g.guess for g in ti.current_guesses if g.guess.strip() != '']
        guesses += [o.l2_word for o in ti.current_sent if o.lang == 'en' if o.l2_word.strip() != '']  # wink! ;)
        guesses += [g.guess for g in ti.past_correct_guesses if g.guess.strip() != '']
        guesses += [g.guess for g in ti.past_guesses_for_current_sent if g.guess.strip() != '']
        guesses = [g.split() for g in guesses]
        guesses_flat = sum(guesses, [])
        guesses_flat = [gf for gf in guesses_flat]
        obs_flat = sum(obs, [])
        obs_flat = [of for of in obs_flat]
        de_vocab.update(obs_flat)
        en_vocab.update(guesses_flat)

    w = codecs.open(options.output_vocab + '.en', 'w', 'utf8')
    w.write('\n'.join(sorted(en_vocab)))
    w.flush()
    w.close()
    w = codecs.open(options.output_vocab + '.en.lower', 'w', 'utf8')
    en_vocab_lower = set([e.lower() for e in en_vocab])
    w.write('\n'.join(sorted(en_vocab_lower)))
    w.flush()
    w.close()
    w = codecs.open(options.output_vocab + '.de', 'w', 'utf8')
    w.write('\n'.join(sorted(de_vocab)))
    w.flush()
    w.close()
