var log = require('log4node');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var request = require('request');
var jwt = require('jwt-simple');
var moment = require('moment');

var ACCESS_TOKEN_URL = 'https://accounts.google.com/o/oauth2/token';
var PEOPLE_API_URL = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

module.exports = function(app, passport, config) {

	function createJWT(user) {
	  var payload = {
	    sub: user._id,
	    iat: moment().unix(),
	    exp: moment().add(14, 'days').unix()
	  };

	  return jwt.encode(payload, config.auth.jwtSecret);
	}

	app.post('/auth2', function(req, res) {
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			client_secret: config.auth.clientSecret,
			redirect_uri: req.body.redirectUri,
			grant_type: 'authorization_code'
		};

		request.post(ACCESS_TOKEN_URL, { json: true, form: params }, function(err, response, token) {
			console.log(token);

			var accessToken = token.access_token;
			var headers = {
				Authorization: 'Bearer ' + accessToken
			};

			request.get({ url: PEOPLE_API_URL, headers: headers, json: true }, function(err, response, profile) {
				if (profile.error) {
					return res.status(500).send({ message: profile.error.message });
				}

				User.findOne({ email: profile.email.toLowerCase() }, function(err, user) {
					if (err) {
						return res.status(500).send(err);						
					}

					if (!user || !user.hasPermission('system.login')) {
						return res.status(403).send({ message: "You are not authorized to access this portal."});
					}

					user.accessToken = token.access_token;

					if (token.refresh_token) {
						user.refreshToken = token.refresh_token;
					}

					if (profile.given_name) {
						user.name.first = profile.given_name;
					}

					if (profile.family_name) {
						user.name.last = profile.family_name;
					}

					if (profile.picture) {
						user.picture = profile.picture.replace('sz=50', 'sz=200');
					}

                    user.save()
                        .then(function() {
                            res.send({ token: createJWT(user) });
                        });
				});
			});
		})
	});



	app.get('/auth', function(req, res, next) {
		console.dir(req.headers);
		req.session.redirectUrl = req.headers['referer'];

		passport.authenticate('google', {
		accessType: 'offline',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar'	
		]})(req, res, next);
	});

	app.get('/auth/callback', function(req, res, next) {

		var callbackHost = req.headers['x-forwarded-host'];
		if (!callbackHost) {
			callbackHost = "localhost:9000";
		}

		var options = {
			callbackURL: 'http://' + callbackHost + '/auth/callback'
		};
		passport.authenticate('google', options, function(err, user, info) {
			var redirectUrl = '/';

			if (err) { return next(err); }
			if (!user) { return res.redirect('/login/error'); }

			log.setPrefix("[%d] %l ");
			log.info("User Logged In: %s %s", user.name.first, user.name.last);

			res.cookie('atlbid', JSON.stringify(user._id), {signed:true});
			
			if (req.session.redirectUrl) {
				redirectUrl = req.session.redirectUrl;
				req.session.redirectUrl = null;
			}

			if (redirectUrl.indexOf('/login') != -1) {
				redirectUrl = '/';
			}

			req.logIn(user, function(err) {
				if (err) { return next(err); }
			});

			res.redirect(redirectUrl);
		})(req, res, next);
	});

	function createAuthenticator(error) {
		return function(req, res, next) {
			var onError = function() {
				error(req, res, next);
			};

            var onSuccess = function(user) {
                log.setPrefix(function(level) {
                    return '[' + new Date().toUTCString() + '] ' + level.toUpperCase() + ' ' + user.name.first + ' ' + user.name.last + ' | ';
                });
                next();
            }

			if (!req.isAuthenticated()) {
				if (!req.headers.authorization) {
					return onError();
				}

				var token = req.headers.authorization.split(' ')[1];
				var payload = null;
				try {
					payload = jwt.decode(token, config.auth.jwtSecret);
				} catch (err) {
					return onError();
				}

				if (payload.exp <= moment().unix()) {
					return onError();
				}

				User.findById(payload.sub, function(err, user) {
                    console.log('Loaded User');
					req.user = user;

                    onSuccess(user);
			    });
			} else {
                onSuccess(req.user);
            }
		}
	}

	return {
		requiresUiLogin: createAuthenticator(function(req, res, next) {
			res.redirect('/login');
		}),

		requiresApiAccess: createAuthenticator(function(req, res, next) {
			res.send(403);
		})
	};

/*
	return {
		requiresUiLogin: function(req, res, next) {
			if (!req.isAuthenticated()) {
				return res.redirect('/login');
			}

            log.setPrefix(function(level) {
                    return '[' + new Date().toUTCString() + '] ' + level.toUpperCase() + ' ' + req.user.name.first + ' ' + req.user.name.last + ' | ';
            });
			next();
		},
		requiresApiAccess: function(req, res, next) {
			if (!req.isAuthenticated()) {
				return res.send(403);
			}

            log.setPrefix(function(level) {
                    return '[' + new Date().toUTCString() + '] ' + level.toUpperCase() + ' ' + req.user.name.first + ' ' + req.user.name.last + ' | ';
            });
			next();
		}	
	};
*/
};
