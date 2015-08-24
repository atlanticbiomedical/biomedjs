var mongoose = require('mongoose'),
    Device = mongoose.model('Device'),
    email = require('emailjs'),
    TestRun = mongoose.model('TestRun');

var _ = require('lodash');
var md5 = require('MD5');

var log = require('log4node');

module.exports = function(config) {

  function returnResult(res, result) {
    return function(err, data) {
      if (err) {
        log.error("Error: %s", err);
        res.json(500, err);
      } else {
        if (result) {
          res.json(result);
        } else {
          res.json(data);
        }
      }
    }
  }

  function mutateResult(res, mutator) {
    return function(err, results) {
      if (err) {
        log.error("Error: %s", err);
        res.json(500, err);
      } else {
        res.json(mutator(results));
      }
    }
  }

  function sendReportEmail(data) {
    Device.findById(data.device)
      .populate({path: 'deviceType'})
      .exec(function(err, device) {
        console.log(device);

        var subject = "Test run results for device: (" + device.biomedId + ") " + device.deviceType.make + " " + device.deviceType.model;

        var message = "";

        for (var i = 0; i < data.fields.length; i++) {
          var field = data.fields[i];

          message += field.label + "\n";
          if (field.type == "range") {
            message += "Passing Values: " + field.min + "-" + field.max + "\n";
            message += "Value: " + field.value + "\n";
          }        
          message += "Result: " + (field.result ? 'Passed' : 'Failed') + "\n";

          if (field.comments) {
            message += "Comments: \n";
            message += field.comments;
          }
          message += "\n\n";
        }

        message += "-- Summary --\n";
        message += "Result: " + (data.result ? 'Passed' : 'Failed') + "\n";

        if (data.comments) {
          message += "Comments: \n";
          message += data.comments;
        }

        var server = email.server.connect({
            user: config.email.user,
            password: config.email.password,
            host: 'smtp.gmail.com',
            ssl: true
        });

        var msg = {
          text: message,
          from: config.email.user,
          to: 'parts@atlanticbiomedical.com',
          subject: subject
        };
        server.send(msg);
      });
  }

  return {
    index: function(req, res, next) {
      log.info('test_runs.index');
      
      TestRun.find({ deleted: false })
        .exec(returnResult(res));
    },

    get: function(req, res, next) {
      var id = req.param('test_run_id');

      log.info("test_runs.get %s", id);

      TestRun.findById(id)
        .exec(returnResult(res));
    },

    create: function(req, res, next) {
      log.info("test_runs.create %j", res.body);

      var testRun = new TestRun(req.body);

      if (!req.body.result) {
        sendReportEmail(req.body);
      }

      testRun.save(returnResult(res));

      Device.findById(testRun.device, function(err, device) {
        if (err) {
          log.error("Failed to fetch device for testRun: %s", err);
        } else {
          device.lastTestRun = testRun;
          device.save();
        }
      });
    },

    update: function(req, res, next) {
      var id = req.param('test_run_id');
      log.info('test_runs.update %s %j', id, req.body);

      TestRun.findById(id, function(err, testRun) {
        if (err) {
          log.error("Error: %s", err);
          res.json(500, err);
        } else if (!testRun) {
          res.json(404, 'Unknown TestRun: %s', id);
        } else {
          _.assign(testRun, req.body);
          testRun.save(returnResult(res, testRun));
        }
      });
    }
  };
}

