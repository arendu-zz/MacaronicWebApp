var DB = require('./db').DB;

var User = DB.Model.extend({
   tableName: 'macaronicUsers',
   idAttribute: 'id',
});

var Records= DB.Model.extend({
	tableName: 'macaronicRecords',
	idAttribute: 'id',
});

module.exports = {
   User: User,
   Records: Records
};