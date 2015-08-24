var mongoose = require('mongoose'),
    Device = mongoose.model('Device'),
    TestRun = mongoose.model('TestRun');

var _ = require('lodash');
var md5 = require('MD5');

var log = require('log4node');

exports.index = function(req, res, next) {
  log.info('devices.index');
  
  var query = {
    deleted: false
  };

  var deviceType = req.param('deviceType');
  if (deviceType) {
    query.deviceType = deviceType;
  }

  Device.find(query)
    .populate('deviceType', 'category make model')
    .populate('client', 'name identifier')
    .exec(returnResult(res));
};

exports.get = function(req, res, next) {
  var id = req.param('device_id');

  log.info("devices.get %s", id);

  Device.findById(id)
    .populate('deviceType', 'category make model checkList')
    .populate('client', 'name identifier')
    .exec(returnResult(res));
};

exports.testRuns = function(req, res, next) {
  var id = req.param('device_id');
  log.info("devices.testRuns %s", id);

  TestRun.find({device: id, deleted: false })
    .exec(function(err, devices) {
      if (err) return next(err);
      if (!devices) return next(new Error('Failed to load testRuns ' + id));

      res.json(devices);
    });  
}

exports.create = function(req, res, next) {
  log.info("devices.create %j", res.body);

  var device = new Device(req.body);
  device.save(returnResult(res));
};

exports.update = function(req, res, next) {
  var id = req.param('device_id');
  log.info('devices.update %s %j', id, req.body);

  Device.findById(id, function(err, device) {
    if (err) {
      log.error("Error: %s", err);
      res.json(500, err);
    } else if (!device) {
      res.json(404, 'Unknown Device: %s', id);
    } else {
      _.assign(device, req.body);
      device.save(returnResult(res, device));
    }
  });
};

exports.isUnique = function(req, res, next) {  
  var field = req.param('field');
  var value = req.param('value');
  var key = req.param('key');

  if (!field || !value) {
    return res.json(400, 'missing field or value');   
  }

  var query = {};
  query[field] = value;

  if (key) {
    query['_id'] = { $ne: key };
  }

  Device.find(query)
    .exec(function(err, result) {
      if (err) return next(err);
      res.json({
        isUnique: result.length === 0
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