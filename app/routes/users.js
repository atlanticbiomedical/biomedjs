"use strict";

const Promise = require('bluebird');
const moment = require('moment-timezone');
const _ = require('lodash');

function filterFields(user) {
  const obj = user.toObject();
  delete obj.accessToken;
  delete obj.refreshToken;
  return obj
}


/**
 * GET /api/users/:id
 */
function fetch(req, res) {
  let result;

  if (req.params.id === 'me') {
    result = Promise.resolve(req.user);
  } else {
    result = req.db.User.findById(req.params.id);
  }

  res.promise(result.then(filterFields));
}

/**
 * POST /api/users/:id
 */
function update(req, res) {
  req.check('id').isMongoId();

  var data = req.body;
  delete data._id;
  delete data.__v;
  delete data.name;
  delete data.email;
  delete data.accessToken;
  delete data.refreshToken;
  delete data.deleted;

  const result = req.db.User
    .findById(req.params.id)
    .exec()
    .then((entity) => {
      _.assign(entity, data);
      return entity.save();
    })
    .then(filterFields);

  res.promise(result);
}

/**
 * GET /api/users/:id/daysWorked
 */
function daysWorked(req, res) {
  const id = req.params.id === 'me' ? req.user.id : req.params.id;

  const query = {
    user: id,
    type: 'workday'
  };

  const result = req.db.TimeClockSpan
    .find(query)
    .exec()
    .then((records) => _.chain(records).reduce(accumulateDaysWorked, []).values());

  res.promise(result);
}

/**
 * GET /api/users/:id/weeksWorked
 */
function weeksWorked(req, res) {
  const id = req.params.id === 'me' ? req.user.id : req.params.id;

  const query = {
    user: id,
    type: 'workday'
  };

  const result = req.db.TimeClockSpan
    .find(query)
    .exec()
    .then((records) => _.chain(records).reduce(accumulateWeeksWorked, []).values());

  res.promise(result);
}

/**
 * GET /api/users/:id/timeClock
 */
function timeClock(req, res) {
  const id = req.params.id === 'me' ? req.user.id : req.params.id;
  const date = moment(req.query.date);
  const startOfDay = date.clone().startOf('day');
  const endOfDay = date.clone().endOf('day');

  var spans = req.db.TimeClockSpan
    .find({
      user: id,
      start: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .sort({ start: 1 })
    .exec();

  var exceptions = req.db.TimeClockException
    .find({
      user: id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .exec();

  var workorders = spans
    .then(extractIds('workorder'))
    .then((ids) => {
      return req.db.Workorder
        .find({
          _id: {
            $in: ids
          }
        })
        .populate('client', 'name identifier')
        .exec();
    })
    .then(indexById);

  res.promise(Promise.props({
    spans,
    exceptions,
    workorders
  }));
}

function accumulateDaysWorked(result, record) {
  const date = moment(record.start).local().startOf('day').format('YYYY-MM-DD');

  if (result.indexOf(date) === -1) {
    result.push(date);
  }

  return result;
}

function accumulateWeeksWorked(result, record) {
  const date = moment(record.start).local().startOf('week').format('YYYY-MM-DD');

  if (result.indexOf(date) === -1) {
    result.push(date);
  }

  return result;
}

function extractIds(field) {
  return (data) => _(data)
    .pluck(field)
    .reject(_.isUndefined)
    .uniq((id) => id.toString())
    .value();
}

function indexById(data) {
  return _.indexBy(data, 'id')
}

module.exports = {
  fetch,
  update,
  daysWorked,
  weeksWorked,
  timeClock
};
