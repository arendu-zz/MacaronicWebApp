var DB = require('./db').DB;

var User = DB.Model.extend({
   tableName: 'mturkUsers',
   idAttribute: 'id',
});

var Records= DB.Model.extend({
	tableName: 'mturkRecords',
	idAttribute: 'id',
});

module.exports = {
   User: User,
   Records: Records
};