var config = {host: 'localhost', user: 'macaronic_admin', password: 'mturk_password', database: 'macaronicdb', charset: 'utf8'};
var knex = require('knex')({
							   client: 'mysql',
							   connection: config
						   });
var DB = require('bookshelf')(knex);

module.exports.DB = DB;
