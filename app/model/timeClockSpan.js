"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var schema = new Schema({

    user: {
        type: ObjectId,
        ref: 'User'
    },

    client: {
        type: ObjectId,
        ref: 'Client'
    },

    workorder: {
        type: ObjectId,
        ref: 'Workorder'
    },

    status: {
        type: String,
        enum: ['open', 'closed']
    },

    start: {
        type: Date
    },

    end: {
        type: Date
    },

    duration: {
        type: Number,
        min: 0
    },

    type: {
        type: String,
        enum: [ 'workorder', 'workday', 'nonBillable' ]
    },

    reason: {
        type: String,
        enum: ['shop', 'break', 'pto', 'meeting', 'event', 'weather', 'holiday']
    },

    notes: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('TimeClockSpan', schema);
