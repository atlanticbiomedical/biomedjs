"use strict";

var mongoose = require('mongoose');
var moment = require('moment-timezone');
var _ = require('lodash');
var Promise = require('bluebird');
var TimeClockSpan = mongoose.model('TimeClockSpan');
var TimeClockException = mongoose.model('TimeClockException');
var Workorder = mongoose.model('Workorder');
var email = require('../util/email');
var config = require('../../config/config')['prod'];

var NON_BILLABLES = ['shop', 'break', 'pto', 'meeting', 'event', 'weather', 'holiday'];
var TASK_TYPES = ['workday', 'workorder', 'nonBillable'];

var exceptionTemplate = email.template(
  'exception.html.tmpl',
  'exception.text.tmpl',
  'Exception',
  [
    'techName',
    'date',
    'message'
  ]
);

function MultipleSpansError(spans) {
  Error.captureStackTrace(this, MultipleSpansError);

  this.name = 'MultipleSpansError';
  this.message = 'Encountered multiple spans when one was expected';
  this.spans = spans;
}
MultipleSpansError.prototype = Object.create(Error.prototype);

function findUserSpans(user, day) {
  var startOfDay = day.clone().startOf('day').toDate();
  var endOfDay = day.clone().endOf('day').toDate();

  var query = {
    start: {
      '$gte': startOfDay,
      '$lte': endOfDay
    },
    user: user
  };

  return TimeClockSpan
    .find(query)
    .exec();
}

function findUserWorkorders(user, day) {
  var startOfDay = day.clone().startOf('day').toDate();
  var endOfDay = day.clone().endOf('day').toDate();

  var query = {
    deleted: false,
    techs: user.id,
    'scheduling.start': {
      '$lte': endOfDay
    },
    'scheduling.end': {
      '$gte': startOfDay
    }
  };

  return Workorder
    .find(query)
    .populate('client', 'name identifier')
    .exec();
}

function findUserWorkorder(id, user) {
  var query = {
    _id: id,
    techs: user.id,
    deleted: false
  };

  return Workorder
    .findOne(query)
    .populate('client', 'name identifier contacts address')
    .exec();
}

function filterSpans(spans, filter) {
  filter = {
    type: filter.type ? [].concat(filter.type) : undefined,
    status: filter.status ? String(filter.status) : undefined,
    workorder: filter.workorder ? String(filter.workorder) : undefined,
    reason: filter.reason ? String(filter.reason) : undefined
  };

  return _.chain(spans)
    .filter(function (span) {

      if (filter.type && filter.type.indexOf(span.type) === -1) {
        return false;
      }

      if (filter.status && String(span.status) !== filter.status) {
        return false;
      }

      if (filter.workorder && String(span.workorder) !== filter.workorder) {
        return false;
      }

      if (filter.reason && span.reason !== filter.reason) {
        return false;
      }

      return true;
    })
    .sortBy('start')
    .value();
}

function spansStatus(spans, filter) {
  if (filter) {
    spans = filterSpans(spans, filter);
  }

  var result = 'pending';
  _.forEach(spans, function (span) {
    if (span.status === 'open') {
      result = 'clockedIn';
      return false;
    } else {
      result = 'clockedOut';
    }
  });

  return result;
}

function validateClockRequest(req) {
  return new Promise(function (resolve, reject) {

    var params = {};

    var type = req.body.type;
    if (!type) {
      return reject("Missing required parameter 'type'");
    }

    if (TASK_TYPES.indexOf(type) === -1) {
      return reject("Invalid type: '" + type + "'");
    }

    params.type = type;

    if (type === 'workorder') {
      var id = req.body.id;
      if (!id) {
        return reject("Missing required parameter 'id'");
      }

      params.id = id;
    }

    if (type === 'nonBillable') {
      var reason = req.body.reason;
      if (!reason) {
        return reject("Missing required parameter 'reason'");
      }

      if (NON_BILLABLES.indexOf(reason) === -1) {
        return reject("Invalid reason: '" + reason + "'");
      }

      params.reason = reason;
    }

    resolve(params);
  });
}

function validateWorkorderDetailsRequest(req) {
  var params = {};

  var id = req.param('id');
  if (!id) {
    return Promise.reject("Missing required parameter 'id'");
  }

  params.id = id;

  return Promise.resolve(params);
}

