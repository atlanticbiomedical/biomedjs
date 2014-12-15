var express = require('express');

module.exports = function(app, config, passport, piler) {
	app.set('showStackError', true);

	app.use(express.static(config.root + '/public'))
	app.use(express.logger('dev'));
	app.set('views', config.root + '/app/views');
	app.set('view engine', 'jade');

	app.configure(function() {
		// cookieParser should be above session
		app.use(express.cookieParser("atlbsecret"));

		// bodyParser should be above methodOverride
		app.use(express.bodyParser());
		app.use(express.methodOverride());

		app.use(express.session({
			secret: 'atlantic_biomed_server_secret'
		}));

		// use passport session
		app.use(passport.initialize());
		app.use(passport.session());

		// use piler for asset management
		piler.bind();

		app.use(express.favicon());

		// routes should be last
		app.use(app.router);
	});

//	app.configure('development', function() {
//		// enable live update in development mode.
//		piler.liveUpdate();
//	});
}
