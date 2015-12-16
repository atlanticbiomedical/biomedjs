"use strict";

var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },

  client: {
    type: ObjectId,
    ref: 'Client',
    required: function() {
      return this.type === 'workorder';
    }
  },

  workorder: {
    type: ObjectId,
    ref: 'Workorder',
    required: function() {
      return this.type === 'workorder';
    }
  },

  status: {
    type: String,
    enum: ['open', 'closed'],
    required: true
  },

  start: {
    type: Date,
    required: true
  },

  end: {
    type: Date,
    required: function() {
      return this.status === 'closed';
    }
  },

  duration: {
    type: Number,
    min: 0
  },

  type: {
    type: String,
    enum: ['workorder', 'workday', 'nonBillable'],
    required: true
  },

  reason: {
    type: String,
    enum: ['shop', 'break', 'pto', 'meeting', 'event', 'weather', 'holiday'],
    required: function() {
      return this.type === 'nonBillable';
    }
  },

  notes: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'workorder' && this.status === 'closed';
    }
  }
});

schema.pre('save', function (next) {
  if (this.status === 'open') {
    this.end = undefined;
  }

  if (this.type === 'workorder') {
    this.reason = undefined;
  }

  if (this.type !== 'workorder') {
    this.workorder = undefined;
    this.client = undefined;
  }

  if (this.start && this.end) {
    this.duration = moment(this.end).diff(this.start, 'seconds');
  }

  next();
});

schema.pre('validate', function (next) {
  if (this.start > this.end) {
    return next(new Error('End date must be greater than start date.'));
  }

  next();
});

module.exports = mongoose.model('TimeClockSpan', schema);
