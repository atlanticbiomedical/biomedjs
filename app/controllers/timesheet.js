"use strict";

var mongoose = require('mongoose');
var moment = require('moment-timezone');
var _ = require('lodash');
var Promise = require('bluebird');
var TimeClockSpan = mongoose.model('TimeClockSpan');
var Workorder = mongoose.model('Workorder');
var TimeSheet = mongoose.model('TimeSheet');
var User = mongoose.model('User');
var db = require('./db');

const NON_BILLABLE_WORKORDER_TYPES = [
  'shop', 'break', 'pto', 'meeting', 'event', 'weather'
];

const PAYROLL_WORKORDER_TYPE_MAP = {
  'office': 'office',
  'anesthesia': 'anesthesia',
  'biomed': 'biomed',
  'bsp': 'bsp',
  'ice': 'ice',
  'imaging': 'other',
  'sales': 'sales',
  'sterile-processing': 'sterilizer',
  'depot': 'depot',
  'trace-gas': 'other',
  'room-air-exchange': 'other',
  'isolation-panels': 'electric',
  'ups-systems': 'electric',
  'relocation': 'other',
  'ice-maker': 'other',
  'waste-management-system': 'other',
  'medgas': 'other',
  'staffing': 'other',
  'ert': 'electric',
  'shop': 'non-billable',
  'break': 'non-billable',
  'pto': 'non-billable',
  'meeting': 'non-billable',
  'event': 'non-billable',
  'weather': 'non-billable',
  'legacy': 'legacy'
};


function findUserDaysWorked(id) {
  var query = {
    user: id,
    type: 'workday',
    status: 'closed'
  };

  return TimeClockSpan
    .find(query).exec()
    .then((records) => _.chain(records).reduce(accumulateDaysWorked, {}).values())
}

function accumulateDaysWorked(result, record) {
  const date = moment(record.start).local().startOf('day').format('YYYY-MM-DD');

  if (!result[date]) {
    result[date] = {
      date: date,
      duration: 0
    };
  }

  if (record.duration) {
    result[date].duration += record.duration;
  }

  return result;
}

function responseHandler(res) {
  return function (data) {
    res.json(data);
  };
}

function errorHandler(res) {
  return function (error) {
    if (typeof error === 'string') {
      res.json(400, {
        error: {
          message: error
        }
      });
    } else {
      console.error(error.stack);
      res.json(500, 'Internal error');
    }
  };
}

function validateUserId(req) {
  const id = req.param('user_id');
  if (!id) {
    return Promise.reject("Parameter missing 'user_id'");
  }

  return Promise.resolve(id);
}

function validateWeek(req) {
  let week = req.param('week');

  if (!week) {
    return Promise.reject("Parameter 'week' is required.");
  }

  week = moment(week, 'YYYY-MM-DD');
  if (!week.isValid()) {
    return Promise.reject("Parameter 'week' is not a valid date.")
  }

  if (week.weekday() !== 0) {
    return Promise.reject("Parameter 'week' does not start at the beginning of the week (Sunday).");
  }

  // Return as string.
  return Promise.resolve(week);
}

function summaryHandler(params) {
  const spans = findAllSpansForWeek(params.week);
  spans.then(console.log);

  return buildReport(spans, params.week);
}

function userSummaryHandler(params) {
  const spans = findUserSpansForWeek(params.id, params.week);

  return buildReport(spans, params.week);
}

function buildReport(spans, week) {
  const workordersById = spans
    .then(extractIds('workorder'))
    .then(findWorkordersById)
    .then(indexById);

  const userIds = spans
    .then(extractIds('user'));

  const usersById = userIds
    .then(findUsersById)
    .then(indexById);

  const timesheetsByUser = userIds
    .then(findTimesheetsByUser(week))
    .then(indexByUser);

  return Promise.join(spans, workordersById, usersById, timesheetsByUser, generateSummary);
}

