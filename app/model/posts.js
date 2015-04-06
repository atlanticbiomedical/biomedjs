var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var postSchema = new Schema({
	title: 		{ type: String },
	preview: 	{ type: String },
	previewHtml:	{ type: String },
	details: 	{ type: String },
	detailsHtml:	{ type: String },
	image: 		{ type: String },
	gallery: 	[{ type: String }],
	status: 	{ type: String },
	createdOn:	{ type: Date },
	postedOn:	{ type: Date },
	author:		{ type: ObjectId, ref: 'User' },
	tags:		[{ type: String }],
	pages:		[{ type: String }]
});

var Post = module.exports = mongoose.model('Post', postSchema);
