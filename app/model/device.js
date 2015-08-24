var mongoose = require('mongoose')
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var deviceSchema = new Schema({
  client: { type: ObjectId, ref: 'Client' },
  deviceType: { type: ObjectId, ref: 'DeviceType' },

  biomedId: String,
  serialNumber: String,
  purchaseDate: Date,
  warrantyExpiration: Date,
  location: String,
  frequencyType: String,
  frequencySchedule: [],
  lastTestRun: {},
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Device', deviceSchema);
