
var mongoose = require('mongoose');

exports.profile = function(req, res) {
	res.json(req.user);
};
