var pushover = require('pushover-notifications');

var express = require('express')
	fs = require('fs'),
	passport = require('passport');

var env = 'prod',
	config = require('./config/config')[env],
	mongoose = require('mongoose'),
	Promise = require('bluebird');

var log = require('log4node');

Promise.promisifyAll(mongoose);

       process.on('uncaughtException', function(err) {
               console.log('Uncaught Exception:', err);
               console.log(err.stack);

               var p = new pushover({
                       user: 'aJmPD4KigO0vLwim76n3WqWKwbKA3k',
                       token: 'YxspDLz3WinbPmwBThuZXCME9QmkDb'
               });

               var message = {
                       title: 'Unhandled error in portal',
                       message: 'Process was reset on ' + new Date(),
                       sound: 'falling'
               };
               p.send(message, function(err, result) {
                       if (err) {
                               log.emergency('Error while sending pushover notification');
                               log.emergency(err);
                       }
                       process.exit(1);
               });
       });

log.info("----- Server Started -----");

// bootstrap db connection
mongoose.set('debug', config.debug);
mongoose.connect(config.database);

// bootstrap model
var modelPath = __dirname + '/app/model'
fs.readdirSync(modelPath).forEach(function (file) {
	require(modelPath + '/' + file)
})

require('./config/passport')(passport, config);

var app = express(),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io').listen(server);

// Configure piler
var piler = require('./config/piler')(app, server, io, config);

// Express settings
require('./config/express')(app, config, passport, piler);

var auth = require('./config/auth')(app, passport);

var calendar = require('./config/calendar')(config);

var directory = require('./config/directory')(config);

// Bootstrap routes
require('./config/routes')(app, auth, piler, calendar, directory, config);

GLOBAL.health = 'OK'

var port = process.env.PORT || 9000
server.listen(port)
console.log('Express app started on port ' + port)
