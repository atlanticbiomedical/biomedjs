
'use strict';

var moment = require('moment');
var expressValidator = require('express-validator');

module.exports = function() {
  return expressValidator({
    customValidators: {
      isWeek
    },
    customSanitizers: {
      toMoment
    }
  });
};

function isWeek(str) {
  let week = moment(str, 'YYYY-MM-DD');
  return week.isValid() && week.weekday() === 0;
}

function toMoment(str) {
  return moment(str);
}