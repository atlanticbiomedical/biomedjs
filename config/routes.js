var log = require('log4node');

module.exports = function(app, auth, piler, calendar, directory, config) {

	piler.addCssUrl("//fonts.googleapis.com/css?family=Open+Sans:400,300");
	piler.addCssFile("/css/biomed.less");

	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js");
	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.js");
	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-route.js");
	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-resource.js");


	piler.addJsUrl("http://d3js.org/d3.v2.js");
	piler.addJsFile("/js/lib/moment.js");
	piler.addJsFile("/js/lib/bootstrap-datepicker.js");
	piler.addJsFile("/js/lib/dialog.js");
	piler.addJsFile("/js/lib/select2.js");
	piler.addJsFile("/js/lib/dropzone.js");
	piler.addJsFile("/js/app.js");
	piler.addJsFile("/js/controllers.js");
	piler.addJsFile("/js/directives.js");
	piler.addJsFile("/js/filters.js");
	piler.addJsFile("/js/services.js");

	app.get('/crash', function(req, res) {
		console.log('Commiting Suicide for Science!');
		process.nextTick(function() {
			throw new Error("Ermergerd!");
		});
	});

	app.all('/api/*', auth.requiresApiAccess);

	var posts = require('../app/controllers/posts');
	app.get('/api/posts', posts.index);
	app.get('/api/posts/:post_id', posts.get);
	app.post('/api/posts', posts.create);
	app.post('/api/posts/upload', posts.upload);
	app.post('/api/posts/:post_id', posts.update);
	app.del('/api/posts/:post_id', posts.destroy);

	var clients = require('../app/controllers/clients');
	app.get('/api/clients', clients.index);
	app.get('/api/clients/isUnique', clients.isUnique);
	app.get('/api/clients/frequencies', clients.frequencies);
	app.get('/api/clients/:client_id', clients.get);
	app.get('/api/clients/:client_id/workorders', clients.workorders);
	app.get('/api/clients/:client_id/tags', clients.tags);
	app.post('/api/clients', clients.create);
	app.post('/api/clients/:client_id', clients.update);
	app.del('/api/clients/:client_id', clients.destroy);

	var workorders = require('../app/controllers/workorders')(config, calendar);
	app.get('/api/workorders', workorders.index);
	app.get('/api/workorders/:workorder_id', workorders.get);
	app.post('/api/workorders', workorders.create);
	app.post('/api/workorders/:workorder_id', workorders.update);
	app.del('/api/workorders/:workorder_id', workorders.destroy);

	var pms = require('../app/controllers/pms');
	app.get('/api/pms', pms.index);

	var schedule = require('../app/controllers/schedule');
	app.get('/api/schedule', schedule.index);

	var users = require('../app/controllers/users')(config, directory);
	app.get('/api/users', users.index);
	app.get('/api/users/details', users.details);
	app.post('/api/users', users.create);
	app.post('/api/users/:user_id', users.update);
	app.get('/api/users/:user_id/clocks', users.clocks);

	var account = require('../app/controllers/account');
	app.get('/api/account', account.profile);

	var messages = require('../app/controllers/messages')(config);
	app.post('/api/messages/send', messages.send);

	var tags = require('../app/controllers/tags')(piler);
	app.post('/api/tags', tags.post);

	var clock = require('../app/controllers/clock')(piler);
	app.post('/api/clock', clock.post);

	var site = require('../app/controllers/site')(piler);
	
	var login = require('../app/controllers/login')(piler);
	app.get('/login', login.login);
	app.get('/login/error', login.error);
	app.get('/logout', login.logout);

	var home = require('../app/controllers/home')(piler);

	app.get('/', tags.index, auth.requiresUiLogin, clock.index, site.index, home.index);
	app.get('*', tags.index, auth.requiresUiLogin, clock.index, site.index, home.index);
};
