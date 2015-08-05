var mongoose = require('mongoose'),
    CheckList = mongoose.model('CheckList');

var _ = require('lodash');
var md5 = require('MD5');

var log = require('log4node');

exports.index = function(req, res, next) {
  log.info('check_lists.index');
  
  CheckList.find({ deleted: false })
    .exec(returnResult(res));
};

exports.get = function(req, res, next) {
  var id = req.param('check_list_id');

  log.info("check_lists.get %s", id);

  CheckList.findById(id)
    .exec(returnResult(res));
};

exports.create = function(req, res, next) {
  log.info("check_lists.create %j", res.body);

  var checkList = new CheckList(req.body);
  checkList.save(returnResult(res));
};

exports.update = function(req, res, next) {
  var id = req.param('check_list_id');
  log.info('check_lists.update %s %j', id, req.body);

  CheckList.findById(id, function(err, checkList) {
    if (err) {
      log.error("Error: %s", err);
      res.json(500, err);
    } else if (!checkList) {
      res.json(404, 'Unknown CheckList: %s', id);
    } else {
      _.assign(checkList, req.body);
      checkList.save(returnResult(res, checkList));
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