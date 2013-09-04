
var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Workorder = mongoose.model('Workorder'),
	Tag = mongoose.model('Tag');

var frequencies = ["annual","semi","quarterly","sterilizer","tg","ert","rae","medgas","imaging","neptune","anesthesia"];

exports.index = function(req, res) {
	var query = Client.find({ deleted: false })
		.select('name identifier')
		.slice('contacts', 1)
		.sort('name')
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(results);
			}
		});
}

exports.get = function(req, res, next) {
	var id = req.param('client_id');

	Client.findById(id)
		.exec(function(err, client) {
			if (err) return next(err);
			if (!client) return next(new Error('Failed to load client ' + id));

			res.json(client);
		});
}

exports.frequencies = function(req, res, next) {
	var query = Client.find({ deleted: false })
		.select('name identifier frequencies')
		.slice('contacts', 1)
		.sort('name')
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(results);
			}
		});
};

exports.workorders = function(req, res, next) {
	var id = req.param('client_id');
	Workorder.find({ client: id, deleted: false })
		.populate({path: 'techs', select: 'name'})
		.sort('-scheduling.start')
		.exec(function(err, workorders) {
		if (err) return next(err);
		if (!workorders) return next(new Error('Failed to load workorders ' + id));

		res.json(workorders);
	});
};

exports.tags = function(req, res, next) {
	var id = req.param('client_id');

	Tag.find({ client: id })
		.exec(function(err, tags) {
			if (err) return next(err);
			if (!tags) return next(new Error('Failed to load tags ' + id));

			res.json(tags);
		});
};

exports.create = function(req, res, next) {
	console.log(req.body);

	var client = new Client({
		name: req.body.name,
		identifier: req.body.identifier,
		contacts: req.body.contacts,
		address: req.body.address,
		frequencies: {}
	});

	var freq = {};

	for (key in frequencies) {
		client.frequencies[frequencies[key]] = [false, false, false, false, false, false, false, false, false, false, false, false];
	}

	return client.save(function(err) {
		if (!err) {
			console.log("saved");
		} else {
			console.log("error");
		}

		return res.json(client);
	})
};

exports.update = function(req, res, next) {
	var id = req.param('client_id');

	return Client.findById(id, function(err, client) {
		client.name = req.body.name;
		client.identifier = req.body.identifier;
		client.contacts = req.body.contacts;
		client.address = req.body.address;
		client.frequencies = req.body.frequencies;

		return client.save(function(err) {
			if (!err) {
				console.log("updated");
			} else {
				console.log("error");
			}

			return res.json(client);
		});
	});
};

exports.destroy = function(req, res, next) {
	var id = req.param('client_id');

	return Client.findById(id, function(err, client) {
		client.deleted = true;

		return client.save(function(err) {
			if (!err) {
				console.log("deleted");
			} else {
				console.log("error");
			}

			return res.json(client);
		})
	});
};
