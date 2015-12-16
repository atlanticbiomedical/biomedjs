var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var userSchema = new Schema({
	name: {
		first: String,
		last: String
	},
	email: String,
	picture: String,
	refreshToken: String,
	accessToken: String,
	groups: [String],
	perms: [String],

  employmentType: {
    type: String,
    enum: ['hourly', 'salary'],
    default: 'hourly',
    required: true
  },

  unpaidTravel: {
    type: Number,
    default: 0,
    required: true
  },

	deleted: {
    type: Boolean,
    default: false
  }
});

userSchema.methods.hasPermission = function(perm) {
	return this.perms.indexOf(perm) != -1;
}

var User = module.exports = mongoose.model('User', userSchema);
