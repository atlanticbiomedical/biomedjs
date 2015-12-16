var mongoose = require('mongoose')
Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var workorderSchema = new Schema({
  biomedId: Number,
  client: {type: ObjectId, ref: 'Client'},
  emails: [String],
  createdOn: Date,
  createdBy: {type: ObjectId, ref: 'User'},
  modifiedBy: {type: ObjectId, ref: 'User'},
  reason: String,
  maintenanceType: String,
  remarks: String,
  status: String,
  scheduling: {
    start: Date,
    end: Date
  },
  calendarId: String,
  techs: [{type: ObjectId, ref: 'User'}],
  history: [{
    oldValues: {},
    newValues: {},
    modifiedBy: {type: ObjectId, ref: 'User'}
  }],
  deleted: {type: Boolean, default: false},
  invoiceNumber: String,
  invoicedTime: String,
  invoicedOn: Date,
  checkNumber: String,
  paidOn: Date,
  alternativeContact: String,
  trackingNumber: String,
  devices: [{type: ObjectId, ref: 'Device'}],
  workorderType: {
    type: String,
    enum: [
      'office',
      'anesthesia',
      'biomed',
      'bsp',
      'ice',
      'imaging',
      'sales',
      'sterile-processing',
      'depot',
      'trace-gas',
      'room-air-exchange',
      'isolation-panels',
      'ups-systems',
      'relocation',
      'ice-maker',
      'waste-management-system',
      'medgas',
      'staffing',
      'ert',
      'shop',
      'break',
      'pto',
      'meeting',
      'event',
      'weather',
      'legacy'
    ],
    default: 'legacy'
  },
});

module.exports = mongoose.model('Workorder', workorderSchema);
