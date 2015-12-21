'use strict';

const mongoose = require('mongoose');
const models = [
  'CheckList',
  'Client',
  'Counter',
  'Device',
  'DeviceType',
  'Pm',
  'Post',
  'Tag',
  'TestRun',
  'TimeClockException',
  'TimeClockSpan',
  'TimeSheet',
  'User',
  'Workorder'
];

module.exports = function() {
  return function(req, res, next) {
    req.db = {};

    models.forEach((model) => {
      req.db[model] = mongoose.model(model);
    });

    next();
  }
};
