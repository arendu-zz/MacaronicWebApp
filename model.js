var DB = require('./db').DB;

var User = DB.Model.extend({
   tableName: 'mturkUsersAltInd',
   idAttribute: 'id',
});

var Records= DB.Model.extend({
	tableName: 'mturkRecordsAltInd',
	idAttribute: 'id',
});

var Translations = DB.Model.extend({
	tableName: 'mturkTranslationsAltInd',
	idAttribute: 'id',
})

module.exports = {
   User: User,
   Records: Records,
   Translations: Translations
};