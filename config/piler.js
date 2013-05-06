var pile = require('piler');

module.exports = function(app, server, io, config) {
	var js = pile.createJSManager();
	var css = pile.createCSSManager();

	var root = config.root + "/public";

	return {
		bind: function() {
			js.bind(app, server);
			css.bind(app, server);
		},

		liveUpdate: function() {
			js.liveUpdate(css, io);
		},

		addCssUrl: function(url) {
			css.addUrl(url);
		},

		addCssFile: function(path) {
			css.addFile(root + path);
		},

		addJsUrl: function(url) {
			js.addUrl(url);
		},

		addJsFile: function(path) {
			js.addFile(root + path);
		},

		js: js,
		css: css
	};
};
