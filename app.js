// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var _ = require('underscore');
var fs = require('fs');

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

app.set('port', process.env.PORT || 8002);
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
//POST
app.post('/', route.indexPost);

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

// content
// GET
app.get('/content', route.content);
// POST
app.post('/content', route.contentPost);

// logout
// GET
app.get('/signout', route.signOut);

/********************************/
// 404 not found
app.use(route.notFound404);

var http = require('http').Server(app);
var io = require('socket.io')(http);
var JsonSentences = require('./stories/nachrichtenleicht.de.js')

var loadJsonContent = function (file_path, successCallback) {
	var jsonObj;
  console.log(file_path + ' is going to be read...');
	fs.readFile(file_path, 'utf8', function (err, data) {
		if (err) {
		console.log('loading content error');
		console.log(err);
		}else{
		jsonObj = JSON.parse(data);
		successCallback(jsonObj);
		}	
	});
};

io.on('connection', function (socket) {
	var clientId = socket.id
	console.log("connected to client..." + clientId)
	socket.on('logEvent', function (msg) {
		new Model.Records(msg).save().then(function (data) {
			console.log("record status:" + data.attributes.id);
		});
	});

	socket.on('requestJsonSentences', function (fileObj) {
		console.log('client requested data in file...' + fileObj.file_path)
		loadJsonContent(fileObj.file_path, function (jsonObj) {
			io.to(clientId).emit('JsonSentences', jsonObj)

		});
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
