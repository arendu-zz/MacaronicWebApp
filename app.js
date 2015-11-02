// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var _ = require('underscore');

// custom libraries
var route = require('./route')
var Model = require('./model');

// setup app
var app = express();
app.set('port', process.env.PORT || 3030);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public/'));

// GET
app.get('/', route.index);

app.use(route.notFound404);

var http = require('http').Server(app);
var io = require('socket.io')(http);
var JsonSentences = require('./stories/jsonsentences')
var sentences_per_page = 2

io.on('connection', function (socket) {

	var clientId = socket.id
	console.log("made socket connection to client..." + clientId)
	socket.on('logEvent', function (msg) {
		new Model.Records(msg).save().then(function (data) {
			console.log("new record added:" + data.attributes.id)
		});
	});

	/*socket.on('requestJsonSentences', function (msg) {
		console.log('sending data to client...')
		io.emit('JsonSentences', JsonSentences.Story1)
	})*/

	socket.on('completedTask', function (msg) {
		console.log('got completion from user!')
		var listTLM = msg.hitlog
		_.each(listTLM, function (tlm) {

			new Model.Translations({workerId: tlm.workerId, state: "blank", input: tlm.input, translation: unescapeHTML(tlm.translation)}).save().then(function (data) {
				console.log("new translation added:" + data.attributes.id)
			})
		})
		new Model.User().where({workerId: msg.workerId}).save({displayname: msg.workerId, points_earned: msg.points_earned, progress: msg.progress}, {method: 'update'}).then(function (data) {
			console.log('sending new content...')
			var content = sliceContent(JsonSentences.Story1, parseInt(data.attributes.progress), sentences_per_page)
			io.to(clientId).emit('userProgress', {data: content, progress: data.attributes.progress, points_earned: data.attributes.points_earned})
		})
	})

	socket.on('requestUserProgress', function (msg) {
		console.log('received user progress request...')
		if (msg.workerId == '0') {
			// a visitor or a mturk previewer
			console.log("visitor or previewer")
			var content = sliceContent(JsonSentences.Story1, 0, sentences_per_page)
			io.to(clientId).emit('userProgress', { data: content, progress: 0, points_earned: 0})
		} else {
			console.log("mturk user.." + msg.workerId)
			//a real mturk user
			Model.User.where('workerId', msg.workerId).fetch().then(function (resData) {
				if (resData != null) {
					console.log("found workerId, returning user progress")
					_.each(resData, function (v, k) {
						console.log(k, v)
					})
					var content = sliceContent(JsonSentences.Story1, parseInt(resData.attributes.progress), sentences_per_page)
					io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
				} else {
					//insert new user in database
					new Model.User({workerId: msg.workerId, displayname: msg.workerId, progress: 0, points_earned: 0}).save().then(function (data) {
						console.log("created new mturk user..." + data.attributes.id)
						var content = sliceContent(JsonSentences.Story1, 0, sentences_per_page)
						io.to(clientId).emit('userProgress', {data: content, progress: data.attributes.progress, points_earned: data.attributes.points_earned})

					})
				}
			})
		}

	})
});

var server = http.listen(app.get('port'), function (err) {
	if (err) throw err;
	var message = 'Server is running @ http://localhost:' + server.address().port;
	console.log(message);
});

function unescapeHTML(safe_str) {
	return decodeURI(safe_str).replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function escapeHTML(unsafe_str) {
	return encodeURI(unsafe_str).replace(/\"/g, '\"').replace(/\'/g, '\'');
}

function sliceContent(fullcontent, progress, sentences_per_page) {
	var st = progress * sentences_per_page
	var end = st + sentences_per_page
	var content = fullcontent.slice(st, end)
	return content
}