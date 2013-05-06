var env = process.env.NODE_ENV || 'development',
	config = require('./config/config')[env],
	fs = require('fs'),
	async = require('async'),
	mongoose = require('mongoose');

mongoose.connect(config.database);

var modelPath = __dirname + '/app/model'
fs.readdirSync(modelPath).forEach(function (file) {
	require(modelPath + '/' + file)
})

var mysql = require('mysql');
var pool = mysql.createPool(config.mysql);

var Client = mongoose.model('Client');
var User = mongoose.model('User');
var Workorder = mongoose.model('Workorder');
var Counter = mongoose.model('Counter');

mongoose.connection.on('error', function(err) {
	console.log(err);
});

mongoose.connection.on('disconnected', function(msg) {
	console.log("Disconnected");
});

var frequencies = ["annual","semi","quarterly","sterilizer","tg","ert","rae","medgas","imaging","neptune","anesthesia"];
var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

var systemUser;

var userMap = {};
var clientMap = {};
var workorderMap = {};

var maxWorkorderId = 0;

async.series([
	importUsers,
	createSystemUser,
	processQuery('SELECT * FROM user', processUser),
	processQuery('SELECT * FROM client', processClient),
	processQuery('SELECT * FROM workorder', processWorkorder),
	processQuery('SELECT * FROM workorder_tech', processWorkorderTech),
	updateCounter,
],
function(err, result) {
	if (err) throw err;

	console.log("Import Complete");

	mongoose.connection.close(function(dberr) {
		if (dberr) {
			console.log("Error disconnecting from mongo: ");
			console.log(dberr);
		} else {
			process.exit();
		}
	});
});

function importUsers(callback) {
	fs.readFile(__dirname + '/users.json', 'utf8', function(err, data) {
		if (err) {
			return callback(err);
		}

		var data = JSON.parse(data);

		async.each(data, function(user, userCallback) {
			var id = user.id;
			delete user.id;

			console.log("Adding user: " + user.name.first + " " + user.name.last);

			new User(user).save(function(err, result) {
				if (id) {
					if (!Array.isArray(id)) id = [id];

					id.forEach(function(biomedid) {
						userMap[biomedid] = result.id;
					});
				}

				userCallback(err);
			});

		}, callback);
	});
}

function createSystemUser(callback) {
	new User({
		name: {
			first: 'System',
			last: 'User'
		},
		email: 'system@atlanticbiomedical.com',
	}).save(function(err, result) {
		systemUser = result.id;
		callback(err, result);
	});
}

function processUser(row, callback) {
	if (userMap[row.id]) {
		console.log("Found preconfigured user: " + row.first_name + " " + row.last_name);
		return callback(null);
	}

	var user = {
		name: {
			first: row.first_name,
			last: row.last_name
		},
		email: row.email || 'unknown@atlanticbiomedical.com',
		perms: [],
		groups: [],
		deleted: true
	};

	if (row.user_type_id === 1) {
		user.groups.push("all");
	}

	console.log("Adding deleted user: " + user.name.first + " " + user.name.last);

	new User(user).save(function(err, result) {
		userMap[row.id] = result.id;
		callback(err, result);
	});
}

function processClient(row, callback) {
	var client = new Client({
		name: 			row.client_name,
		identifier: 	row.client_identification,
		address: {
			street1: 	row.address || null,
			street2: 	row.address_2 || null,
			city: 		row.city || null,
			state: 		row.state || null,
			zip: 		row.zip || null
		},
		contacts:[{
			name: 		row.attn || undefined,
			phone: 		row.phone || undefined,
			email: 		row.email || undefined
		}]
	});

	if (row.secondary_attn || row.secondary_phone || row.secondary_email) {
		client.contacts.push({
			name: 	row.secondary_attn || undefined,
			phone: 	row.secondary_phone || undefined,
			email: 	row.secondary_email || undefined
		});
	}

	client.frequencies = {};

	if (row.frequency && row.frequency.toString()) {
		var str = row.frequency.toString();

		var frq = client.frequencies['legacy'] = [false, false, false, false, false, false, false, false, false, false, false, false];
		for (m in months) {
			if (str.indexOf(months[m]) !== -1) {
				frq[m] = true;
			}
		}
	}

	for (key in frequencies) {
		var frequency = frequencies[key];
		var data = row["frequency_" + frequency];
		var frq = client.frequencies[frequency] = [false, false, false, false, false, false, false, false, false, false, false, false];

		if (data && data.toString()) {
			var str = data.toString();
			for (m in months) {
				if (str.indexOf(months[m]) !== -1) {
					frq[m] = true;
				}
			}
		}
	}

	client.save(function (err, result) {
		clientMap[row.id] = result.id;
		callback(err, result);
	});
}

