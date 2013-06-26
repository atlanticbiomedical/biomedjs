var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var tagSchema = new Schema({
	_id: String,
	client: { type: ObjectId, ref: 'Client' },
	data: {}
}, { versionKey: false })

var Tag = module.exports = mongoose.model('Tag', tagSchema);
