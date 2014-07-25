var express = require('express')
	fs = require('fs'),
	passport = require('passport');

var env = process.env.NODE_ENV || 'development',
	config = require('./config/config')[env],
	mongoose = require('mongoose');

var log = require('log4node');
log.reconfigure({
	level: 'info',
	file: 'server.log'
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

var port = process.env.PORT || 8000
server.listen(port)
console.log('Express app started on port ' + port)
