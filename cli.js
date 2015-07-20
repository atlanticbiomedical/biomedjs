var fs = require('fs');

var env = 'prod',
	config = require('./config/config')[env],
	mongoose = require('mongoose'),
	Promise = require('bluebird');

// bootstrap db connection
mongoose.set('debug', config.debug);
mongoose.connect(config.database);

// bootstrap model
var modelPath = __dirname + '/app/model'
fs.readdirSync(modelPath).forEach(function (file) {
	require(modelPath + '/' + file)
})

