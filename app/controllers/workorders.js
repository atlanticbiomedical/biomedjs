
var mongoose = require('mongoose'),
	moment = require('moment'),
	async = require('async'),
	sprintf = require('sprintf').sprintf,
	Client = mongoose.model('Client'),
	Workorder = mongoose.model('Workorder'),
	Counter = mongoose.model('Counter'),
	User = mongoose.model('User');

module.exports = function(calendar) {
	return {
		index: function(req, res) {

			var start = moment(req.query.start).toDate();
			var end = moment(req.query.end).add('days', 1).toDate();

			Workorder
				.find({
					deleted: false,
					'scheduling.start': { '$gte': start, '$lt': end }
				})
				.populate('client', 'name identifier address')
				.populate('techs', 'name')
				.sort('-scheduling.start client.name')
				.exec(function(err, results) {
					if (err) {
						res.json(500, err);
					} else {
						res.json(results);
					}	
				});
		},

		get: function(req, res, next) {
			var id = req.param('workorder_id');

			Workorder.findById(id)
				.populate('client', 'name identifier')
				.populate('techs', 'name')
				.exec(function(err, workorder) {
					if (err) return next(err);
					if (!workorder) return next(new Error('Failed to load workorder ' + id));

					res.json(workorder);
				});
		},

		create: function(req, res, next) {
			var workorder = new Workorder({
				client: req.body.client,
				createdOn: new Date(),
				createdBy: req.user,
				reason: req.body.reason,
				remarks: req.body.remarks || "",
				status: req.body.status,
				scheduling: req.body.scheduling,
				techs: req.body.techs
			});

			var client;
			var techs;
			var jsonResult;

			async.waterfall([
				function(callback) {
					console.log("Get next workorder id.");
					Counter.collection.findAndModify(
						{ name: 'workorder' },
						[],
						{ $inc: { seq: 1 } },
						{ 'new': true, upsert: true },
						function(err, result) {
							workorder.biomedId = result.seq - 1;
							callback(err);
						});
				},
				function(callback) {
					console.log("Get Client");
					Client.findById(req.body.client, function(err, result) {
						client = result;
						callback(err);
					});
				},
				function(callback) {
					console.log('Get Techs');
					User.find({
							'_id': { $in: workorder.techs }
						},
						function(err, result) {
							console.log(result);
							techs = result;
							callback(err);
						});
				},
				function(callback) {
					console.log("Create Calendar Event")

					calendar.scheduleEvent({
						summary: generateSummary(client),
						description: generateDescription(client, workorder),
						location: generateLocation(client),
						start: workorder.scheduling.start,
						end: workorder.scheduling.end,
						attendees: generateAttendees(techs)
					}, function(err, result) {
						workorder.calendarId = result.id;
						callback(err);
					});
				},
				function(callback) {
					console.log("Save Workorder");
					workorder.save(function(err, result) { callback(err, result); });
				},
				function(result, callback) {
					console.log("Update Client")
					jsonResult = result;

					Client.findByIdAndUpdate(req.body.client, { $push: { 'workorders': result.id } },
						function(err, ignored) { callback(err, result) });
				}
			],
			function(err, result) {
				if (!err) {
					res.json(jsonResult);
				} else {
					console.log(err);
					throw err;
				}
			});
		},

		update: function(req, res, next) {
			var id = req.param('workorder_id');

			var workorder;
			var client;
			var techs;

			async.waterfall([
				function(callback) {
					console.log("Get Workorder");
					Workorder.findById(id, function(err, result) {
						workorder = result;

						workorder.reason = req.body.reason;
						workorder.remarks = req.body.remarks;
						workorder.scheduling = req.body.scheduling;
						workorder.status = req.body.status;
						workorder.techs = req.body.techs.map(function(t) { return t._id; });

						callback(err);
					});
				},
				function(callback) {
					console.log("Get Client");
					Client.findById(workorder.client, function(err, result) {
						client = result;
						callback(err);
					});
				},
				function(callback) {
					console.log('Get Techs');
					User.find({
							'_id': { $in: workorder.techs }
						},
						function(err, result) {
							console.log(result);
							techs = result;
							callback(err);
						});
				},
				function(callback) {
					console.log("Update Calendar Event")

					calendar.updateEvent({
						summary: generateSummary(client),
						description: generateDescription(client, workorder),
						location: generateLocation(client),
						start: workorder.scheduling.start,
						end: workorder.scheduling.end,
						attendees: generateAttendees(techs),
						eventId: workorder.calendarId
					}, function(err, result) {
						callback(err);
					});
				},
				function(callback) {
					workorder.save(function(err) {
						callback(err);
					})
				}
			],
			function(err) {
				if (!err) {
					console.log('updated');
				} else {
					console.log('error');
					console.log(err);
				}

				res.json(workorder);
			});
		},

		destroy: function(req, res, next) {
			var id = req.param('workorder_id');

			return Workorder.findById(id, function(err, workorder) {
				workorder.deleted = true;

				return workorder.save(function(err) {
					if (!err) {
						console.log("deleted");
					} else {
						console.log("error");
					}

					return res.json(workorder);
				})
			});
		}
	};
};


function generateSummary(client) {
	return client.name + ' (' + client.identifier + ')';
}

function generateLocation(client) {
	return sprintf("%(street1)s %(street2)s %(city)s, %(state)s. %(zip)s", client.address);
}

function generateDescription(client, workorder) {
	var template = 
		"Workorder ID:\n" +
		"	%(biomedId)s\n" +
		"\n" +
		"Customer:\n" +
		"	%(name)s (%(identifier)s)\n" +
		"\n" +
		"Phone:\n" +
		"	%(phone)s\n" +
		"\n" +
		"Address:\n" +
		"	%(street1)s\n" +
		"	%(street2)s\n" +
		"	%(city)s, %(state)s. %(zip)s\n" +
		"\n" +
		"Reason:\n" +
		"	%(reason)s\n" +
		"\n" +
		"Status:\n" +
		"	%(status)s\n" +
		"\n" +
		"Remarks:\n" +
		"	%(remarks)s\n";

	var resources = {
		biomedId: workorder.biomedId || '',
		name: client.name || '',
		identifier: client.identifier || '',
		street1: client.address.street1 || '',
		street2: client.address.street2 || '',
		city: client.address.city || '',
		state: client.address.state || '',
		zip: client.address.zip || '',
		reason: workorder.reason || '',
		status: workorder.status || '',
		remarks: workorder.remarks || '',
		phone: ''
	};

	if (client.contacts[0]) {
		resources.phone = client.contacts[0].phone || '';
	}

	return sprintf(template, resources);
}

function generateAttendees(techs) {
	return techs.map(function(t) { return t.email; });
}