
var mongoose = require('mongoose'),
	moment = require('moment'),
	Workorder = mongoose.model('Workorder');

exports.index = function(req, res) {

	var start, end;


	if (req.query.start && req.query.end) {
		start = moment(req.query.start).toDate();
		end = moment(req.query.end).toDate();
	} else {
		var date = moment(req.query.date);
		start = date.clone().startOf('day').toDate();
		end = date.clone().endOf('day').toDate();
	}

	var tech = req.query.tech;

	var query = {
		deleted: false,
		'scheduling.start': { '$lte': end },
		'scheduling.end': { '$gte': start }
	};

	if (tech) {
		query['techs'] = tech;
	}


	Workorder
		.find(query)
		.populate('techs', 'name')
		.populate('client', 'name identifier address')
		.select('scheduling techs client')
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(results);
			}	
		});
};
