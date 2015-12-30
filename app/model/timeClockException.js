"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

const EXCEPTION_REASONS = [
  'late_to_first_workorder',
  'too_little_travel',
  'too_much_travel',
  'less_than_twenty_hours_worked',
  'less_than_thirty_hours_worked',
  'greater_than_forty_hours_worked'
];

var schema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    enum: EXCEPTION_REASONS,
    required: true
  }
});

module.exports = mongoose.model('TimeClockException', schema);
