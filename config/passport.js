var mongoose = require('mongoose')
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	User = mongoose.model('User');

module.exports = function(passport, config) {
	passport.serializeUser(function(user, done) {
	    done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
	    User.findById(id, function(err, user) {
	        done(err, user);
	    });
	});

	passport.use(new GoogleStrategy({
		clientID: config.auth.clientId,
		clientSecret: config.auth.clientSecret,
//		callbackURL: config.auth.callback
	},
	function(accessToken, refreshToken, profile, done) {
		console.log(profile);
		console.log(accessToken);
		console.log(refreshToken);

		profile = profile._json;
		User.findOne({ email: profile.email.toLowerCase() }, function(err, user) {
			if (err) { return done(err); }
			if (!user || !user.hasPermission("system.login")) {
				return done(null, false, { message: "You are not authorized to access this portal." });
			}

			user.accessToken = accessToken;

			if (refreshToken) {
				user.refreshToken = refreshToken;
			}
			if (profile.given_name) {
				user.name.first = profile.given_name;
			}
			if (profile.family_name) {
				user.name.last = profile.family_name;
			}
			if (profile.picture) {
				user.picture = profile.picture;
			}

			user.save(function(err) {
				if (err) console.log(err);

				return done(err, user);
			});
		});
	}));
}
