module.exports = function(app, passport) {
	app.get('/auth', passport.authenticate('google', {
		accessType: 'offline',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar'	
		]}));

	app.get('/auth/callback', function(req, res, next) {
		passport.authenticate('google', function(err, user, info) {
			var redirectUrl = '/';

			if (err) { return next(err); }
			if (!user) { return res.redirect('/login/error'); }

			if (req.session.redirectUrl) {
				redirectUrl = req.session.redirectUrl;
				req.session.redirectUrl = null;
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
				req.session.redirectUrl = req.url;
				return res.redirect('/login');
			}
			next();
		},
		requiresApiAccess: function(req, res, next) {
			if (!req.isAuthenticated()) {
				return res.send(403);
			}
			next();
		}	
	};
};