//experiment vars
exports.ui_version = 0
exports.external_submit_url = "https://workersandbox.mturk.com/mturk/externalSubmit"
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
var yargs = require('yargs').usage('Usage: $0 --uiver [0,1] --host [ec2, ec2sandbox,localhost] --story [0...4] --hitlimit [INT]').demand(['uiver', 'host', 'story', 'hitlimit']).argv;
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

if (yargs.host == 'ec2sandbox') {
	exports.external_submit_url = "https://workersandbox.mturk.com/mturk/externalSubmit"
} else if (yargs.host == 'ec2') {
	exports.external_submit_url = "https://www.mturk.com/mturk/externalSubmit"
} else {
	exports.external_submit_url = ""
}

var io = require('socket.io')(https);
var story_num = parseInt(yargs.story)
var hitlimit = parseInt(yargs.hitlimit)
var JsonSentences = null
var FullParsedSentences = null
var PreviewParsedSentence = null

var JsonSentencesPreview = null
if (story_num == 0) {
	JsonSentences = require('./stories/newstest2013.fr.js')
	JsonSentencesPreview = require('./stories/newstest2013.fr.preview.js')

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
	JsonSentences = require('./stories/newstest2013.fr.js')
	JsonSentencesPreview = require('./stories/newstest2013.fr.preview.js')
}

