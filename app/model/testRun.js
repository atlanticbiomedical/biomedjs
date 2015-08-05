var mongoose = require('mongoose')
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var testRunSchema = new Schema({
  device: { type: ObjectId, ref: 'Device' },
  fields: [{}],
  date: Date,
  result: Boolean,
  comment: String,
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('TestRun', testRunSchema);
