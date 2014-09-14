var mongoose = require('mongoose'),
	Clock = mongoose.model('Clock');

module.exports = function(piler) {
	return {
		index: function(req, res, next) {
			host = String(req.headers['x-forwarded-host']);
			host = host.split(':')[0];

			if (host != 'clock.atlb.co') {
				return next();
			}

			if (!req.user) {
				req.session.redirectUrl = req.url
			}

			var path = req.path.slice(1);

			res.render('clock.jade', {
				css: piler.css.renderTags()
			});
		},
		post: function(req, res) {
			var clock = new Clock({
				tech: req.user,
				action: req.body.action,
				lat: req.body.lat,
				long: req.body.long,
				dt: new Date()
			});

			clock.save(function(err, result) {
				if (err) {
					return res.json(500, err);
				} else {
					res.json(result);
				}
			});
		}
	}
}
