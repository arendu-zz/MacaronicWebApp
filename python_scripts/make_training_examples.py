__author__ = 'arenduchintala'
import _mysql
import json
import sys
import codecs

reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

from collection_of_edits import Sentence, Node, Graph, Edge, Swap


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


class TrainingInstance(dict):
    def __init__(self,
                 user_id,
                 past_correct_guesses,
                 past_sentences_seen,
                 past_guesses_for_current_sent,
                 current_sent,
                 current_revealed_guesses,
                 current_guesses):
        dict.__init__(self)
        self.__dict__ = self
        # these are the inputs
        self.user_id = user_id
        self.past_correct_guesses = past_correct_guesses
        self.past_sentences_seen = past_sentences_seen
        self.past_guesses_for_current_sent = past_guesses_for_current_sent
        self.current_sent = current_sent
        self.current_revealed_guesses = current_revealed_guesses
        # this is the output
        self.current_guesses = current_guesses

    @staticmethod
    def from_dict(_dict):
        ti = TrainingInstance(user_id=_dict['user_id'],
                              past_correct_guesses=list(map(Guess.from_dict, _dict['past_correct_guesses'])),
                              past_sentences_seen=_dict['past_sentences_seen'],
                              past_guesses_for_current_sent=list(
                                  map(Guess.from_dict, _dict['past_guesses_for_current_sent'])),
                              current_sent=list(map(SimpleNode.from_dict, _dict['current_sent'])),
                              current_revealed_guesses=list(map(Guess.from_dict, _dict['current_revealed_guesses'])),
                              current_guesses=list(map(Guess.from_dict, _dict['current_guesses'])))
        return ti


class Guess(dict):
    def __init__(self, id, guess, revealed, l2_word):
        dict.__init__(self)
        self.__dict__ = self
        self.guess = guess
        self.l2_word = l2_word
        self.id = id
        self.revealed = revealed

    def copy(self, new_id=None):
        if new_id:
            g = Guess(id=new_id, guess=self.guess, revealed=self.revealed, l2_word=self.l2_word)
        else:
            g = Guess(id=self.id, guess=self.guess, revealed=self.revealed, l2_word=self.l2_word)
        return g

    def __str__(self):
        return ','.join([str(self.id), str(self.guess), str(self.revealed)])

    def __hash__(self):
        return hash(str(self))

    def __eq__(self, other):
        return str(self) == str(other)

    def __cmp__(self, other):
        if str(self) == str(other):
            return 0
        elif str(self) > str(other):
            return 1
        else:
            return -1

    @staticmethod
    def from_dict(_dict):
        g = Guess(id=_dict['id'], guess=_dict['guess'], revealed=_dict['revealed'], l2_word=_dict['l2_word'])
        return g


class SimpleNode(dict):
    def __init__(self, sent_id, id, l2_word, position, lang):
        dict.__init__(self)
        self.__dict__ = self
        self.sent_id = sent_id
        self.id = id
        self.l2_word = l2_word
        self.position = int(position)
        self.lang = lang

    def __cmp__(self, other):
        if self.position == other.position:
            return 0
        elif self.position > other.position:
            return 1
        else:
            return -1

    @staticmethod
    def from_dict(_dict):
        s = SimpleNode(sent_id=_dict['sent_id'], id=_dict['id'], l2_word=_dict['l2_word'], position=_dict['position'],
                       lang=_dict['lang'])
        return s


def get_visible_nodes(sent_state):
    simple_nodes = []
    for g in sent_state.graphs:
        for n in g.nodes:
            if n.visible:
                if n.s == '@-@':
                    n.s = '-'
                sn = SimpleNode(sent_id=sent_state.id, id=(n.id, g.id), l2_word=n.s, position=int(n.visible_order),
                                lang=n.lang)
                simple_nodes.append(sn)
    simple_nodes.sort()
    return simple_nodes


def get_results(db, q):
    db.query(q)
    res = db.use_result()
    fields = [i[0] for i in res.describe()]
    rows = []
    r = res.fetch_row()
    while r != ():
        rows.append(r[0])
        r = res.fetch_row()
    return fields, rows


def log(msg, priority=20):
    if priority > 10:
        sys.stderr.write(msg + "\n")


if __name__ == '__main__':
    training_instances = []
    db = _mysql.connect(host="localhost", user="root", passwd="", db="macaronicdb")
    f_ucs, r_ucs = get_results(db, "select distinct username from mturkGuesses;")
    for row_user in r_ucs:
        user_id = row_user[f_ucs.index('username')]
        past_sentences_seen = set([])
        past_correct_guesses = set([])
        f_user_sent, r_user_sent = get_results(db,
                                               "select distinct created_at,sentence_id from mturkGuesses where username='" + user_id + "';")
        r_user_sent.sort()
        r_user_sent = [s_id for cr, s_id in r_user_sent if s_id]
        r_user_sent[:] = unique(r_user_sent)
        for row_user_sent in r_user_sent:
            sent_id = row_user_sent
            query = "select * from mturkGuesses where username='" + user_id + "'  and sentence_id='" + sent_id + "' order by created_at;"
            f_guesses, r_guesses = get_results(db, query)
            # print len(r_guesses), 'guesses found for ', user_id, sent_id
            past_guesses_for_current_sent = set([])
            for guess in r_guesses:
                sent_visible = guess[f_guesses.index('sentence_visible')]
                if sent_visible.lower() != 'tabbed out':
                    guesses = json.loads(unicode(guess[f_guesses.index('guesses_state')], 'utf-8'))['sentenceGuess']
                    current_guesses = [Guess(id=(int(g['l2_node_id']), int(g['l2_node_graph_id'])),
                                             guess=g['guess'],
                                             revealed=g['revealed'],
                                             l2_word=g['l2_string'])
                                       for g in guesses]
                    current_revealed_guesses = [crg.copy() for crg in current_guesses if crg['revealed']]
                    current_unrevealed_guesses = [crg.copy() for crg in current_guesses if not crg['revealed']]
                    sent_dict = json.loads(unicode(guess[f_guesses.index('sentence_state')], 'utf-8'))
                    sent_obj = Sentence.from_dict(sent_dict)
                    current_sent_state = get_visible_nodes(sent_obj)
                    ti = TrainingInstance(user_id=user_id,
                                          current_revealed_guesses=[crg for crg in current_revealed_guesses],
                                          past_correct_guesses=[pcg for pcg in past_correct_guesses],
                                          past_sentences_seen=[s for s in past_sentences_seen],
                                          past_guesses_for_current_sent=[g for g in past_guesses_for_current_sent],
                                          current_sent=[s for s in current_sent_state],
                                          current_guesses=[g for g in current_unrevealed_guesses])
                    training_instances.append(ti)
                    past_guesses_for_current_sent.update(current_guesses)
                    revealed_guesses = [rg.copy((None, None)) for rg in current_guesses if
                                        rg['revealed'] and rg['guess'].strip() != '']
                    past_correct_guesses.update(revealed_guesses)
                    print json.dumps(ti)
                    x_ti = json.dumps(ti)
                    new_ti = TrainingInstance.from_dict(json.loads(x_ti))
                else:
                    log('skipping guess, tabbed out...')

            past_sentences_seen.add(sent_id)
    log('done')




