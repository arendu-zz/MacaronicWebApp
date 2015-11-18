// vendor library
var passport = require('passport');
var _ = require('underscore')
var bcrypt = require('bcrypt-nodejs');

// custom library
// model
var Model = require('./model');

function alphanumeric_unique() {
	return Math.random().toString(36).split('').filter(function (value, index, self) {
		return self.indexOf(value) === index;
	}).join('').substr(2, 8);
}

// index
var index = function (req, res, next) {
	if (!req.isAuthenticated()) {
		res.redirect('/signin');
	} else {

		var user = req.user;
		if (user !== undefined) {
			user = user.toJSON();
		}
		user.displayname = unescapeHTML(user.username)
		res.render('index', {title: 'Home', user: user});
	}
};

// sign in
// GET
var signIn = function (req, res, next) {
	if (req.isAuthenticated()) res.redirect('/');
	res.render('signin', {title: 'Sign In'});
};

// sign in
// POST
var signInPost = function (req, res, next) {

	passport.authenticate('local', { successRedirect: '/',
		failureRedirect: '/signin'}, function (err, user, info) {
		if (err) {
			console.log("err.message: " + err.message)
			return res.render('signin', {title: 'Sign In', errorMessage: err.message});
		}

		if (!user) {
			console.log("info.message: " + info.message)
			return res.render('signin', {title: 'Sign In', errorMessage: info.message});
		}
		return req.logIn(user, function (err) {
			if (err) {
				return res.render('signin', {title: 'Sign In', errorMessage: err.message});
			} else {
				console.log("successful login!!!")
				user.displayname = unescapeHTML(user.username)
				return res.redirect('/');
			}
		});
	})(req, res, next);
};

// sign up
// GET
var signUp = function (req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect('/');
	} else {
		res.render('signup', {title: 'Sign Up'});
	}
};

// sign up
// POST
var signUpPost = function (req, res, next) {

	var user = req.body;
	//user.username = escapeHTML(user.username)
	//user.password = escapeHTML(user.password)
	var usernamePromise = null;

	usernamePromise = new Model.User({username: user.username}).fetch();

	return usernamePromise.then(function (model) {
		if (model) {
			res.render('signup', {title: 'signup', errorMessage: 'username already exists'});
		} else {
			//****************************************************//
			// MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
			//****************************************************//
			var password = user.password;
			var hash = escapeHTML(password) //bcrypt.hashSync(password);
			var confString = alphanumeric_unique()
			var signUpUser = new Model.User({username: escapeHTML(user.username), password: hash, confirmation_string: confString});
			console.log("savind new user:" + user.username + ' password:' + hash)
			signUpUser.save().then(function (model) {
				// sign in the newly registered user
				signInPost(req, res, next);
			});
		}
	});
};

// sign out
var signOut = function (req, res, next) {
	if (!req.isAuthenticated()) {
		notFound404(req, res, next);
	} else {
		req.logout();
		res.redirect('/signin');
	}
};

// 404 not found
var notFound404 = function (req, res, next) {
	res.status(404);
	res.render('missing', {title: '404 Not Found'});

};
function unescapeHTML(safe_str) {
	return decodeURI(safe_str).replace(/\\"/g, '"').replace(/\\'/g, "'");
}
function escapeHTML(unsafe_str) {
	//return unsafe_str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	//return unsafe_str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;'); // '&apos;' is not valid HTML 4
	//return encodeURI(unsafe_str).replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');
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
			case "\s":
				return "\\s";
			case "\"":
			case "'":
			case "\\":
			case "%":
				return "\\" + char; // prepends a backslash to backslash, percent,
			// and double/single quotes
		}
	});*/
}

// export functions
/**************************************/
// index
module.exports.index = index;

// sigin in
// GET
module.exports.signIn = signIn;
// POST
module.exports.signInPost = signInPost;

// sign up
// GET
module.exports.signUp = signUp;
// POST
module.exports.signUpPost = signUpPost;

// sign out
module.exports.signOut = signOut;

// 404 not found
module.exports.notFound404 = notFound404;