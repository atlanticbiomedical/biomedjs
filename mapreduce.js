


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/biomed_prod');


var map_clients = function() {

	var result = {};

	for (var type in this.frequencies) {
		if (this.frequencies[type][month]) {
			result[type] = 0;
		}
	}

	if (Object.keys(result).length > 0) {
		emit(this._id, result);
	}
}

var reduce_clients = function(key, values) {
	return values;
}

var map_workorders = function() {
	if (
		this.scheduling.start >= start &&
		this.scheduling.start <= end &&
		this.reason == "Preventive Maintenance") {

		var type = this.maintenanceType || 'legacy';
		var result = {};
		result[type] = 1;

		emit(this.client,  result);
	}
}

var reduce_workorders = function(key, values) {

	var result = { }

	values.forEach(function (entry) {
		for (i in entry) {
			if (i in result) {
				result[i] += entry[i];
			} else {
				result[i] = entry[i];
			}
		}
	});

	return  result;
}


var today = new Date();
var year = today.getYear() + 1900;
var month = today.getMonth();
var start = new Date(year, month, 0);
var end = new Date(year, month + 1, 0);

console.log(start);
console.log(end);

var scope = { month: month, start: start, end: end }

var clients_command =  {
	mapreduce: "clients",
	map: map_clients.toString(),
	reduce: reduce_clients.toString(),
	scope: scope,
	out: { replace: 'pms' }
}

var workorders_command = {
	mapreduce: "workorders",
	map: map_workorders.toString(),
	reduce: reduce_workorders.toString(),
	scope: scope,
	out: { reduce: 'pms' }
}

mongoose.connection.db.executeDbCommand(clients_command, function(err, dbres) {
	if (err) throw err;

	mongoose.connection.db.executeDbCommand(workorders_command, function(err, dbres) {
		if (err) throw err;

		process.exit();
	});
});
