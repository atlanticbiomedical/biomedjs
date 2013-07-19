var mongoose = require('mongoose'),
	Tag = mongoose.model('Tag');

module.exports = function(piler) {
	return {
		index: function(req, res, next) {
			host = String(req.headers['x-forwarded-host']);
			host = host.split(':')[0];

			if (host != 'n.atlb.co') {
				return next();
			}

			if (!req.user) {
				req.session.redirectUrl = req.url
			}

			var path = req.path.slice(1);

			Tag.findById(path)
				.populate('client', 'name identifier address')
				.exec(function(err, result) {
					var payload = {
						user: req.user,
						id: path,
						tag: result || undefined,
					};

					res.render('tag.jade', {
						css: piler.css.renderTags(),
						payload: payload
					});
				})
		},
		post: function(req, res) {

			var tag_id = req.body.tag_id;
			delete req.body.tag_id;

			Tag.findByIdAndUpdate(tag_id, req.body, { upsert: true }, function(err, result) {
				if (err) {
					res.json(500, err);
				} else {
					res.json(result);
				}
			});
		}
	}
}
