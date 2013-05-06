module.exports = function(piler) {
	return {
		login: function(req, res) {
			res.render("login.jade", {
				js: piler.js.renderTags(),
				css: piler.css.renderTags()
			});
		},

		error: function(req, res) {
			res.render("error.jade", {
				js: piler.js.renderTags(),
				css: piler.css.renderTags()
			});
		},
		logout: function(req, res) {
			req.logout();
			res.redirect('/');
		}
	};
}