function generateSummary(spans, workordersById, usersById, timesheetsByUser) {
  var results = {};

  function fetchOrCreateUserRecord(userId) {
    var record = results[userId];
    if (!record) {
      var user = usersById[userId];
      var timesheet = timesheetsByUser[userId];

      record = results[userId] = {
        user: {
          _id: user._id,
          name: user.name
        },
        hasOpenSpans: false,
        approved: !!(timesheet && timesheet.approved),
        workorders: {},
        spans: {},
        clockedTime: 0,
        workedTime: 0,
        accountingByWorkorder: {},
        accountingByWorkorderType: {},
        accountingByPayroll: {},
        accountingByNonBillable: {},
      };
    }
    return record;
  }

  function addWorkorder(user, workorder) {
    if (!user.workorders[workorder.id]) {
      user.workorders[workorder.id] = {
        _id: workorder._id,
        client: workorder.client,
        biomedId: workorder.biomedId,
        reason: workorder.reason
      }
    }
  }

  function logTime(collection, key, duration) {
    if (!collection[key]) {
      collection[key] = {
        type: key,
        duration: duration
      }
    } else {
      collection[key].duration += duration;
    }
  }

  _.forEach(spans, (span) => {
    var user = fetchOrCreateUserRecord(span.user);

    user.spans[span._id] = span.toObject();
    delete user.spans[span._id].__v;
    delete user.spans[span._id].user;

    if (span.type === 'workorder') {
      var workorder = workordersById[span.workorder];
      addWorkorder(user, workorder);
    }

    if (span.status !== 'closed') {
      user.hasOpenSpans = true;
      return;
    }

    if (span.type === 'workday') {
      user.clockedTime += span.duration;
    }

    if (span.type === 'workorder') {
      user.workedTime += span.duration;

      var workorder = workordersById[span.workorder];
      var workorderType = workorder.workorderType;

      // If workorder is actually a non-billable (Stupid), treat it as such...
      if (NON_BILLABLE_WORKORDER_TYPES.indexOf(workorderType) > -1) {
        logTime(user.accountingByNonBillable, workorderType, span.duration);
      } else {
        logTime(user.accountingByWorkorderType, workorderType, span.duration);
        logTime(user.accountingByPayroll, PAYROLL_WORKORDER_TYPE_MAP[workorderType], span.duration);
        logTime(user.accountingByWorkorder, span.workorder, span.duration);
      }
    }

    if (span.type === 'nonBillable') {
      user.workedTime += span.duration;

      logTime(user.accountingByNonBillable, span.reason, span.duration);
    }
  });

  _.forEach(results, (user) => {
    user.travelTime = Math.max(0, user.clockedTime - user.workedTime);

    user.spans = _.values(user.spans);

    user.accountingByWorkorder = _.values(user.accountingByWorkorder);
    user.accountingByWorkorderType = _.values(user.accountingByWorkorderType);
    user.accountingByPayroll = _.values(user.accountingByPayroll);
    user.accountingByNonBillable = _.values(user.accountingByNonBillable);
  });

  return _.values(results);
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

function indexByUser(data) {
  return _.indexBy(data, 'user')
}

function findWorkordersById(ids) {
  const query = {
    _id: {
      $in: ids
    }
  };

  return Workorder
    .find(query)
    .populate('client', 'name identifier')
    .exec();
}

function findUsersById(ids) {
  const query = {
    _id: {
      $in: ids
    }
  };

  return User.find(query).exec();
}

function findTimesheetsByUser(week) {
  return ids => {
    const query = {
      user: {
        $in: ids
      },
      week: week
    };

    return TimeSheet.find(query).exec();
  }
}

function findAllSpansForWeek(week) {
  console.log(week.format());
  var startOfWeek = week.clone().startOf('week');
  var endOfWeek = week.clone().endOf('week');

  console.log(`Finding spans between ${startOfWeek.format()} and ${endOfWeek.format()}`);

  var query = {
    start: {
      '$gte': startOfWeek.toDate(),
      '$lte': endOfWeek.toDate()
    }
  };

  return TimeClockSpan.find(query).exec();
}

function findUserSpansForWeek(id, week) {
  var startOfWeek = week.clone().startOf('week');
  var endOfWeek = week.clone().endOf('week');

  console.log(`Finding spans between ${startOfWeek.format()} and ${endOfWeek.format()}`);

  var query = {
    start: {
      '$gte': startOfWeek.toDate(),
      '$lte': endOfWeek.toDate()
    },
    user: id
  };

  return TimeClockSpan.find(query).exec();
}

function approvalHandler(req, res) {
  return (params) => {
    params.week = params.week.toDate();

    var query = {
      user: params.id,
      week: params.week
    };

    req.db.TimeSheet.findOne(query)
      .then(timesheet => {

        if (!timesheet) {
          timesheet = new req.db.TimeSheet({
            user: params.id,
            week: params.week
          });
        }

        timesheet.approved = true;
        timesheet.approvedOn = new Date();

        res.promise(timesheet.save());
      });
  };
}

module.exports = function () {
  return {
    daysWorked: function (req, res) {
      req.check('user_id').notEmpty().isMongoId();

      var errors = req.validationErrors();
      if (errors) {
        return res.json(400, errors);
      }

      var params = {
        id: req.param('user_id')
      };

      findUserDaysWorked(params.id)
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

    summary: function (req, res) {
      Promise
        .props({
          week: validateWeek(req)
        })
        .then(summaryHandler)
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

    userSummary: function (req, res) {
      Promise
        .props({
          id: validateUserId(req),
          week: validateWeek(req)
        })
        .then(userSummaryHandler)
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },
    approve: function(req, res) {
      Promise
        .props({
          id: validateUserId(req),
          week: validateWeek(req)
        })
        .then(approvalHandler(req, res))
        .catch(errorHandler(res));
    }
  }
};
