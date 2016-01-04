__author__ = 'arenduchintala'
import codecs
import _mysql
import pdb

import sys

'''
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'
'''


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


if __name__ == '__main__':
    db = _mysql.connect(host="localhost", user="root",
                        passwd="", db="macaronicdb")
    fields, rows = get_results(db, "select * from mturkUserCompletedSentences;")

    for row in rows:
        u = row[fields.index('username')]
        sent_id = row[fields.index('sentence_id')]
        print 'records for', u, sent_id
        ft, rt = get_results(db,
                             "select sentence_id, rule, rule_type, username, visible_before, visible_after from mturkRecords where visible_before <> visible_after and username='" + u + "' and sentence_id='" + sent_id + "'")
        print ft
        pdb.set_trace()





