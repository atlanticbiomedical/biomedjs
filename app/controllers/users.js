
var mongoose = require('mongoose'),
	User = mongoose.model('User');

exports.index = function(req, res) {
	var criteria = { deleted: false };

	if (req.query.group) {
		criteria.groups =  req.query.group;
	}

	if (req.query.perms) {
		criteria.perms = req.query.perms;
	}

	var query = User.find(criteria)
		.select('name groups')
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(results);
			}
		});
};
