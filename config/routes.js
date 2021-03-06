var log = require('log4node');

var routes = require('../app/routes');

module.exports = function (app, auth, piler, calendar, directory, config) {

  piler.addCssUrl("//fonts.googleapis.com/css?family=Open+Sans:400,300");
  piler.addCssFile("/css/biomed.less");

  piler.addJsUrl("//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js");
  piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.js");
  piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-route.js");
  piler.addJsUrl("//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-resource.js");
  piler.addJsUrl("http://d3js.org/d3.v2.js");
  piler.addJsUrl("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.10.1/lodash.js")

  piler.addJsFile("/js/lib/moment.js");
  piler.addJsFile("/js/lib/bootstrap-datepicker.js");
  piler.addJsFile("/js/lib/dialog.js");
  piler.addJsFile("/js/lib/select2.js");
  piler.addJsFile("/js/lib/dropzone.js");
  piler.addJsFile("/js/lib/hashids.js");
  piler.addJsFile("/js/app.js");
  piler.addJsFile("/js/controllers.js");
  piler.addJsFile("/js/controllers/checkLists.js");
  piler.addJsFile("/js/controllers/devices.js");
  piler.addJsFile("/js/controllers/deviceTypes.js");
  piler.addJsFile("/js/controllers/testRuns.js");
  piler.addJsFile("/js/directives.js");
  piler.addJsFile("/js/filters.js");
  piler.addJsFile("/js/services.js");

  app.get('/crash', function (req, res) {
    console.log('Commiting Suicide for Science!');
    process.nextTick(function () {
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
  app.get('/api/clients/:client_id/devices', clients.devices);
  app.post('/api/clients', clients.create);
  app.post('/api/clients/:client_id', clients.update);
  app.del('/api/clients/:client_id', clients.destroy);

  var workorders = require('../app/controllers/workorders')(config, calendar);
  app.get('/api/workorders', workorders.index);
  app.get('/api/workorders/:workorder_id', workorders.get);
  app.post('/api/workorders', workorders.create);
  app.post('/api/workorders/:workorder_id', workorders.update);
  app.del('/api/workorders/:workorder_id', workorders.destroy);

  var devices = require('../app/controllers/devices');
  app.get('/api/devices', devices.index);
  app.get('/api/devices/isUnique', devices.isUnique);
  app.get('/api/devices/:device_id', devices.get);
  app.get('/api/devices/:device_id/test_runs', devices.testRuns);
  app.post('/api/devices', devices.create);
  app.post('/api/devices/:device_id', devices.update);

  var deviceTypes = require('../app/controllers/deviceTypes');
  app.get('/api/device_types', deviceTypes.index);
  app.get('/api/device_types/categories', deviceTypes.categories);
  app.get('/api/device_types/makes', deviceTypes.makes);
  app.get('/api/device_types/models', deviceTypes.models);
  app.post('/api/device_types/images', deviceTypes.upload);
  app.get('/api/device_types/:device_type_id', deviceTypes.get);
  app.post('/api/device_types', deviceTypes.create);
  app.post('/api/device_types/:device_type_id', deviceTypes.update);

  var checkLists = require('../app/controllers/checkLists');
  app.get('/api/check_lists', checkLists.index);
  app.get('/api/check_lists/:check_list_id', checkLists.get);
  app.post('/api/check_lists', checkLists.create);
  app.post('/api/check_lists/:check_list_id', checkLists.update);

  var testRuns = require('../app/controllers/testRuns')(config);
  app.get('/api/test_runs', testRuns.index);
  app.get('/api/test_runs/:test_run_id', testRuns.get);
  app.post('/api/test_runs', testRuns.create);
  app.post('/api/test_runs/:test_run_id', testRuns.update);

  var timeclock = require('../app/controllers/timeclock')();
  app.get('/api/timeclock', timeclock.index);
  app.post('/api/timeclock/clock_in', timeclock.clockIn);
  app.post('/api/timeclock/clock_out', timeclock.clockOut);
  app.get('/api/timeclock/users/:user_id', timeclock.spansForUser);
  app.get('/api/timeclock/workorder/:id', timeclock.workorderDetails);

  var timesheet = require('../app/controllers/timesheet')();
  app.get('/api/timesheet/summary', timesheet.summary);
  app.get('/api/timesheet/:user_id/daysWorked', timesheet.daysWorked);
  app.get('/api/timesheet/:user_id/summary', timesheet.userSummary);
  app.post('/api/timesheet/:user_id/approve', timesheet.approve);

  var pms = require('../app/controllers/pms');
  app.get('/api/pms', pms.index);

  var schedule = require('../app/controllers/schedule');
  app.get('/api/schedule', schedule.index);

  var users = require('../app/controllers/users')(config, directory);
  app.get('/api/users', users.index);
  app.get('/api/users/details', users.details);
  app.get('/api/users/:user_id', users.get);
  app.post('/api/users', users.create);
  app.post('/api/users/:user_id', users.update);
  app.get('/api/users/:user_id/clocks', users.clocks);

  var account = require('../app/controllers/account')(config);
  app.get('/api/account', account.profile);
  app.post('/api/account/impersonate', account.impersonate);

  var messages = require('../app/controllers/messages')(config);
  app.post('/api/messages/send', messages.send);

  var tags = require('../app/controllers/tags')(piler);
  app.post('/api/tags', tags.post);

  var site = require('../app/controllers/site')(piler);

  var login = require('../app/controllers/login')(piler);
  app.get('/login', login.login);
  app.get('/login/error', login.error);
  app.get('/logout', login.logout);

  var home = require('../app/controllers/home')(piler);



  // Exceptions
  app.get('/api/v2/exceptions', routes.exceptions.index);

  // Spans
  app.get('/api/v2/spans', routes.spans.index);
  app.post('/api/v2/spans/:id', routes.spans.update);

  // Users
  app.get('/api/v2/users/:id/daysWorked', routes.users.daysWorked);
  app.get('/api/v2/users/:id/weeksWorked', routes.users.weeksWorked);
  app.get('/api/v2/users/:id/timeClock', routes.users.timeClock);
  app.get('/api/v2/users/:id', routes.users.fetch);
  app.post('/api/v2/users/:id', routes.users.update);

  // Workorders
  app.get('/api/v2/workorders/:id/timeClock', routes.workorders.timeClock);

  // Misc
  app.post('/api/v2/misc/partsRequest', routes.misc.partsRequest);

  app.get('/', tags.index, auth.requiresUiLogin, site.index, home.index);
  app.get('*', tags.index, auth.requiresUiLogin, site.index, home.index);
};
