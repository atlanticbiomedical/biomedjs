var mongoose = require('mongoose')
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var deviceTypeSchema = new Schema({
  category: String,
  make: String,
  model: String,
  technicalData: String,
  links: String,
  partsRecommended: String,
  images: [{ type: String }],
  checkList: { type: ObjectId, ref: 'CheckList' },
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('DeviceType', deviceTypeSchema);
