'use strict';

const mongoose = require('mongoose');

module.exports = function() {
  return function(req, res, next) {
    res.promise = (promise) => {
      promise
        .then((data) => {
          res.json({
            data
          });
        })
        .catch((error) => {
          if (typeof error === 'string') {
            return res.json(400, {
              error: {
                message: error
              }
            });
          }

          if (error.name === 'ValidationError') {
            return res.json(400, {
              error: error
            });
          }

          console.log(error.stack);
          res.json(500, 'Internal error');
        });
    };

    next();
  };
};
