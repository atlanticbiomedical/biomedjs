var mongoose = require('mongoose')
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var workorderSchema = new Schema({
	biomedId: Number,
	client: { type: ObjectId, ref: 'Client' },
	createdOn: Date,
	createdBy: { type: ObjectId, ref: 'User' },
        modifiedBy: { type: ObjectId, ref: 'User' },
	reason: String,
	maintenanceType: String,
	remarks: String,
	status: String,
	scheduling: {
		start: Date,
		end: Date
	},
	calendarId: String,
	techs: [{ type: ObjectId, ref: 'User' }],
	history: [{
		oldValues: {},
		newValues: {},
		modifiedBy: { type: ObjectId, ref: 'User' }
	}],
	deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Workorder', workorderSchema);
