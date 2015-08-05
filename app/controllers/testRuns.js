var mongoose = require('mongoose'),
    TestRun = mongoose.model('TestRun');

var _ = require('lodash');
var md5 = require('MD5');

var log = require('log4node');

exports.index = function(req, res, next) {
  log.info('test_runs.index');
  
  TestRun.find({ deleted: false })
    .exec(returnResult(res));
};

exports.get = function(req, res, next) {
  var id = req.param('test_run_id');

  log.info("test_runs.get %s", id);

  TestRun.findById(id)
    .exec(returnResult(res));
};

exports.create = function(req, res, next) {
  log.info("test_runs.create %j", res.body);

  var testRun = new TestRun(req.body);
  testRun.save(returnResult(res));
};

exports.update = function(req, res, next) {
  var id = req.param('test_run_id');
  log.info('test_runs.update %s %j', id, req.body);

  TestRun.findById(id, function(err, testRun) {
    if (err) {
      log.error("Error: %s", err);
      res.json(500, err);
    } else if (!testRun) {
      res.json(404, 'Unknown TestRun: %s', id);
    } else {
      _.assign(testRun, req.body);
      testRun.save(returnResult(res, testRun));
    }
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