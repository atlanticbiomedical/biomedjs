"use strict";

const moment = require('moment-timezone');
const _ = require('lodash');

/**
 * GET /api/exceptions
 */
function index(req, res) {
  req.check('user').isMongoId();
  req.check('date').optional().isISO8601();
  req.check('week').optional().isISO8601();

  if (!req.query.date && !req.query.week) {
    return res.json({
      error: {
        message: 'Must specify a date filter.'
      }
    });
  }

  const query = {
    user: req.query.user
  };

  if (req.query.date) {
    const date = moment(req.query.date);

    const startOfDay = date.clone().startOf('day');
    const endOfDay = date.clone().endOf('day');

    query.date = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  if (req.query.week) {
    const week = moment(req.query.week);

    const startOfWeek = week.clone().startOf('week');
    const endOfWeek = week.clone().endOf('week');

    query.date = {
      $gte: startOfWeek,
      $lte: endOfWeek
    };
  }

  var results = req.db.TimeClockException
    .find(query)
    .sort('date')
    .exec();

  res.promise(results);
}

module.exports = {
  index
};
