var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var pmSchema = new Schema({})

var Pm = module.exports = mongoose.model('Pm', pmSchema);
