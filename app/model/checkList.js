var mongoose = require('mongoose')
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var checkListSchema = new Schema({
  name: String,
  fields: [{}],
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('CheckList', checkListSchema);