function handleStatusRequest(spans, workorders) {

  var results = {};

  var workdaySpans = _.filter(spans, {type: 'workday'});

  results.tasks = [];

  results.tasks = results.tasks.concat({
    type: 'workday',
    status: spansStatus(workdaySpans),
    spans: _.map(workdaySpans, spanToResponse)
  });

  results.tasks = results.tasks.concat(_.chain(workorders)
    .sortBy('scheduling.start')
    .map(function (workorder) {
      var workorderSpans = filterSpans(spans, {type: 'workorder', workorder: workorder.id});

      return {
        type: 'workorder',
        id: workorder.id,
        title: workorder.client.name,
        start: moment(workorder.scheduling.start).utc().toISOString(),
        end: moment(workorder.scheduling.end).utc().toISOString(),
        status: spansStatus(workorderSpans),
        spans: _.map(workorderSpans, spanToResponse)
      };
    })
    .value()
  );

  results.tasks = results.tasks.concat(_.chain(NON_BILLABLES)
    .map(function (nonBillable) {
      var nonBillableSpans = filterSpans(spans, {reason: nonBillable});

      return {
        type: 'nonBillable',
        reason: nonBillable,
        status: spansStatus(nonBillableSpans),
        spans: _.map(nonBillableSpans, spanToResponse)
      };
    })
    .value()
  );

  return results;
}

function handleClockInRequest(params, user, spans, workorders, now) {
  var workdayStatus = spansStatus(spans, {type: 'workday'});

  if (params.type === 'workday') {
    if (workdayStatus === 'clockedIn') {
      return Promise.reject('Already clocked in');
    }

    var span = new TimeClockSpan({
      user: user.id,
      type: 'workday',
      status: 'open',
      start: now.clone().utc().toDate()
    });

  } else {
    if (workdayStatus !== 'clockedIn') {
      return Promise.reject('Not clocked into day');
    }

    var allTasksStatus = spansStatus(spans, {type: ['workorder', 'nonBillable']});
    if (allTasksStatus === 'clockedIn') {
      return Promise.reject('Already clocked in');
    }

    if (params.type === 'workorder') {
      var workorder = _.find(workorders, {id: params.id});
      if (!workorder) {
        return Promise.reject('Invalid workorder');
      }

      handleClockInExceptions(user, workorder, spans, now);

      var span = new TimeClockSpan({
        user: user.id,
        type: 'workorder',
        status: 'open',
        start: now.clone().utc().toDate(),
        workorder: workorder.id,
        client: workorder.client.id
      });
    }

    if (params.type === 'nonBillable') {
      var span = new TimeClockSpan({
        user: user.id,
        type: 'nonBillable',
        status: 'open',
        start: now.clone().utc().toDate(),
        reason: params.reason
      });
    }
  }

  return span.save().then(spanToResponse);
}

function handleClockInExceptions(user, workorder, spans, now) {

  var closedWorkordersSpans = filterSpans(spans, {type: 'workorder', status: 'closed'});
  var isFirstWorkorder = closedWorkordersSpans.length == 0;

  if (isFirstWorkorder) {
    var start = moment(workorder.scheduling.start);
    var minutes = now.diff(start, 'minutes');

    if (minutes > 15) {

      new TimeClockException({
        user: user._id,
        date: new Date(),
        reason: 'late_to_first_workorder'
      }).save();

      reportException({
        user: user,
        workorder: workorder,
        reason: 'User is late to first workorder.'
      });
    }
  } else {
    var previousWorkorderSpan = _.last(closedWorkordersSpans);

    if (previousWorkorderSpan.workorder != workorder.id) {
      console.log(previousWorkorderSpan);

      var end = moment(previousWorkorderSpan.end);
      var minutes = now.diff(end, 'minutes');
      console.log("Time between tasks: ", minutes);

      if (minutes < 5) {
        new TimeClockException({
          user: user._id,
          date: new Date(),
          reason: 'too_little_travel'
        }).save();

        reportException({
          user: user,
          workorder: workorder,
          reason: 'User clocked in to next workorder too quickly.'
        });
      }

      if (minutes > 75) {
        new TimeClockException({
          user: user._id,
          date: new Date(),
          reason: 'too_much_travel'
        }).save();

        reportException({
          user: user,
          workorder: workorder,
          reason: 'Too much travel time detected between jobs.'
        });
      }
    }
  }
}

function reportException(exception) {

  const message = {
    to: config.email.exception
  };

  const values = {
    techName: `${exception.user.name.first} ${exception.user.name.last}`,
    date: moment().format('LLLL'),
    message: exception.reason
  };

  email.send(message, exceptionTemplate, values);

  console.log('--- EXCEPTION ---', new Date(), exception.reason);
}

