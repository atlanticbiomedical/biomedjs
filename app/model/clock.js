var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var clockSchema = new Schema({
	_id: String,
	tech: { type: ObjectId, ref: 'User' },
	dt: Date,
	action: String,
	lat: Number,
	long: Number
}, { versionKey: false })

var Clock = module.exports = mongoose.model('Clock', clockSchema);
