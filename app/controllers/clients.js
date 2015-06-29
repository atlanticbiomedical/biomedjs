
var mongoose = require('mongoose'),
	Client = mongoose.model('Client'),
	Workorder = mongoose.model('Workorder'),
	Tag = mongoose.model('Tag');

var log = require('log4node');

var frequencies = ["Medical Device","Sterilizer - TT","Vaporizer","Ice Maker","Anesthesia","Waste Management System","Imaging","Medical Gas Systems","RAE","ERT","N2O Trace Gas","Sterilizer - F","Quarterly","Semi","Annual","legacy","DLLR", "Isolation Panel", "Battery Backup", "Sterilizer - Cleaning"];

exports.index = function(req, res) {
	log.info("clients.index");
	var query = Client.find({ deleted: false })
		.select('name identifier address')
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

	log.info("clients.get %s", id);
	Client.findById(id)
		.exec(function(err, client) {
			if (err) return next(err);
			if (!client) return next(new Error('Failed to load client ' + id));

			res.json(client);
		});
}

exports.frequencies = function(req, res, next) {
	log.info("clients.frequencies");

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
	log.info("clients.workorders %s", id);

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
	log.info("clients.tags %s", id);

	Tag.find({ client: id })
		.exec(function(err, tags) {
			if (err) return next(err);
			if (!tags) return next(new Error('Failed to load tags ' + id));

			res.json(tags);
		});
};

exports.create = function(req, res, next) {
	log.info("clients.create %j", req.body);

	var client = new Client({
		name: req.body.name,
		identifier: req.body.identifier.toUpperCase(),
		contacts: req.body.contacts,
		address: req.body.address,
		notes: req.body.notes,
		frequencies: {}
	});

	var freq = {};

	for (key in frequencies) {
		client.frequencies[frequencies[key]] = [false, false, false, false, false, false, false, false, false, false, false, false];
	}

	return client.save(function(err) {
		if (err)
			log.error("Error: %s", err);

		return res.json(client);
	})
};

exports.isUnique = function(req, res, next) {
	
	var field = req.param('field');
	var value = req.param('value');
	var key = req.param('key');

	if (!field || !value) {
		return res.json(400, 'missing field or value');		
	}

	var query = {};
	
	if (field === 'identifier') {
		query[field] = value.toUpperCase();
	} else {
		query[field] = value;
	}

	if (key) {
		query['_id'] = { $ne: key };
	}

	Client.find(query)
		.exec(function(err, result) {
			if (err) return next(err);
			res.json({
				isUnique: result.length === 0
			});
		});
};

exports.update = function(req, res, next) {
	var id = req.param('client_id');
	log.info("clients.update %s %j", id, req.body);

	return Client.findById(id, function(err, client) {
		client.name = req.body.name;
		client.identifier = req.body.identifier.toUpperCase();
		client.contacts = req.body.contacts;
		client.address = req.body.address;
		client.frequencies = req.body.frequencies;
		client.notes = req.body.notes;

		return client.save(function(err) {
			if (err)
				log.error("Error: %s", err);

			return res.json(client);
		});
	});
};

exports.destroy = function(req, res, next) {
	var id = req.param('client_id');

	log.info("clients.destroy %s", id);

	return Client.findById(id, function(err, client) {
		client.deleted = true;

		return client.save(function(err) {
			if (err)
				log.error("Error: %s", err);

			return res.json(client);
		})
	});
};
