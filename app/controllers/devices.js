var mongoose = require('mongoose'),
    Device = mongoose.model('Device');

var _ = require('lodash');
var md5 = require('MD5');

var log = require('log4node');

exports.index = function(req, res) {
	log.info('devices.index');
	var query = Device.find({ deleted: false })
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(results);
			}
		});
};

exports.get = function(req, res, next) {
	var id = req.param('device_id');

	log.info("devices.get %s", id);
	Device.findById(id)
		.exec(function(err, device) {
			if (err) return next(err);
			if (!device) return next(new Error('failed to load device ' + id));

			res.json(device);
		});
};

exports.deviceTypes = function(req, res, next) {
	log.info("devices.deviceTypes");

	var query = Device.find({ deleted: false })
		.select('deviceType')
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(_.uniq(_.pluck(results, 'deviceType')));
			}
		});
};

exports.makes = function(req, res, next) {
        log.info("devices.makes");

        var query = Device.find({ deleted: false })
                .select('make')
                .exec(function(err, results) {
                        if (err) {
                                res.json(500, err);
                        } else {
                                res.json(_.uniq(_.pluck(results, 'make')));
                        }
                });
};

exports.models = function(req, res, next) {
        log.info("devices.models");

        var query = Device.find({ deleted: false })
                .select('model')
                .exec(function(err, results) {
                        if (err) {
                                res.json(500, err);
                        } else {
                                res.json(_.uniq(_.pluck(results, 'model')));
                        }
                });
};

exports.create = function(req, res, next) {
	log.info("devices.create %j", res.body);

	var device = new Device({
		deviceType: req.body.deviceType,
		make: req.body.make,
		model: req.body.model,
		technicalData: req.body.technicalData,
		links: req.body.links,
		partsRecommended: req.body.partsRecommended,
		images: req.body.images
	});

	return device.save(function(err) {
		if (err)
			log.error("Error: %s", err);
		return res.json(device);
	});
};

exports.update = function(req, res, next) {
	var id = req.param('device_id');
	log.info('devices.update %s %j', id, req.body);

	return Device.findById(id, function(err, device) {
		device.deviceType = req.body.deviceType;
		device.make = req.body.make;
		device.model = req.body.model;
		device.technicalData = req.body.technicalData;
		device.links = req.body.links;
		device.partsRecommended = req.body.partsRecommended;
		device.images = req.body.images;

		return device.save(function(err) {
			if (err)
				log.error("Error: %s", err);
			return res.json(device);
		});
	});
};

exports.upload = function(req, res, next) {
       	var path = req.files.file.path;

       	fs.readFile(path, function(err, data) {
               	var hash = md5(data);

                fs.writeFile('/srv/biomed-site/images/devices/' + hash, data, function(err) {
                       	if (err)
                               	log.error("Error: %s", err);

                       	return res.json({
                               	filename: hash
                       	});
               	});
        });
};
