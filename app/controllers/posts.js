
var mongoose = require('mongoose'),
	Post = mongoose.model('Post');

var md5 = require('MD5');
var fs = require('fs');

var log = require('log4node');

exports.index = function(req, res) {
	log.info('posts.index');
	var query = Post.find()
		.populate('author', 'name')
		.sort('-createdOn')
		.exec(function(err, results) {
			if (err) {
				res.json(500, err);
			} else {
				res.json(results);
			}
		});
};

exports.get = function(req, res, next) {
	var id = req.param('post_id');
	Post.findById(id)
		.exec(function(err, post) {
			if (err) return next(err);
			if (!post) return next(new Error('Failed to load post ' + id));

			res.json(post);
		});
};

exports.create = function(req, res, next) {
	log.info('posts.create %j', req.body);

	var post = new Post({
		title: 		req.body.title,
		preview:	req.body.preview,
		details:	req.body.details,
		image:		req.body.image,
		gallery:	req.body.gallery,
		status:		req.body.status,
		createdOn:	req.body.createdOn,
		postedOn:	req.body.postedOn,
		author:		req.user
	});

	return post.save(function(err) {
		if (err) log.error("Error: %s", err);

		return res.json(post);
	});
};

exports.update = function(req, res, next) {
	var id = req.param('post_id');

	console.log('updating post');
	
	return Post.findById(id, function(err, post) {
		post.title	= req.body.title;
		post.preview	= req.body.preview;
		post.details	= req.body.details;
		post.image	= req.body.image;
		post.gallery	= req.body.gallery;
		post.status	= req.body.status;
		post.postedOn	= req.body.postedOn;

		return post.save(function(err) {
			if (err)
				log.error("Error: %s", err);

			return res.json(post);
		});
	});
};

exports.destroy = function(req, res, next) {
	var id = req.param('post_id');
	log.info('posts.destroy %s', id);

	return Post.findById(id, function(err, post) {
		post.deleted = true;

		return post.save(function(err) {
			if (err)
				log.error("Error: %s", err);

			return res.json(post);
		});
	});
};

exports.upload = function(req, res, next) {
	var path = req.files.file.path;

	fs.readFile(path, function(err, data) {
		var hash = md5(data);

		fs.writeFile('/srv/biomed-site/images/' + hash, data, function(err) {
			if (err)
				log.error("Error: %s", err);

			return res.json({
				filename: hash
			});
		});
	});
};
