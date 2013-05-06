
module.exports = function(app, auth, piler, calendar, config) {

	piler.addCssUrl("//fonts.googleapis.com/css?family=Open+Sans:400,300");
	piler.addCssFile("/css/biomed.less");

	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js");
	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.1.3/angular.js");
	piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.1.3/angular-resource.js");
	piler.addJsUrl("http://d3js.org/d3.v2.js");
	piler.addJsFile("/js/lib/moment.js");
	piler.addJsFile("/js/lib/bootstrap-datepicker.js");
	piler.addJsFile("/js/lib/dialog.js");
	piler.addJsFile("/js/lib/select2.js");
	piler.addJsFile("/js/app.js");
	piler.addJsFile("/js/controllers.js");
	piler.addJsFile("/js/directives.js");
	piler.addJsFile("/js/filters.js");
	piler.addJsFile("/js/services.js");

	app.all('/api/*', auth.requiresApiAccess);

	var clients = require('../app/controllers/clients');
	app.get('/api/clients', clients.index);
	app.get('/api/clients/frequencies', clients.frequencies);
	app.get('/api/clients/:client_id', clients.get);
	app.get('/api/clients/:client_id/workorders', clients.workorders);
	app.post('/api/clients', clients.create);
	app.post('/api/clients/:client_id', clients.update);
	app.del('/api/clients/:client_id', clients.destroy);

	var workorders = require('../app/controllers/workorders')(calendar);
	app.get('/api/workorders', workorders.index);
	app.get('/api/workorders/:workorder_id', workorders.get);
	app.post('/api/workorders', workorders.create);
	app.post('/api/workorders/:workorder_id', workorders.update);
	app.del('/api/workorders/:workorder_id', workorders.destroy);

	var schedule = require('../app/controllers/schedule');
	app.get('/api/schedule', schedule.index);

	var users = require('../app/controllers/users');
	app.get('/api/users', users.index);

	var account = require('../app/controllers/account');
	app.get('/api/account', account.profile);

	var messages = require('../app/controllers/messages')(config);
	app.post('/api/messages/send', messages.send);

	var login = require('../app/controllers/login')(piler);
	app.get('/login', login.login);
	app.get('/login/error', login.error);
	app.get('/logout', login.logout);

	var home = require('../app/controllers/home')(piler);
	app.get('/', auth.requiresUiLogin, home.index);
	app.get('*', auth.requiresUiLogin, home.index);
};
