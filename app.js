//experiment vars
var sentences_per_page = 5
var max_hits = 3
// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var _ = require('underscore');
var LocalStrategy = require('passport-local').Strategy;

// routes
var route = require('./route');
// model
var Model = require('./model');

var app = express();

passport.use(new LocalStrategy(function (username, password, done) {
	console.log(username + ' un escaped')
	username = escapeHTML(username)
	password = escapeHTML(password)
	console.log(username + ' escaped')
	var username_unescaped = unescapeHTML(username)
	console.log(username_unescaped + ' unescaped again')
	new Model.User({username: username}).fetch().then(function (data) {
		var user = data;
		if (user === null) {
			console.log('tried to get username' + username + ' but no result found')
			return done(null, false, {message: 'Invalid username or password'});
		} else {
			user = data.toJSON();
			//if (!bcrypt.compareSync(password, user.password)) {
			if (password.localeCompare(user.password) != 0) {
				console.log('tried to get match' + password + ' with ' + user.password)
				return done(null, false, {message: 'Invalid username or password'});
			} else {
				return done(null, user);
			}
		}
	});
}));

passport.serializeUser(function (user, done) {
	console.log('serializeUser', user.username)
	done(null, user.username);
});

passport.deserializeUser(function (username, done) {
	console.log('deserializeUser', username)
	new Model.User({username: username}).fetch().then(function (user) {
		done(null, user);
	});
});

app.set('port', process.env.PORT || 3030);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public/'));
app.use(cookieParser());
app.use(bodyParser());
app.use(session({secret: 'secret strategic xxzzz code'}));
app.use(passport.initialize());
app.use(passport.session());

// GET
app.get('/', route.index);

// signin
// GET
app.get('/signin', route.signIn);
// POST
app.post('/signin', route.signInPost);

// signup
// GET
app.get('/signup', route.signUp);
// POST
app.post('/signup', route.signUpPost);

// logout
// GET
app.get('/signout', route.signOut);

/********************************/
// 404 not found
app.use(route.notFound404);

var http = require('http').Server(app);
var io = require('socket.io')(http);
var JsonSentences = require('./stories/jsonsentences')

io.on('connection', function (socket) {
	var clientId = socket.id
	console.log("connected to client..." + clientId)
	socket.on('logEvent', function (msg) {
		new Model.Records(msg).save().then(function (data) {
			console.log("record status:" + data.attributes.id)
		});
		//io.to(clientId).emit('chat message', msg);
	});

	socket.on('completedTask', function (msg) {
		console.log('got completion from user!')
		var listTLM = msg.hitlog
		_.each(listTLM, function (tlm) {
			new Model.Translations({username: tlm.workerId, state: "blank", input: tlm.input, translation: unescapeHTML(tlm.translation)}).save().then(function (data) {
				console.log("new translation added:" + data.attributes.id)
			})
		})
		new Model.User().where({username: msg.workerId}).save({ points_earned: msg.points_earned, progress: msg.progress}, {method: 'update'}).then(function (data) {
			Model.User.where('username', msg.workerId).fetch().then(function (resData) {
				console.log('sending new content...')
				var content = sliceContent(JsonSentences.Story1, parseInt(resData.attributes.progress), sentences_per_page)
				nextHit(resData, content, clientId, io)
			})
		})
	})

	socket.on('requestUserProgress', function (msg) {
		console.log("mturk user with workerId .." + msg.workerId)
		Model.User.where('username', msg.workerId).fetch().then(function (resData) {
			if (resData != null) {
				console.log("found workerId:" + msg.workerId + " returning user progress" + resData.attributes.progress)
				var content = sliceContent(JsonSentences.Story1, parseInt(resData.attributes.progress), sentences_per_page)
				nextHit(resData, content, clientId, io)

			} else {
				//insert new user in database
				new Model.User({username: msg.workerId, displayname: msg.workerId, progress: 0, points_earned: 0}).save().then(function (data) {
					console.log("created new mturk user..." + data.attributes.id)
					var content = sliceContent(JsonSentences.Story1, 0, sentences_per_page)
					io.to(clientId).emit('userProgress', {data: content, progress: data.attributes.progress, points_earned: data.attributes.points_earned})

				})
			}
		})
	});

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

function nextHit(resData, content, clientId, io) {
	if (parseInt(resData.attributes.progress) > max_hits) {
		console.log("show thank you page...")
		io.to(clientId).emit('thankyou', {points_earned: resData.attributes.points_earned, confirmation: resData.attributes.confirmation_string})
	} else {
		console.log("show next set of hit questions, ", max_hits, resData.attributes.progress)
		io.to(clientId).emit('userProgress', {data: content, progress: resData.attributes.progress, points_earned: resData.attributes.points_earned})
	}

}
function sliceContent(fullcontent, progress, sentences_per_page) {
	var st = progress * sentences_per_page
	var end = st + sentences_per_page
	var content = fullcontent.slice(st, end)
	return content
}

