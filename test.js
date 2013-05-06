var env = process.env.NODE_ENV || 'development',
	config = require('./config/config')[env],
	fs = require('fs'),
	calendar = require('./config/calendar')(config),
	moment = require('moment');

var event = {
	summary: 'Summary',
	location: 'Location',
	start: moment().hour(5).minute(30).toDate(),
	end: moment().hour(6).minute(0).toDate(),
	attendees: [ 'akirayasha@gmail.com' ]
};

console.log(event);

calendar.scheduleEvent(event, function(err, res) {
	console.log("Result");
	console.log(err);
	console.log(res);
});
