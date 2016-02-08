
var mongoose = require('mongoose'),
	Post = mongoose.model('Post');

var md5 = require('MD5');
var fs = require('fs');
var markdown = require('markdown').markdown;
var log = require('log4node');

exports.index = function(req, res) {
	var criteria = {};
	var page = req.param('page');
	if (page) {
		criteria = { pages: page };
	}

	log.info('posts.index');
	var query = Post.find(criteria)
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

function renderHtml(input) {
	if (input) {
		try {
			return markdown.toHTML(input);
		} catch (err) {
			return input;
		}
	} else {
		return input;
	}
}

function cleanTags(tags) {
        if (!tags) {
                return [];
        }

        if (!Array.isArray(tags)) {
                tags = [tags];
        }

        var results = [];

        for (var i = 0; i < tags.length; i++) {
                var tag = tags[i].toString()
                        .replace(/^#/, '')
                        .replace(/(\W|\d)/g, '$1 ')
                        .replace(/\b\w+/g, function(txt) {
                                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                        })
                        .replace(/\s/g, '')

                if (tag) {
                        results.push(tag);
                }
        }

        return results;
}

exports.create = function(req, res, next) {
	log.info('posts.create %j', req.body);

	var post = new Post({
		title: 		req.body.title,
		preview:	req.body.preview,
		previewHtml:	renderHtml(req.body.preview),
		details:	req.body.details,
		detailsHtml:	renderHtml(req.body.details),
		image:		req.body.image,
		gallery:	req.body.gallery,
		status:		req.body.status,
		createdOn:	req.body.createdOn,
		postedOn:	req.body.postedOn,
		author:		req.user,
		pages:		req.body.pages,
		tags:		cleanTags(req.body.tags),
	});

	return post.save(function(err) {
		if (err) log.error("Error: %s", err);

		return res.json(post);
	});
};

exports.update = function(req, res, next) {
	var id = req.param('post_id');

	return Post.findById(id, function(err, post) {
		post.title		= req.body.title;
		post.preview		= req.body.preview;
		post.previewHtml	= renderHtml(req.body.preview);
		post.details		= req.body.details;
		post.detailsHtml	= renderHtml(req.body.details);
		post.image		= req.body.image;
		post.gallery		= req.body.gallery;
		post.status		= req.body.status;
		post.postedOn		= req.body.postedOn;
		post.pages		= req.body.pages;
		post.tags		= cleanTags(req.body.tags);

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

		fs.writeFile('/opt/biomed-site/images/' + hash, data, function(err) {
			if (err)
				log.error("Error: %s", err);

			return res.json({
				filename: hash
			});
		});
	});
};
