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
function unescapeHTML(safe_str){
	return decodeURI(safe_str).replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function escapeHTML(unsafe_str) {
	//return unsafe_str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	//return unsafe_str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;'); // '&apos;' is not valid HTML 4
	return encodeURI(unsafe_str).replace(/\"/g, '\"').replace(/\'/g, '\'');
	//function mysql_real_escape_string (str) {
	/*if (typeof  unsafe_str != 'string') {
		return unsafe_str;
	}
	return unsafe_str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
		switch (char) {
			case "\0":
				return "\\0";
			case "\x08":
				return "\\b";
			case "\x09":
				return "\\t";
			case "\x1a":
				return "\\z";
			case "\n":
				return "\\n";
			case "\r":
				return "\\r";
			case "\"":
			case "'":
			case "\\":
			case "%":
				return "\\" + char; // prepends a backslash to backslash, percent,
			// and double/single quotes
		}
	});*/
}

/*function escapeHTML(unsafe_str) {
	return encodeURI(unsafe_str).replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');
}*/

passport.use(new LocalStrategy(function (username, password, done) {
	console.log(username + ' un escaped')
	username = escapeHTML(username)
	password = escapeHTML(password)
	console.log(username + ' escaped')
	username_unescaped = unescapeHTML(username)
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


