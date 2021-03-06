var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var clientSchema = new Schema({
	name: String,
	identifier: String,
	address: {
		street1: String,
		street2: String,
		city: String,
		state: String,
		zip: String
	},
	contacts: [{
		name: String,
		phone: String,
		email: String
	}],
	frequencies: {},
	pms: {},
	workorders: [{ type: ObjectId, ref: 'Workorder' }],
	deleted: { type: Boolean, default: false },
	notes: {
		internal: String,
		tech: String
	}
});

module.exports = mongoose.model('Client', clientSchema);
