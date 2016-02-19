__author__ = 'arenduchintala'
import json
import sys
import codecs
import pdb

'''reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'
'''

from collection_of_edits import Sentence, Node, Graph, Edge, Swap
from make_training_examples import TrainingInstance, SimpleNode, Guess

if __name__ == '__main__':
    training_instances = []
    with codecs.open("tmp.100", "r", "utf-8") as f:
        for line in f:
            tmp = json.loads(line)
            ti = TrainingInstance.from_dict(tmp)
            print 'ok'
