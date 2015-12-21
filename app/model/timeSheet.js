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

  week: {
    type: Date,
    required: true
  },

  approved: {
    type: Boolean,
    default: false,
    required: true
  },

  approvedOn: {
    type: Date,
    required: function() {
      return this.approved === true;
    }
  }
});

schema.pre('save', function (next) {
  if (!this.approved) {
    this.approvedOn = undefined;
  }

  next();
});

module.exports = mongoose.model('TimeSheet', schema);
