//experiment vars
exports.ui_version = 0
var max_hits = 9999999999

// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var _ = require('underscore');

// custom libraries
var route = require('./route')
var Model = require('./model');
var yargs = require('yargs').usage('Usage: $0 --uiver [0,1] --host [ec2,localhost] --story [0...4]').demand(['uiver', 'host', 'story']).argv;
exports.ui_version = parseInt(yargs.uiver)
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
var story_num = parseInt(yargs.story)
var JsonSentences = null
var JsonSentencesPreview = null
if (story_num == 0) {
	JsonSentences = require('./stories/jsonsentences')
	JsonSentencesPreview = require('./stories/jsonsentences-preview.js')
} else if (story_num == 1) {
	JsonSentences = require('./stories/le_petit_prince.fr')
	JsonSentencesPreview = require('./stories/le_petit_prince.fr.preview')
} else if (story_num == 2) {
	JsonSentences = require('./stories/jde.fr')
	JsonSentencesPreview = require('./stories/jde.fr.preview')
} else if (story_num == 3) {
	JsonSentences = require('./stories/nachrichtenleicht.de')
	JsonSentencesPreview = require('./stories/nachrichtenleicht.de.preview')
} else {
	JsonSentences = require('./stories/jsonsentences')
	JsonSentencesPreview = require('./stories/jsonsentences-preview.js')
}

var sentences_per_page = 5

io.on('connection', function (socket) {
	var clientId = socket.id
	console.log("made socket connection to client..." + clientId)
	socket.on('logEvent', function (msg) {
		new Model.Records(msg).save().then(function (data) {
			console.log("new record added:" + data.attributes.id)
		});
	});
	socket.on('logTranslation', function (msg) {
		msg.translation = unescapeHTML(msg.translation)
		new Model.Translations({username: msg.username, ui_version: parseInt(msg.ui_version), sentence_id: parseInt(msg.sentence_id), state: msg.state, input: msg.input, translation: unescapeHTML(msg.translation)}).save().then(function (data) {
			console.log("new translation added:" + data.attributes.id)
		})
	})
	socket.on('completedTask', function (msg) {
		console.log('got completion from user!')
		var sentences_completed = msg.sentences_completed
		_.each(sentences_completed, function (s) {
			new Model.UserCompletedSentences({'username': msg.username, 'hit_id': msg.hitId, 'sentence_id': s}).save().then(function (done) {
				console.log('saved user completed sentence.')
			});

			Model.CompletedSentences.where('sentence_id', s).fetch().then(function (sentenceFetch) {
				console.log("updating number of times" + s + " has been completed...")
				console.log("fetched:" + sentenceFetch)
				if (sentenceFetch == null) {
					new Model.CompletedSentences({'sentence_id': s, 'times_completed': 1}).save().then(function (done) {
						console.log('inserted new sentence completion record.')
					})
				} else {
					console.log("here....")
					new Model.CompletedSentences().where('sentence_id', s).save({'times_completed': parseInt(sentenceFetch.attributes.times_completed) + 1}, {method: 'update'}).then(function (done) {
						console.log('updated sentence_id', done.times_completed)
					})
				}
			})
		})
		new Model.User().where({username: msg.username}).save({ points_earned: msg.points_earned, progress: msg.progress}, {method: 'update'}).then(function (data) {
			Model.User.where('username', msg.username).fetch().then(function (resData) {
				//console.log('sending new content...')
				//sliceContent(JsonSentences.Story1, resData, clientId, io)
				//nextHit(resData, content, clientId, io)
			})
		})

	});

	socket.on('requestPreview', function (msg) {
		var content = JsonSentencesPreview.Preview
		io.to(clientId).emit('previewContent', {data: content});
	});

	socket.on('requestUserProgress', function (msg) {
		console.log('received user progress request...')
		if (msg.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
			Model.User.where('username', msg.username).fetch().then(function (resData) {
				if (resData != null) {
					console.log("no assignment but found user, with progress ", resData.attributes.progress);
					console.log(JsonSentences.Story1.length)
					sliceContent(JsonSentences.Story1, resData, clientId, io)
					//io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
				} else {
					console.log("no assignment no user")
					sliceContent(JsonSentences.Story1, resData, clientId, io)
					//io.to(clientId).emit('userProgress', { data: content, progress: 0, points_earned: 0})
				}
			})
			// a visitor or a mturk previewer

		} else {
			console.log("mturk user with assignment .." + msg.username)
			//a real mturk user
			Model.User.where('username', msg.username).fetch().then(function (resData) {
				if (resData != null) {
					console.log("found username:" + msg.username + " returning user progress" + resData.attributes.progress)
					sliceContent(JsonSentences.Story1, resData, clientId, io)

				} else {
					//insert new user in database
					new Model.User({username: msg.username, progress: 0, points_earned: 0}).save().then(function (data) {
						console.log("created new mturk user..." + data.attributes.id)
						sliceContent(JsonSentences.Story1, data, clientId, io)
						//io.to(clientId).emit('userProgress', {data: content, progress: data.attributes.progress, points_earned: data.attributes.points_earned})

					})
				}
			})
		}

	})
});

var server = https.listen(app.get('port'), function (err) {
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

function nextHit(resData, content, clientId, io) {
	console.log("show next set of hit questions, ", max_hits, resData.attributes.progress, resData.attributes.username)
	io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})

}

function sliceContent(fullcontent, userData, clientId, io) {
	var username = userData.attributes.username
	var sentences_completed = {}
	var content_objs = {}

	var return_id = null

	new Model.CompletedSentences().fetchAll().then(function (rd) {
		if (rd != null) {
			var max_seen = 0
			_.each(rd.models, function (model) {
				if (model.attributes.times_completed > max_seen) {
					max_seen = model.attributes.times_completed
				}
			})

			_.each(fullcontent, function (s) {
				var s_obj = JSON.parse(s);
				sentences_completed[s_obj.id] = max_seen + 1
				content_objs[s_obj.id] = s
			})

			_.each(rd.models, function (model) {
				sentences_completed[model.attributes.sentence_id] = 1 + (max_seen - model.attributes.times_completed)

			})
		}
		Model.UserCompletedSentences.where('username', username).fetchAll().then(function (rd) {
			if (rd != null) {

				_.each(rd.models, function (model) {
					delete sentences_completed[model.attributes.sentence_id]
				})
			}
			var cumilative_completed = {}
			var sum = 0
			_.each(sentences_completed, function (v, k) {
				v = parseInt(v)
				//console.log('final', sentences_completed[k], k, v)
				cumilative_completed[k] = [parseInt(sum), parseInt(sum) + parseInt(v)]
				sum = parseInt(sum) + parseInt(v)
			})

			var r = Math.random() * sum

			_.each(cumilative_completed, function (v, k) {
				//console.log(v[0], v[1], r, k)
				if (v[0] < r && v[1] > r) {
					return_id = k
				}
			})
			console.log('returning...', return_id)
			nextHit(userData, [content_objs[return_id]], clientId, io)

		})

	})

}
