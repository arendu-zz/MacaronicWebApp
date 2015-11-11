// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var _ = require('underscore');

// custom libraries
var route = require('./route')
var Model = require('./model');
var yargs = require('yargs').usage('Usage: $0 --host [ec2,localhost]').demand('host').argv;

// setup app
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public/'));

// GET
app.get('/', route.index);

app.use(route.notFound404);
var https = null
if (yargs.host == 'ec2') {
	app.set('port', process.env.PORT || 443);
	fs = require('fs')
	var sslOptions = {
		key: fs.readFileSync('./ssl/privatekey.key'),
		cert: fs.readFileSync('./ssl/macaroniclearning_com_ee.crt'),
	};
	https = require('https').createServer(sslOptions, app);
} else if (yargs.host == 'localhost') {
	app.set('port', process.env.PORT || 3030);
	https = require('http').createServer(app);
}
var io = require('socket.io')(https);
var JsonSentences = require('./stories/jsonsentences')
var sentences_per_page = 5

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
			// io.to(clientId).emit('userProgress', {data: content, progress: data.attributes.progress, points_earned: data.attributes.points_earned})
		})
	})

	socket.on('requestUserProgress', function (msg) {
		console.log('received user progress request...')
		_.each(msg, function (v, k) {
			console.log(k, v);
		});
		if (msg.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
			Model.User.where('workerId', msg.workerId).fetch().then(function (resData) {
				if (resData != null) {
					console.log("no assignment but found user, with progress ", resData.attributes.progress);
					console.log(JsonSentences.Story1.length)
					var content = sliceContent(JsonSentences.Story1, 9, sentences_per_page)
					io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
				} else {
					console.log("no assignment no user")
					var content = sliceContent(JsonSentences.Story1, 9,  sentences_per_page)
					io.to(clientId).emit('userProgress', { data: content, progress: 0, points_earned: 0})
				}
			})
			// a visitor or a mturk previewer

		} else {
			console.log("mturk user with assignment .." + msg.workerId)
			//a real mturk user
			Model.User.where('workerId', msg.workerId).fetch().then(function (resData) {
				if (resData != null) {
					console.log("found workerId:" + msg.wordkerId + "returning user progress" + resData.attributes.progress)
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

var server = https.listen(app.get('port'), function (err) {
	//if (err) throw err;
	if (yargs.host == 'ec2') {
		try {
			console.log('Old user id' + process.getuid() + ', Old group id' + process.getgid())
			process.setgid('wheel')
			process.setuid('ec2-user')
			console.log('New user id' + process.getuid() + ' New group id' + process.getgid())
		} catch (err) {
			throw err
		}
		var message = 'Server is running @ https://macaroniclearning.com:' + server.address().port;
	} else {
		var message = 'Server is running @ https://localhost:' + server.address().port;
	}

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
