var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var counterSchema = new Schema({
	name: String,
	seq: { type: Number, default: 0 }
});

counterSchema.index({ field: 1, model: 1 }, { unique: true, required: true, index: -1 });

module.exports = mongoose.model('Counter', counterSchema);