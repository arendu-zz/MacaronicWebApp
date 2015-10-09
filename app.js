// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var _ = require('underscore');
var LocalStrategy = require('passport-local').Strategy;

// custom libraries
// routes
var route = require('./route');
// model
var Model = require('./model');

var app = express();

passport.use(new LocalStrategy(function (username, password, done) {
	new Model.User({username: username}).fetch().then(function (data) {
		var user = data;
		if (user === null) {
			return done(null, false, {message: 'Invalid username or password'});
		} else {
			user = data.toJSON();
			if (!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {message: 'Invalid username or password'});
			} else {
				return done(null, user);
			}
		}
	});
}));

passport.serializeUser(function (user, done) {
	done(null, user.username);
});

passport.deserializeUser(function (username, done) {
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

/********************************/
// 404 not found
app.use(route.notFound404);

var http = require('http').Server(app);
var io = require('socket.io')(http);
var JsonSentences = require('./jsonsentences')

io.on('connection', function (socket) {
	console.log("in connection...")
	socket.on('logEvent', function (msg) {
		//_.each(msg, function (value, key) {
		//		console.log('\t', key, value)
		//})
		new Model.Records(msg).save().then(function (data) {
			console.log("record status:" + data.attributes.id)
			//_.each(data, function (v, k) {
			//	console.log(k, v)
			//})
		});
		//io.emit('chat message', msg);
	});

	socket.on('requestJsonSentences', function (msg) {
		console.log('sending data to client...')
		io.emit('JsonSentences', JsonSentences.Story1)
	})
});

/*var server = app.listen(app.get('port'), function (err) {
	if (err) throw err;

	var message = 'Server is running @ http://localhost:' + server.address().port;
	console.log(message);
});*/

var server = http.listen(app.get('port'), function (err) {
	if (err) throw err;
	var message = 'Server is running @ http://localhost:' + server.address().port;
	console.log(message);
});


