// vendor library
var bcrypt = require('bcrypt-nodejs');

// custom library
// model
var Model = require('./model');
// index
var index = function (req, res, next) {
	res.render('index', {title: "mturk page", user: {username: "mturk user", displayname: "mturk user"}})
};

// 404 not found
var notFound404 = function (req, res, next) {
	res.status(404);
	res.render('missing', {title: '404 Not Found'});

};
// index
module.exports.index = index;

// 404 not found
module.exports.notFound404 = notFound404;