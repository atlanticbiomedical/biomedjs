var mongoose = require('mongoose'),
    DeviceType = mongoose.model('DeviceType');

var _ = require('lodash');
var md5 = require('MD5');

var log = require('log4node');

exports.index = function(req, res, next) {
  log.info('device_types.index');
  
  DeviceType.find({ deleted: false })
    .exec(returnResult(res));
};

exports.get = function(req, res, next) {
  var id = req.param('device_type_id');

  log.info("device_types.get %s", id);

  DeviceType.findById(id)
    .exec(returnResult(res));
};

exports.categories = function(req, res, next) {
  log.info("device_types.categories");

  DeviceType.find({ deleted: false })
    .select('category')
    .exec(mutateResult(res, function(data) {
      return _.uniq(_.pluck(data, 'category'));
    }));
};

exports.makes = function(req, res, next) {
  log.info("device_types.makes");

  DeviceType.find({ deleted: false })
    .select('make')
    .exec(mutateResult(res, function(data) {
      return _.uniq(_.pluck(data, 'make'));
    }));
};

exports.models = function(req, res, next) {
  log.info("device_types.models");

  DeviceType.find({ deleted: false })
    .select('model')
    .exec(mutateResult(res, function(data) {
      return _.uniq(_.pluck(data, 'model'));
    }));
};

exports.create = function(req, res, next) {
  log.info("device_types.create %j", res.body);

  var deviceType = new DeviceType(req.body);
  deviceType.save(returnResult(res));
};

exports.update = function(req, res, next) {
  var id = req.param('device_type_id');
  log.info('device_types.update %s %j', id, req.body);

  DeviceType.findById(id, function(err, deviceType) {
    if (err) {
      log.error("Error: %s", err);
      res.json(500, err);
    } else if (!deviceType) {
      res.json(404, 'Unknown DeviceType: %s', id);
    } else {
      _.assign(deviceType, req.body);
      deviceType.save(returnResult(res, deviceType));
    }
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

function returnResult(res, result) {
  return function(err, data) {
    if (err) {
      log.error("Error: %s", err);
      res.json(500, err);
    } else {
      if (result) {
        res.json(result);
      } else {
        res.json(data);
      }
    }
  }
}

function mutateResult(res, mutator) {
  return function(err, results) {
    if (err) {
      log.error("Error: %s", err);
      res.json(500, err);
    } else {
      res.json(mutator(results));
    }
  }
}