FullParsedSentences = parseAllContent(JsonSentences.Story1)
PreviewParsedSentence = parseAllContent(JsonSentencesPreview.Story1)

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
	socket.on('logGuesses', function (msg) {
		new Model.Guesses({username: msg.username, ui_version: parseInt(msg.ui_version), sentence_id: parseInt(msg.sentence_id), show_reordering: msg.show_reordering, reveal_instantly: msg.reveal_instantly, sentence_state: msg.sentence_state, guesses_state: msg.guesses_state, sentence_visible: msg.sentence_visible, guesses_visible: msg.guesses_visible}).save().then(function (data) {
			console.log("new guesses added:" + data.attributes.id)
		})
	})
	socket.on('completedTask', function (msg) {
		console.log('got completion from user!')
		var sentences_completed = msg.sentences_completed
		_.each(sentences_completed, function (s) {
			console.log("--->>", s.id, s.points_earned, s.points_bonus, msg.hitId)
			new Model.UserCompletedSentences({'username': msg.username, 'assignment_id': msg.assignment_id, 'hit_id': msg.hitId, 'sentence_id': s.id, 'points_earned': parseInt(s.points_earned), 'points_bonus': parseInt(parseFloat(s.points_bonus))}).save().then(function (done) {
				console.log('saved user completed sentence.')
			});

			Model.CompletedSentences.where('sentence_id', s.id).fetch().then(function (sentenceFetch) {
				console.log("updating number of times" + s.id + " has been completed...")
				console.log("fetched:" + sentenceFetch)
				if (sentenceFetch == null) {
					new Model.CompletedSentences({'sentence_id': s.id, 'times_completed': 1}).save().then(function (done) {
						console.log('inserted new sentence completion record.')
					})
				} else {
					console.log("here....")
					new Model.CompletedSentences().where('sentence_id', s.id).save({'times_completed': parseInt(sentenceFetch.attributes.times_completed) + 1}, {method: 'update'}).then(function (done) {
						console.log('updated sentence_id', done.times_completed)
					})
				}
			})
		})
		new Model.User().where({username: msg.username}).save({ points_earned: msg.points_earned, progress: msg.progress, low_scores: msg.low_scores}, {method: 'update'}).then(function (data) {
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

	socket.on('userTabbed', function (msg) {
		new Model.Guesses({username: msg.username, ui_version: parseInt(-1), sentence_id: parseInt(msg.sentence_id), show_reordering: false, reveal_instantly: false, sentence_state: "tabbed out", guesses_state: "tabbed out", sentence_visible: "tabbed out", guesses_visible: "tabbed out"}).save().then(function (data) {
			console.log("new tabbed added:" + data.attributes.id)
		})
	})

	socket.on('requestSentence', function (msg) {
		console.log('received user progress request...')
		if (msg.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
			Model.User.where('username', msg.username).fetch().then(function (resData) {
				if (resData != null) {
					console.log("no assignment but found user, with progress ", resData.attributes.progress);
					console.log(JsonSentences.Story1.length)
					//sliceContent(JsonSentences.Story1, resData, clientId, io)
					specificContent(JsonSentences.Story1, resData, msg.sentence_prefered, clientId, io)
					//io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
				} else {
					console.log("no assignment no user")
					//sliceContent(JsonSentences.Story1, resData, clientId, io)
					specificContent(JsonSentences.Story1, resData, msg.sentence_prefered, clientId, io)
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
					//sliceContent(JsonSentences.Story1, resData, clientId, io)
					specificContent(JsonSentences.Story1, resData, msg.sentence_prefered, clientId, io)

				} else {
					//insert new user in database
					new Model.User({username: msg.username, progress: 0, points_earned: 0}).save().then(function (data) {
						console.log("created new mturk user..." + data.attributes.id)
						//sliceContent(JsonSentences.Story1, data, clientId, io)
						specificContent(JsonSentences.Story1, data, msg.sentence_prefered, clientId, io)
						//io.to(clientId).emit('userProgress', {data: content, progress: data.attributes.progress, points_earned: data.attributes.points_earned})

					})
				}
			})
		}

	})

	socket.on('requestUserProgress', function (msg) {
		console.log('received user progress request...')
		if (msg.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
			Model.User.where('username', msg.username).fetch().then(function (resData) {
				if (resData != null) {
					console.log("no assignment but found user, with progress ", resData.attributes.progress);
					console.log(JsonSentences.Story1.length)
					getLeastViewedContentForUser(resData, clientId, io)
					//io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
				} else {
					console.log("no assignment no user")
					getLeastViewedContentForUser(resData, clientId, io)
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
					getLeastViewedContentForUser(resData, clientId, io)

				} else {
					//insert new user in database
					new Model.User({username: msg.username, progress: 0, points_earned: 0}).save().then(function (data) {
						console.log("created new mturk user..." + data.attributes.id)
						getLeastViewedContentForUser(data, clientId, io)
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
	if (resData.attributes.low_scores) {

	} else {
		resData.attributes.low_scores = 0
	}
	console.log("show next set of hit questions, ", max_hits, resData.attributes.progress, resData.attributes.username, resData.attributes.low_scores)
	io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned, low_scores: resData.attributes.low_scores})

}

function noMoreHits(resData, clientId, io) {
	io.to(clientId).emit('noMoreHitsForUser', {progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
}

function specificContent(fullcontent, userData, sentence_id, clientId, io) {
	var content_objs = {}
	_.each(fullcontent, function (s) {
		var s_obj = JSON.parse(s);
		content_objs[s_obj.id] = s
		console.log(sentence_id, s_obj.id)
	})
	nextHit(userData, [content_objs[sentence_id]], clientId, io)
}

function parseAllContent(fullcontent) {
	var content_objs = {}

	_.each(fullcontent, function (s) {
		var s_obj = JSON.parse(s);
		content_objs[s_obj.id] = s
	})
	return content_objs
}

function getLeastViewedContentForUser(userData, clientId, io) {
	var username = userData.attributes.username
	var sentences_completed = {}
	var user_completed = []
	var user_not_completed = []

	_.each(FullParsedSentences, function (s, s_id) {
		sentences_completed[s_id] = {sentence_id: s_id, times_completed: 0}
	})
	//console.log("full list of sentences")
	//console.log(sentences_completed)

	Model.UserCompletedSentences.where('username', username).fetchAll().then(function (rd) {
		if (rd != null) {
			_.each(rd.models, function (model) {
				user_completed.push(parseInt(model.attributes.sentence_id))
			})
		} else {
			console.log("no result found for user", username)
		}

		//console.log("user completed sentences")
		//console.log(user_completed)

		if (user_completed.length >= hitlimit) {
			console.log("reached hit limit user:", username)
			noMoreHits(userData, clientId, io)
		} else {
			new Model.CompletedSentences().fetchAll().then(function (rd) {
				if (rd != null) {
					_.each(rd.models, function (model) {
						sentences_completed[parseInt(model.attributes.sentence_id)] = {sentence_id: parseInt(model.attributes.sentence_id), times_completed: parseInt(model.attributes.times_completed)}
					})
				} else {
					console.log("no sentences completed by anyone...")
				}
				//console.log("full list of sentences times completed")
				//console.log(sentences_completed)

				_.each(sentences_completed, function (obj, s_id) {
					if (user_completed.indexOf(parseInt(s_id)) >= 0) {
						//user has already completed this sentence
					} else {
						user_not_completed.push(obj)
					}

				})

				//console.log("remaining sentences for user")
				//console.log(user_not_completed)
				var sorted_user_not_completed = _.sortBy(user_not_completed, function (o) {
					return o.times_completed
				})
				var least_user_not_completed = _.filter(sorted_user_not_completed, function (o) {
					return o.times_completed == sorted_user_not_completed[0].times_completed
				})
				if (least_user_not_completed.length > 0) {
					var return_id = least_user_not_completed[Math.floor(Math.random() * least_user_not_completed.length)].sentence_id;
					console.log("sentence:", return_id, " is being sent for user:", username)
					nextHit(userData, [FullParsedSentences[return_id]], clientId, io)
				} else {
					console.log("no data left for user:", username)
					noMoreHits(userData, clientId, io)
				}

			})
		}

	})

}

