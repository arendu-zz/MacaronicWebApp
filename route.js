// vendor library
var bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');
// custom library
// model
var Model = require('./model');
var App = require('./app')

// index
var index = function (req, res, next) {
	if (req.query.hasOwnProperty('assignmentId')) {
		if (req.query.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
			res.render('preview', {title: "mturk page", ui_version: App.ui_version, user: { assignmentId: req.query.assignmentId, learnerType: 'previewer', username: req.query.workerId}})
		} else {
			console.log('uiver:' + App.ui_version)
			res.render('index', {title: "mturk page", ui_version: App.ui_version, user: {  assignmentId: req.query.assignmentId, learnerType: 'learner', username: req.query.workerId}})
		}
	} else {
		res.render('index', {title: "mturk page", ui_version: App.ui_version, user: { assignmentId: null, learnerType: 'visitor', workerId: '0'}})
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
