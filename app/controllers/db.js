var mongoose = require('mongoose');

var TimeClockSpan = mongoose.model('TimeClockSpan');
var Workorder = mongoose.model('Workorder');

var db = {};

db.spans = {
  forWeek: function(week) {
    const startOfWeek = week.clone();
    const endOfWeek = week.clone().endOf('week');

    const query = {
      start: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    };

    return TimeClockSpan.find(query);
  },
  forWeekByUser: function(week, user) {
    const startOfWeek = week.clone();
    const endOfWeek = week.clone().endOf('week');

    const query = {
      start: {
        $gte: startOfWeek,
        $lte: endOfWeek
      },
      user: user
    };

    return TimeClockSpan.find(query);
  }
};

db.workorders = {
  findByIds: function(ids) {
    const query = {
      _id: {
        $in: ids
      }
    };

    return Workorder.find(query);
  }
};

module.exports = db;


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