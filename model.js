var DB = require('./db').DB;

var User = DB.Model.extend({
   tableName: 'mturkUsersInd',
   idAttribute: 'id',
});

var Records= DB.Model.extend({
	tableName: 'mturkRecordsInd',
	idAttribute: 'id',
});

var Translations = DB.Model.extend({
	tableName: 'mturkTranslationsInd',
	idAttribute: 'id',
})

module.exports = {
   User: User,
   Records: Records,
   Translations: Translations
};
