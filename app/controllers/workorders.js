var log = require('log4node');

var mongoose = require('mongoose'),
	email = require('emailjs'),
	moment = require('moment'),
	async = require('async'),
	sprintf = require('sprintf').sprintf,
	Client = mongoose.model('Client'),
	Workorder = mongoose.model('Workorder'),
	Counter = mongoose.model('Counter'),
	User = mongoose.model('User');

module.exports = function(config, calendar) {
	return {
		index: function(req, res) {

			log.info("workorders.index %j", req.query);
			
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
			log.info("workorders.get %s", id);

			Workorder.findById(id)
				.populate('client', 'name identifier')
				.populate('techs', 'name')
				.populate('createdBy', 'name')
				.populate('modifiedBy', 'name')
				.exec(function(err, workorder) {
					if (err) return next(err);
					if (!workorder) return next(new Error('Failed to load workorder ' + id));

					res.json(workorder);
				});
		},

		create: function(req, res, next) {
			log.info("workoreders.create %j", req.body);

                        var server = email.server.connect({
                                user: config.email.user,
                                password: config.email.password,
                                host: 'smtp.gmail.com',
                                ssl: true
                        });

			var date = new Date();

			var workorder = new Workorder({
				client: req.body.client,
				emails: req.body.emails,
				createdOn: date,
				createdBy: req.user,
				reason: req.body.reason,
				maintenanceType: req.body.maintenanceType || "",
				remarks: req.body.remarks || "",
				status: req.body.status,
				scheduling: req.body.scheduling,
				techs: req.body.techs,
				alternativeContact: req.body.alternativeContact
			});

			var notify = req.body._notify || "";

			var client;
			var techs;
			var jsonResult;

			async.waterfall([
				function(callback) {
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
					Client.findById(req.body.client, function(err, result) {
						client = result;
						callback(err);
					});
				},
				function(callback) {
					User.find({
							'_id': { $in: workorder.techs }
						},
						function(err, result) {
							techs = result;
							callback(err);
						});
				},
				function(callback) {
					calendar.scheduleEvent({
						summary: generateSummary(client),
						description: generateDescription(client, workorder, req.user),
						location: generateLocation(client),
						start: workorder.scheduling.start,
						end: workorder.scheduling.end,
						attendees: generateAttendees(techs, workorder)
					}, function(err, result) {
						if (result) {
							workorder.calendarId = result.id;
						}
						callback(err);
					});
				},
                                function(callback) {
					if (!notify)
						return callback(null);

					var description = generateDescription(client, workorder, req.user, null, techs);
					var techDescription = appendNotes(description, client, workorder);

					var to = req.body.emails;
					var techTo = generateToLine(techs);

					var subject = 'Workorder created: ' + workorder.biomedId;

					console.log('-------------------------');
					console.log(to);

					async.waterfall([
						function(cb) {
							if (to && to.length > 0) {
								var msg = {
									text: description,
									from: config.email.user,
									to: to,
									subject: subject
								};
								console.log(msg);
								server.send(msg, function(err, message) { cb(err); });
							} else {
								cb();
							}
						},
						function(cb) {
							if (techTo) {
								var msg = {
									text: techDescription,
									from: config.email.user,
									to: techTo,
									subject: subject
								};
								console.log(msg);
								server.send(msg, function(err, message) { cb(err); });
							} else {
								cb();
							}
						}
					], callback);
                                },
				function(callback) {
					workorder.save(function(err, result) { callback(err, result); });
				},
				function(result, callback) {
					jsonResult = result;

					Client.findByIdAndUpdate(req.body.client, { $push: { 'workorders': result.id } },
						function(err, ignored) { callback(err, result) });
				},
				function(result, callback) {
					if (workorder.maintenanceType) {
						var key = 'pms.' + date.getFullYear() + '-' + date.getMonth() + '.' + workorder.maintenanceType;
						var cmd = { $inc: {} };
						cmd.$inc[key] = 1;
						Client.findByIdAndUpdate(req.body.client, cmd, function(err, ignored) { callback(err, result) });
					} else {
						callback(null, result);
					}
				},
			],
			function(err, result) {
				if (!err) {
					res.json(jsonResult);
				} else {
					throw err;
				}
			});
		},

		update: function(req, res, next) {
			var server = email.server.connect({
				user: config.email.user,
				password: config.email.password,
				host: 'smtp.gmail.com',
				ssl: true
			});

			var modifiedOn = new Date();
			var id = req.param('workorder_id');

			log.info("workorders.update %s %j", id, req.body);

			var workorder;
			var client;
			var techs;
			var createdBy;
			var modifiedBy;

			var notify = req.body._notify || "";

			async.waterfall([
				function(callback) {
					Workorder.findById(id, function(err, result) {
						workorder = result;

						workorder.emails = req.body.emails;
						workorder.modifiedBy = req.user;
						workorder.modifiedOn = modifiedOn;
						workorder.reason = req.body.reason;
						workorder.maintenanceType = req.body.maintenanceType || "";
						workorder.remarks = req.body.remarks;
						workorder.scheduling = req.body.scheduling;
						workorder.status = req.body.status;
						workorder.techs = req.body.techs
							.filter(function(e) { return e; })
							.map(function(t) { return t._id; });
						workorder.invoiceNumber = req.body.invoiceNumber;
						workorder.invoicedOn = req.body.invoicedOn;
						workorder.checkNumber = req.body.checkNumber;
						workorder.paidOn = req.body.paidOn;
						workorder.alternativeContact = req.body.alternativeContact;

						callback(err);
					});
				},
				function(callback) {
					Client.findById(workorder.client, function(err, result) {
						client = result;
						callback(err);
					});
				},
				function(callback) {
					if (workorder.createdBy) {
						User.findById(workorder.createdBy, function(err, result) {
							createdBy = result;
							callback(err);
						});
					} else {
						callback(null);
					}
				},
				function(callback) {
					if (workorder.modifiedBy) {
						User.findById(workorder.modifiedBy, function(err, result) {
							modifiedBy = result;
							callback(err);
						});
					} else {
						callback(null);
					}
				},
				function(callback) {
					User.find({
							'_id': { $in: workorder.techs }
						},
						function(err, result) {
							techs = result;
							callback(err);
						});
				},
				function(callback) {
					calendar.updateEvent({
						summary: generateSummary(client),
						description: generateDescription(client, workorder),
						location: generateLocation(client),
						start: workorder.scheduling.start,
						end: workorder.scheduling.end,
						attendees: generateAttendees(techs, workorder),
						eventId: workorder.calendarId
					}, function(err, result) {
						callback(err);
					});
				},
				function(callback) {
					if (!notify)
						return callback(null);


					var description = generateDescription(client, workorder, createdBy, modifiedBy, techs);
					var techDescription = appendNotes(description, client, workorder);

					var to = req.body.emails;
					var techTo = generateToLine(techs);

					var subject = 'Workorder updated: ' + workorder.biomedId;

					async.waterfall([
						function(cb) {
							if (to && to.length > 0) {
								var msg = {
									text: description,
									from: config.email.user,
									to: to,
									subject: subject
								};
								console.log(msg);
								server.send(msg, function(err, message) { cb(err); });
							} else {
								cb();
							}
						},
						function(cb) {
							if (techTo) {
								var msg = {
									text: techDescription,
									from: config.email.user,
									to: techTo,
									subject: subject
								};
								console.log(msg);
								server.send(msg, function(err, message) { cb(err); });
							} else {
								cb();
							}
						}
					], callback);
				},
				function(callback) {
					workorder.save(function(err) {
						callback(err);
					})
				}
			],
			function(err) {
				if (err)
					log.error("Error: %s", err);

				res.json(workorder);
			});
		},

		destroy: function(req, res, next) {
			var id = req.param('workorder_id');

			log.info("workorders.destroy %s", id);

			return Workorder.findById(id, function(err, workorder) {
				workorder.deleted = true;

				return workorder.save(function(err) {
					if (!err) {
						calendar.deleteEvent(workorder.calendarId, function(err) {
							return res.json(workorder);
						});
					} else {
						log.warn("Error: %s", err);
						return res.json(workorder);
					}
				})
			});
		}
	};
};


