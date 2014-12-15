var log = require('log4node');

module.exports = function(app, passport) {
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
		var options = {
			callbackURL: 'http://' + req.headers['x-forwarded-host'] + '/auth/callback'
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
};
