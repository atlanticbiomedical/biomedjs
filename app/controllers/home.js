module.exports = function(piler) {
	return {
		index: function(req, res) {
			res.render("index.jade", {
				js: piler.js.renderTags(),
				css: piler.css.renderTags()
			});
		},
	};
};