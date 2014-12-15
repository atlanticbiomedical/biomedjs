var mongoose = require('mongoose'),
	Post = mongoose.model('Post');

module.exports = function(piler) {
	return {
		index: function(req, res, next) {
			host = String(req.headers['x-forwarded-host']);
			host = host.split(':')[0];

			if (host != 'site.atlb.co') {
				return next();
			}

			if (!req.user) {
				req.session.redirectUrl = req.url
			}

			var path = req.path.slice(1);

			res.render('site.jade', {
				css: piler.css.renderTags()
			});
		}
	}
}
