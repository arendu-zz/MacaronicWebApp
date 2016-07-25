// vendor library
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var walk = require('walk')
var fs = require('fs')

// custom library
// model
var Model = require('./model');

var readFiles = function(successCallback) {
    var file_list = {};
    var walker = walk.walk('./stories/individual', {
        followLinks: false
    });

    walker.on("end", function() {
        console.log("read all content files");
        successCallback(file_list);
    });

    walker.on('file', function(root, stat, next) {
        var n = stat.name.split('.')
        var category = n[0]
        console.log(category)
        var fl = file_list[category]
        console.log(fl)
        var f = {
            'name': n[1].replace('@-@', '-'),
            'path': root + '/' + stat.name
        };
        if (fl == null){
          fl =[f]
        }else{
            fl.push(f);
        }
        //file_list.push(f);
        file_list[category] = fl
        next();
    });
};

// index
var index = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {

        var user = req.user;
        console.log('USER(index)')
        console.log(req.user);

        if (user !== undefined) {
            user = user.toJSON();
        }
        user.displayname = unescapeHTML(user.username);
        readFiles(function(file_list) {
            res.render('index', {
                'title': 'Home',
                'user': user,
                'file_list': file_list
            });
        });
    }
};

var indexPost = function(req, res, next) {};

var content = function(req, res, next) {
    var user = req.user;
    user.displayname = unescapeHTML(user.username);
    res.render('content', {
        'title': 'Content',
        'user': user,
        'file_path': req.query.file_path
    });
}

var contentPost = function(req, res, next) {
    console.log('USER')
    console.log(req.user)
    console.log('QUERY')
    console.log(req.query)
    console.log('BODY')
    console.log(req.body)
   
    console.log('in content post')
    var user = req.user;
    user = user.toJSON();
    user.displayname = unescapeHTML(user.username);
    res.render('content', {
        'title': 'Content',
        'user': user,
        'file_path': req.body.file_path
    });

}

// sign in
// GET
var signIn = function(req, res, next) {
    if (req.isAuthenticated()) res.redirect('/');
    res.render('signin', {
        title: 'Sign In'
    });
};

// sign in
// POST
var signInPost = function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/signin'
    }, function(err, user, info) {
        if (err) {
            return res.render('signin', {
                title: 'Sign In',
                errorMessage: err.message
            });
        }

        if (!user) {
            return res.render('signin', {
                title: 'Sign In',
                errorMessage: info.message
            });
        }
        return req.logIn(user, function(err) {
            if (err) {
                return res.render('signin', {
                    title: 'Sign In',
                    errorMessage: err.message
                });
            } else {
                user.displayname = unescapeHTML(user.username)
                return res.redirect('/');
            }
        });
    })(req, res, next);
};

// sign up
// GET
var signUp = function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('signup', {
            title: 'Sign Up'
        });
    }
};

// sign up
// POST
var signUpPost = function(req, res, next) {
    var user = req.body;
    //user.username = escapeHTML(user.username)
    //user.password = escapeHTML(user.password)
    var usernamePromise = null;

    usernamePromise = new Model.User({
        username: user.username
    }).fetch();

    return usernamePromise.then(function(model) {
        if (model) {
            res.render('signup', {
                title: 'signup',
                errorMessage: 'username already exists'
            });
        } else {
            //****************************************************//
            // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
            //****************************************************//
            var password = user.password;
            var hash = escapeHTML(password) //bcrypt.hashSync(password);

            var signUpUser = new Model.User({
                username: escapeHTML(user.username),
                password: hash
            });

            signUpUser.save().then(function(model) {
                // sign in the newly registered user
                signInPost(req, res, next);
            });
        }
    });
};

// sign out
var signOut = function(req, res, next) {
    if (!req.isAuthenticated()) {
        notFound404(req, res, next);
    } else {
        req.logout();
        res.redirect('/signin');
    }
};

// 404 not found
var notFound404 = function(req, res, next) {
    res.status(404);
    res.render('missing', {
        title: '404 Not Found'
    });

};

function unescapeHTML(safe_str) {
    return decodeURI(safe_str).replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function escapeHTML(unsafe_str) {
    return encodeURI(unsafe_str).replace(/\"/g, '\"').replace(/\'/g, '\'');
}

// export functions
/**************************************/
// index
module.exports.index = index;
module.exports.indexPost = indexPost;

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

// read files
module.exports.readFiles = readFiles;

// content
// GET
module.exports.content = content;
// POST
module.exports.contentPost = contentPost;
