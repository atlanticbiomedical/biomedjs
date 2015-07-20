var mongoose = require('mongoose')
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var deviceSchema = new Schema({
	deviceType: String,
	make: String,
	model: String,
	technicalData: String,
	links: String,
	partsRecommended: String,
	images: [{ type: String }],
        deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Device', deviceSchema);
