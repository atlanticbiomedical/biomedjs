
var PUSHOVER_ENABLED = false;

var env = 'prod';

var pushover = require('pushover-notifications');
var express = require('express');
var fs = require('fs');
var passport = require('passport');
var config = require('./config/config')[env];
var mongoose = require('mongoose');
var log = require('log4node');

mongoose.Promise = require('bluebird');

var moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");

var pushoverApi = new pushover({
  user: 'aJmPD4KigO0vLwim76n3WqWKwbKA3k',
  token: 'YxspDLz3WinbPmwBThuZXCME9QmkDb'
});

process.on('uncaughtException', function(err) {
  console.log('Uncaught Exception:', err);
  console.log(err.stack);

  sendPushOver(
    'Unhandled error in portal',
    'Process was reset on ' + new Date(),
    'falling',
    function() {
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

var auth = require('./config/auth')(app, passport, config);

var calendar = require('./config/calendar')(config);

var directory = require('./config/directory')(config);

// Bootstrap routes
require('./config/routes')(app, auth, piler, calendar, directory, config);

GLOBAL.health = 'OK'

var port = process.env.PORT || 9000

server.on('error', function(e) {
  if (e.code == 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(function() {
      server.close();
      server.listen(port, onListen);
    }, 1000);
  }
});

server.listen(port, onListen);

function onListen() {
  sendPushOver(
    'Portal is running',
    'Process was reset on ' + new Date(),
    'bugle');
}

function sendPushOver(title, message, sound, callback) {
  if (!PUSHOVER_ENABLED) {
    return;
  }

  var data = {
    title: title,
    message: message,
    sound: sound
  };

  pushoverApi.send(data, function(err, result) {
    if (err) {
      log.emergency('Error while sending pushover notification');
      log.emergency(err);
    }

    if (callback) {
      callback();
    }
  });
}
