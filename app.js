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
app.set('views', __dirname + '/htmlviews');
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public/'));

// GET
app.get('/', route.index);

app.use(route.notFound404);

var http = require('http').Server(app);
var io = require('socket.io')(http);
var JsonSentences = require('./stories/jsonsentences')

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

	socket.on('userProgress', function (msg) {
		console.log('request for user info')
		_.each(msg, function (v, k) {
			console.log(k, v)
		})
	})
});

var server = http.listen(app.get('port'), function (err) {
	if (err) throw err;
	var message = 'Server is running @ http://localhost:' + server.address().port;
	console.log(message);
});