function handleClockOutRequest(params, user, spans, workorders, now) {
  var workdaySpans = filterSpans(spans, {type: 'workday'});
  var workdayStatus = spansStatus(workdaySpans);

  if (workdayStatus !== 'clockedIn') {
    return Promise.reject('Not clocked in');
  }

  if (params.type === 'workday') {
    var allTasksStatus = spansStatus(spans, {type: ['workorder', 'nonBillable']});
    if (allTasksStatus === 'clockedIn') {
      return Promise.reject('Cannot clock out while tasks are still open.');
    }

    var span = ensureSingularSpan(filterSpans(workdaySpans, {status: 'open'}));
  }

  if (params.type === 'workorder') {
    var workorder = _.find(workorders, {id: params.id});
    if (!workorder) {
      return Promise.reject('Invalid workorder');
    }

    var workorderSpans = filterSpans(spans, {type: 'workorder', workorder: workorder.id});
    var workorderStatus = spansStatus(workorderSpans);

    if (workorderStatus !== 'clockedIn') {
      return Promise.reject('Not clocked in');
    }

    var span = ensureSingularSpan(filterSpans(workorderSpans, {status: 'open'}));
  }

  if (params.type === 'nonBillable') {
    var nonBillableSpans = filterSpans(spans, {type: 'nonBillable', reason: params.reason});
    var nonBillableStatus = spansStatus(nonBillableSpans);

    if (nonBillableStatus !== 'clockedIn') {
      return Promise.reject('Not clocked in');
    }

    var span = ensureSingularSpan(filterSpans(nonBillableSpans, {status: 'open'}));
  }

  span.status = 'closed';
  span.end = now.clone().utc().toDate();
  span.duration = moment(span.end).diff(span.start, 'seconds');

  return span.save().then(spanToResponse);
}

function handleWorkorderDetailsRequest(params, user, spans, workorder, today) {
  if (!workorder) {
    return Promise.reject('Invalid workorder');
  }

  var workorderSpans = filterSpans(spans, {type: 'workorder', workorder: workorder.id});
  var workorderStatus = spansStatus(workorderSpans);

  workorder = workorder.toObject();
  workorder.timeclock = {
    type: 'workorder',
    id: workorder._id,
    title: workorder.client.name,
    start: moment(workorder.scheduling.start).utc().toISOString(),
    end: moment(workorder.scheduling.end).utc().toISOString(),
    status: workorderStatus,
    spans: _.map(workorderSpans, spanToResponse),
    blocked: false
  };

  if (workorderStatus != 'clockedIn') {
    var workdayStatus = spansStatus(spans, {type: 'workday'});
    var otherSpansStatus = spansStatus(spans, {type: ['workorder', 'nonBillable']});

    if (workdayStatus != 'clockedIn' || otherSpansStatus == 'clockedIn') {
      workorder.timeclock.blocked = true;
    }
  }

  return workorder;
}

function spanToResponse(span) {
  return {
    start: span.start,
    end: span.end,
    duration: span.duration
  };
}

function ensureSingularSpan(spans) {
  if (spans.length != 1) {
    throw new MultipleSpansError(spans);
  }

  return spans[0];
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

function validateDate(req, field) {
  let date = req.param(field);

  if (!date) {
    return Promise.reject(`Parameter '${field}' is required.`);
  }

  date = moment(date, 'YYYY-MM-DD');
  if (!date.isValid()) {
    return Promise.reject(`Parameter '${field}' is not a valid date.`)
  }

  return Promise.resolve(date);
}

module.exports = function () {
  return {
    index: function (req, res) {

      //TODO: Check to make sure user has a valid timesheet.

      var today = moment();

      var spans = findUserSpans(req.user.id, today);
      var workorders = findUserWorkorders(req.user, today);

      Promise.join(spans, workorders, handleStatusRequest)
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

    clockIn: function (req, res) {

      //TODO: Check to make sure user has a valid timesheet.

      var today = moment();

      var params = validateClockRequest(req);
      var spans = findUserSpans(req.user.id, today);
      var workorders = findUserWorkorders(req.user, today);

      Promise.join(params, req.user, spans, workorders, today, handleClockInRequest)
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

    clockOut: function (req, res) {

      //TODO: Check to make sure user has a valid timesheet.

      Promise
        .props({
          id: req.user.id,
          date: moment(),
          notes: req.body.notes
        })
        .then((params) => {
          var spans = findUserSpans(req.user.id, params.date);
          var workorders = findUserWorkorders(req.user, params.date);
          return Promise.join(params, req.user, spans, workorders, params.date, handleClockOutRequest);
        })
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

    spansForUser: function (req, res) {
      Promise
        .props({
          id: validateUserId(req),
          date: validateDate(req, 'date')
        })
        .then((params) => findUserSpans(params.id, params.date))
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

    workorderDetails: function (req, res) {

      var today = moment();

      validateWorkorderDetailsRequest(req)
        .then(function (params) {
          var spans = findUserSpans(req.user, today);
          var workorder = findUserWorkorder(params.id, req.user);

          return Promise.join(params, req.user, spans, workorder, today, handleWorkorderDetailsRequest)
        })
        .then(responseHandler(res))
        .catch(errorHandler(res));
    },

  }
};
