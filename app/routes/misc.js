"use strict";


const email = require('../util/email');
const moment = require('moment-timezone');
const _ = require('lodash');
var config = require('../../config/config')['prod'];

var partsRequestTemplate = email.template(
  'partsRequest.html.tmpl',
  'partsRequest.text.tmpl',
  'Parts Request',
  [
    'techName',
    'requestDate',
    'customerId',
    'customerName',
    'customerContact',
    'customerPhone',
    'biomedId',
    'manufacture',
    'model',
    'serialNumber',
    'vendor',
    'vendorPhone',
    'partNumber',
    'description',
    'specialNotes'
  ]
);


/**
 * POST /api/misc/partsRequest
 */
function partsRequest(req, res) {
  const message = {
    to: config.email.partsRequest
  };

  const defaultValues = {
    techName: `${req.user.name.first} ${req.user.name.last}`,
    requestDate: moment().format('LLLL')
  };

  const values = _.assign({}, req.body, defaultValues);

  res.promise(email.send(message, partsRequestTemplate, values));
}

module.exports = {
  partsRequest
};