function processWorkorder(row, callback) {
	var jobDate = row.job_date;

	if (!jobDate) return callback(null, null);

	var jobStart = buildJobTime(jobDate, row.job_start);
	var jobEnd = buildJobTime(jobDate, row.job_end);

	var workorder = new Workorder({
		biomedId: row.id,
		client: clientMap[row.client_id],
		createdOn: new Date(Date.parse(row.job_scheduled_date)),
		createdBy: systemUser,
		reason: mapReason(row.reason),
		remarks: row.remarks,
		status: mapStatus(jobStart),
		scheduling: {
			start: jobStart,
			end: jobEnd
		},
		calendarId: row.google_event_id,
	});

	workorder.save(function(err, result) {
		if (err) return callback(err);

		workorderMap[row.id] = result.id;

		maxWorkorderId = Math.max(maxWorkorderId, row.id);

		Client.findByIdAndUpdate(clientMap[row.client_id], { $push: { 'workorders': result.id } }, callback);
	});
}

function processWorkorderTech(row, callback) {
	var workorderId = workorderMap[row.workorder_id];
	var userId = userMap[row.user_id];

	if (workorderId && userId) {
		Workorder.findByIdAndUpdate(workorderId, { $push: { 'techs': userId }}, callback);
	} else {
		console.log("Unable to map workorder: " + row.workorder_id + " -> " + row.user_id);
		callback(null);
	}
}

function updateCounter(callback) {
	new Counter({
		name: 'workorder',
		seq: maxWorkorderId
	}).save(callback);
}

function processQuery(sql, processor) {
	return function(callback) {
		pool.getConnection(function(err, connection) {
			if (err) return console.log(err);

			var calls = [];

			console.log('Executing query "' + sql + '"')

			connection.query(sql, function(err, rows) {
				if (err) return console.log(err);

				console.log("Found " + rows.length + " rows");

				rows.forEach(function(row) {
					calls.push(function(callback) {
						processor(row, callback);
					});
				});

				async.parallel(calls, function(err, result) {
					if (err) return callback(err);

					console.log("Finished processing query");
					callback(null);
				});
			});
		});
	}
}

function buildJobTime(date, time) {
	return new Date(Date.parse(date + ' ' + parseJobTime(time)));
}

function parseJobTime(str) {
	if (str.length == 3) {
		return '0' + str.substr(0, 1) + ':' + str.substr(1, 2) + ':00';
	} else {
		return str.substr(0, 2) + ':' + str.substr(2, 2) + ':00';
	}
}

var reasons = {
	"18": "Add New Equipment",
	"24": "As Directed",
	"7": "Autoclave Repair",
	"21": "Calibration",
	"9": "Delivery",
	"10": "Diagnose Problem",
	"19": "Install Parts",
	"22": "Off",
	"23": "PM Reschedule",
	"17": "Preventive Maintenance",
	"6": "Printer Failure",
	"20": "Repair"
};

function mapReason(reason) {
	if (reasons[reason]) {
		return reasons[reason];
	} else {
		return reason;
	}
}

function mapStatus(jobDate) {
	if (jobDate < new Date(2012, 3, 10)) {
		return 'invoiced';
	} else {
		return 'scheduled';
	}
}