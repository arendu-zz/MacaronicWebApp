var Bookshelf = require('bookshelf');

var config = {
   host: '',  // your host
   user: '', // your database user
   password: '', // your database password
   database: ''
};

var DB = Bookshelf.initialize({
   client: 'mysql', 
   connection: config
});

module.exports.DB = DB;
