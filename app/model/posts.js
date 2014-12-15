var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var postSchema = new Schema({
	title: 		{ type: String },
	preview: 	{ type: String },
	details: 	{ type: String },
	image: 		{ type: String },
	gallery: 	[{ type: String }],
	status: 	{ type: String },
	createdOn:	{ type: Date },
	postedOn:	{ type: Date },
	author:		{ type: ObjectId, ref: 'User' }
});

var Post = module.exports = mongoose.model('Post', postSchema);
