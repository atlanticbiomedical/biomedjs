
var mongoose = require('mongoose'),
	moment = require('moment'),
	Workorder = mongoose.model('Workorder');

exports.index = function(req, res) {
	var date = moment(req.query.date);
	var start = date.clone().startOf('day').toDate();
	var end = date.clone().endOf('day').toDate();

	Workorder
		.find({
			deleted: false,
			'scheduling.start': { '$gte': start, '$lt': end }
		})
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
