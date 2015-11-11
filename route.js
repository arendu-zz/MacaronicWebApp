// vendor library
var bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');
// custom library
// model
var Model = require('./model');
// index
var index = function (req, res, next) {
	_.each(Object.keys(req.query), function (k) {
		console.log(k + ' ' + req.query[k])
	})
	if (req.query.hasOwnProperty('assignmentId')) {
		if (req.query.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
			res.render('index', {title: "mturk page", user: { assignmentId: req.query.assignmentId, learnerType: 'previewer', workerId: req.query.workerId}})
		} else {
			res.render('index', {title: "mturk page", user: {  assignmentId: req.query.assignmentId, learnerType: 'learner', workerId: req.query.workerId}})
		}
	} else {
		res.render('index', {title: "mturk page", user: { assignmentId: null, learnerType: 'visitor', workerId: '0'}})
	}

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