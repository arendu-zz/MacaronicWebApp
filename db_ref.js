var Bookshelf = require('bookshelf');

var config = { host: '', user: '', password: '', database: ''};

var DB = Bookshelf.initialize({
   client: 'mysql', 
   connection: config
});

module.exports.DB = DB;
