
var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Workorder = mongoose.model('Workorder');

var log = require('log4node');
var Promise = require('bluebird');
var _ = require('lodash');

exports.index = function(req, res) {
	log.info("pms.index");

	var month = req.param('month');
	var type = req.param('type');
	var frequency = req.param('frequency');

	year = 2015;
	if (month == "")
		month = undefined;

	var results;

	switch(type) {
		case 'all':
			results = allPipeline(year, month, frequency);
			break;

		case 'due':
			results = duePipeline(year, month, frequency);
			break;

		case 'overdue':
			results = overduePipeline(year, month, frequency);
			break;

		case 'scheduled':
			results = scheduledPipeline(year, month, frequency);
			break;

		case 'complete':
			results = completePipeline(year, month, frequency);
			break;
	}

	if (results) {
		results.then(function(result) {
			res.json(result);
		});
	} else {
		res.json(400, "bad request");
	}
};

function allPipeline(year, month, frequency) {
	var clients = getClients().then(filterClientsByFrequency(month, frequency));
	var pms = getPmsByDate(year, month);

	return Promise.join(clients, pms, joinData(false, frequency));
}

function duePipeline(year, month, frequency) {
	var clients = getClients().then(filterClientsByFrequency(month, frequency));
	var pms = getPmsByDate(year, month);

	return Promise.join(clients, pms, joinData(true, frequency));
}

function overduePipeline(year, month, frequency) {

	if (month !== undefined) {
		month -= 1;
		if (month < 0) {
			month = 11;
			year -= 1;
		}
	}

	return duePipeline(year, month, frequency);
}

function scheduledPipeline(year, month, frequency) {
	var clients = getClients().then(filterClientsByFrequency(month, frequency));
	var pms = getPmsByDate(year, month);

	return Promise.join(clients, pms, joinData(false, frequency, 'scheduled'));
}

function completePipeline(year, month, frequency) {
	var clients = getClients().then(filterClientsByFrequency(month, frequency));
	var pms = getPmsByDate(year, month);

	return Promise.join(clients, pms, joinData(false, frequency, 'paid'));
}

function getPmsByDate(year, month) {

	var pipeline = [];

	if (month !== undefined) {
		pipeline = [
			{ $match: {
				reason: "Preventive Maintenance",
				maintenanceType: { $exists: true, $ne: "" },
				deleted: { $ne: true }
			}},
			{ $group: {
				_id: {
					year: { $year: "$scheduling.start" },
					month: { $month: "$scheduling.start" },
					client: "$client",
					frequency: "$maintenanceType"
				},
				workorders: { $push: { id: "$_id", identifier: "$biomedId", status: "$status" }}
			}},
			{ $group: {
				_id: {
					year: "$_id.year",
					month: "$_id.month",
					client: "$_id.client",
				},
				frequencies: { $push: { frequency: "$_id.frequency", workorders: "$workorders" } }
			}},
			{ $group: {
				_id: {
					year: "$_id.year",
					month: "$_id.month",
				},
				clients: { $push: { client: "$_id.client", frequencies: "$frequencies" } }
			}},
			{ $match: {
				"_id.year": parseInt(year),
				"_id.month": parseInt(month) + 1
			}}
		];
	} else {
		pipeline = [
			{ $match: {
				reason: "Preventive Maintenance",
				maintenanceType: { $exists: true, $ne: "" },
				deleted: { $ne: true }
			}},
			{ $group: {
				_id: {
					client: "$client",
					frequency: "$maintenanceType"
				},
				workorders: { $push: { id: "$_id", identifier: "$biomedId", status: "$status" }}
			}},
			{ $group: {
				_id: {
					client: "$_id.client",
				},
				frequencies: { $push: { frequency: "$_id.frequency", workorders: "$workorders" } }
			}},
		];
	}

	return Workorder.aggregate(pipeline)
    .exec()
		.then(function(pmsData) {
			var data = {};

			if (month !== undefined) {
				if (pmsData.length > 0) {
					pmsData[0].clients.forEach(function(entry) {
						data[entry.client] = {};
						entry.frequencies.forEach(function(frequency) {
							data[entry.client][frequency.frequency] = frequency.workorders;
						});
					});
				}
			} else {
				pmsData.forEach(function(entry) {
					data[entry._id.client] = {};
					entry.frequencies.forEach(function(frequency) {
						data[entry._id.client][frequency.frequency] = frequency.workorders;
					});
				});	
			}

			return data;
		});
}

function getClients() {
	return Client
    .find({ deleted: false })
		.lean()
		.select('name identifier frequencies')
		.slice('contacts', 1)
		.sort('name')
		.exec();
}

function filterClientsByFrequency(month, frequency) {
	return function(clients) {
		var results = [];
		
		clients.forEach(function(client) {
			var enabledFrequencies = [];
			var reasons = [];

			Object.keys(client.frequencies).forEach(function(frequencyName) {
				var monthData = client.frequencies[frequencyName];

				if (month ? monthData[month] : _.some(monthData, Boolean)) {
					if (!frequency || frequency == frequencyName) {
						enabledFrequencies.push(frequencyName);
					}
				}
			});
			if (enabledFrequencies.length > 0) {
				client.frequencies = enabledFrequencies;
				results.push(client);
			}
		});

		return results;
	}
}

function joinData(showOnlyDue, frequency, status) {
	return function(clients, pms) {
		var results = [];

		clients.forEach(function(client) {
			var id = client._id;

			if (pms[id]) {
				client.frequencies = _.difference(client.frequencies, Object.keys(pms[id]));
				client.workorders = _.transform(pms[id], function(result, workorders, key) {
					workorders = _.filter(workorders, function(workorder) {
						return !status || workorder.status == status;
					});

					if (workorders.length > 0 && (!frequency || frequency == key)) {
						result[key] = workorders;
					}
				});
			}

			if (_.isEmpty(client.workorders)) {
				delete client.workorders;
			}

			var includeForFrequencies = !_.isEmpty(client.frequencies) || !showOnlyDue;
			var includeForStatus = !_.isEmpty(client.workorders) || !status;

			if (includeForFrequencies && includeForStatus) {
				results.push(client);
			}
		});

		return results;
	}
}
