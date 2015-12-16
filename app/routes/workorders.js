"use strict";

const Promise = require('bluebird');
const moment = require('moment-timezone');
const _ = require('lodash');

/**
 * GET /api/workorders/:id/timeClock
 */
function timeClock(req, res) {
  req.check('id').isMongoId();

  const id = req.params.id;

  const spans = req.db.TimeClockSpan
    .find({
      workorder: id
    })
    .exec();

  const users = spans
    .then(extractIds('user'))
    .then((ids) => {
      return req.db.User
        .find({
          _id: {
            $in: ids
          }
        })
        .select('name picture')
        .exec();
    })
    .then(indexById);

  const duration = spans
    .then((spans) => {
      let result = 0;
      spans.forEach((span) => {
        if (span.duration) {
          result += span.duration;
        }
      });
      return result;
    });

  res.promise(Promise.props({
    duration,
    spans,
    users
  }));
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
  timeClock
};
