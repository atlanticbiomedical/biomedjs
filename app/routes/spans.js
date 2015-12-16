"use strict";

const moment = require('moment-timezone');
const _ = require('lodash');

/**
 * GET /api/spans
 */
function index(req, res) {
  req.check('user').optional().isMongoId();
  req.check('workorder').optional().isMongoId();
  req.check('date').optional().isISO8601();
  req.check('week').optional().isISO8601();

  if (!req.query.user && !req.query.workorder) {
    return res.json({
      error: {
        message: 'Must specify a type filter.'
      }
    });
  }

  if (req.query.user && !req.query.date && !req.query.week) {
    return res.json({
      error: {
        message: 'Must specify a date filter.'
      }
    });
  }

  const query = {};

  if (req.query.user) {
    query.user = req.query.user;
  }

  if (req.query.workorder) {
    query.workorder = req.query.workorder;
  }

  if (req.query.date) {
    const date = moment(req.query.date);

    const startOfDay = date.clone().startOf('day');
    const endOfDay = date.clone().endOf('day');

    query.start = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  if (req.query.week) {
    const week = moment(req.query.week);

    const startOfWeek = week.clone().startOf('week');
    const endOfWeek = week.clone().endOf('week');

    query.start = {
      $gte: startOfWeek,
      $lte: endOfWeek
    };
  }

  var results = req.db.TimeClockSpan
    .find(query)
    .sort('start')
    .exec();

  res.promise(results);
}

/**
 * POST /api/spans/:user_id
 */
function update(req, res) {
  req.check('id').isMongoId();

  var data = req.body;
  delete data._id;
  delete data.__v;

  const result = req.db.TimeClockSpan
    .findById(req.params.id)
    .exec()
    .then((entity) => {
      _.assign(entity, data);
      return entity.save();
    });

  res.promise(result);
}

module.exports = {
  index,
  update
};