function generateSummary(client) {
	return client.name + ' (' + client.identifier + ')';
}

function generateLocation(client) {
	var data = {
		street1: client.address.street1 || '',
		street2: client.address.street2 || '',
		city: client.address.city || '',
		state: client.address.state || '',
		zip: client.address.zip || ''		
	};

	return sprintf("%(street1)s %(street2)s %(city)s, %(state)s. %(zip)s", data);
}

function appendNotes(message, client, workorder) {
	var template =
		"%(message)s\n" +
		"Tech Notes:\n" +
		"	%(notes)s\n" +
		"\n" +
		"Alternative Contact:\n" +
		"	%(alternativeContact)s\n" +
		"\n";

	if (client.notes && client.notes['tech']) {
		var resources = {
			message: message || '',
			notes: client.notes['tech'] || '',
			alternativeContact: workorder.alternativeContact || ''
		};

		return sprintf(template, resources);
	} else {
		return message;
	}

}

function generateDescription(client, workorder, createdBy, modifiedBy) {
	var template = 
		"Workorder ID:\n" +
		"	%(biomedId)s\n" +
		"\n" +
		"Scheduled Time:\n" +
		"	%(scheduleStart)s - %(scheduleEnd)s\n" +
		"\n" +
		"Created By:\n" +
                "	%(createdBy)s\n" +
 		"\n" +
		"Last Edited By:\n" +
		"	%(modifiedBy)s\n" +
		"\n" +
		"Customer:\n" +
		"	%(name)s (%(identifier)s)\n" +
		"\n" +
		"Contact:\n" +
		"	%(contact)s\n" +
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

	var format = "MMMM Do YYYY, h:mm a"

	var scheduleStart = moment(workorder.scheduling.start).format(format);
	var scheduleEnd = moment(workorder.scheduling.end).format(format);

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
		scheduleStart: scheduleStart,
		scheduleEnd: scheduleEnd,
		phone: '',
		contact: '',
		createdBy: '',
		modifiedBy: '',
	};

	if (client.contacts[0]) {
		resources.phone = client.contacts[0].phone || '';
		resources.contact = client.contacts[0].name || '';
	}

	if (createdBy) {
		resources.createdBy = createdBy.name.first + " " + createdBy.name.last;
	}

	if (modifiedBy) {
		resources.modifiedBy = modifiedBy.name.first + " " + modifiedBy.name.last;
	}

	return sprintf(template, resources);
}

function generateAttendees(techs, workorder) {
	return techs.map(function(t) { return t.email; }).concat(workorder.emails);
}

function generateToLine(techs) {
	if (!techs) {
		return null;
	}

	var result = '';
	for (var i in techs) {
		var tech = techs[i]

		if (i > 0) {
			result += ", ";
		}

		result += tech.name.first + " " + tech.name.last + " <" + tech.email + ">"
	}	
	return result;
}
