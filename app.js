// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var _ = require('underscore');

// custom libraries
var route = require('./route')
var Model = require('./model');

var app = express();
function unescapeHTML(safe_str) {
	return decodeURI(safe_str).replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function escapeHTML(unsafe_str) {
	return encodeURI(unsafe_str).replace(/\"/g, '\"').replace(/\'/g, '\'');
}

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

io.on('connection', function (socket) {
	console.log("made socket connection to client...")
	socket.on('logEvent', function (msg) {
		new Model.Records(msg).save().then(function (data) {
			console.log("record status:" + data.attributes.id)
		});
	});

	/*socket.on('requestJsonSentences', function (msg) {
		console.log('sending data to client...')
		io.emit('JsonSentences', JsonSentences.Story1)
	})*/

	socket.on('updatePointsEarned', function (msg) {
		console.log('got completion from user!')

		new Model.User({workerId: msg.workerId}).save({displayname: msg.workerId, points_earned: msg.points_earned, progress: msg.progress}).then(function (data) {
			_.each(data, function (v, k) {
				console.log(k, v)
			})
		})
	})

	socket.on('requestUserProgress', function (msg) {
		console.log('received user progress request...')
		if (msg.workerId == '0') {
			// a visitor or a mturk previewer
			console.log("visitor or previewer")
			var content = JsonSentences.Story1[0]
			io.emit('userProgress', { data: [content], progress: 0, points_earned: 0})
		} else {
			console.log("mturk user.." + msg.workerId)
			//a real mturk user
			Model.User.where('workerId', msg.workerId).fetch().then(function (resData) {
				if (resData != null) {
					console.log("found workerId, returning user progress")
					_.each(resData, function (v, k) {
						console.log(k, v)
					})
					var content = JsonSentences.Story1[resData.attributes.progress]
					io.emit('userProgress', {data: [content], progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
				} else {
					//insert new user in database
					new Model.User({workerId: msg.workerId, displayname: msg.workerId, progress: 0, points_earned: 0}).save().then(function (data) {
						console.log("created new mturk user..." + data.attributes.id)
						var content = JsonSentences.Story1[0]
						io.emit('userProgress', {data: [content], progress: data.attributes.progress, points_earned: data.attributes.points_earned})

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


