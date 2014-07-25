
var mongoose = require('mongoose'),
	async = require('async'),
	User = mongoose.model('User');

var log = require('log4node');

module.exports = function(config, directory) {

	function fetch_all_users(callback) {
		async.parallel({
			gapps: directory.listUsers,
			local: function(callback) {
				User.find({ deleted: false }).select('name email groups perms deleted').exec(callback);
			}
		}, callback);
	}

	function map_local_users(data, results) {
		return function(callback) {
			async.each(data, function(item, callback) {
				var key = item.email.toLowerCase();

				if (blacklist.indexOf(key) == -1)
					results[key] = item;

				callback();
			},
			callback);
		};
	}

	function map_gapps_users(data, results) {
		return function(callback) {
			async.each(data, function(item, callback) {
				var key = item.primaryEmail.toLowerCase();

				// Ignore if blacklisted
				if (blacklist.indexOf(key) != -1) return callback();

				if (!(key in results))
					results[key] = {
						email: item.primaryEmail,
						deleted: false,
						perms: [ ],
						groups: [ ],
						name: {
							first: item.name.givenName,
							last: item.name.familyName
						},
					};

				callback();
			},
			callback);
		};
	}

	function reduce_array(data, results) {
		return function(callback) {
			for (var item in data) {
				results.push(data[item]);
			}

			results.sort(function(a, b) {
				var result = a.name.first.toLowerCase().localeCompare(b.name.first.toLowerCase());
				if (result == 0)
					result = a.name.last.toLowerCase().localeCompare(b.name.last.toLowerCase());

				return result;					
			});

			callback();
		};
	}

	function merge_sources(data, callback) {
		var map = {};
		var reduce = [];

		async.series([
			map_local_users(data.local, map),
			map_gapps_users(data.gapps.users, map),
			reduce_array(map, reduce),
		],
		function(err) {
			callback(err, reduce);
		});
	}

        return {
		index: function(req, res) {
			var criteria = { deleted: false };

			if (req.query.group) {
				criteria.groups =  req.query.group;
			}

			if (req.query.perms) {
				criteria.perms = req.query.perms;
			}

			if (req.query.userid) {
				criteria._id = req.query.userid;
			}

			var query = User.find(criteria)
				.select('name groups')
				.exec(function(err, results) {
					if (err) {
						res.json(500, err);
					} else {
						res.json(results);
					}
				});
		},

		details: function(req, res) {

			async.waterfall([
				fetch_all_users,
				merge_sources,
			],
			function(err, results) {
				if (err) return res.json(500, err);
				res.json(results);
			});
		},

		create: function(req, res) {
			log.info("users.create %j", req.body);

			var user = new User({
				email: req.body.email,
				name: req.body.name,
				groups: req.body.groups,
				perms: req.body.perms,
				deleted: false
			});

			return user.save(function(err) {
				if (err)
					log.error("Error: %s", err);

				return res.json(user);
			});
		},

		update: function(req, res) {
			var id = req.param('user_id');
			log.info("users.update %s %j", id, req.body);

			return User.findById(id, function(err, user) {
				user.email = req.body.email;
				user.name = req.body.name;
				user.groups = req.body.groups;
				user.perms = req.body.perms;

				return user.save(function(err) {
					if (err)
						log.err("Error: %s", err);

					return res.json(user);
				});
			});
		}
	};
};

var blacklist = [
	"system@atlanticbiomedical.com",
	"admin@atlanticbiomedical.com",
	"amazons3@atlanticbiomedical.com",
	"api@atlanticbiomedical.com",
	"biodexservice@atlanticbiomedical.com",
	"cerberusapp@atlanticbiomedical.com",
	"chattservice@atlanticbiomedical.com",
	"dropbox@atlanticbiomedical.com",
	"inquiries@atlanticbiomedical.com",
	"office@atlanticbiomedical.com",
	"parts@atlanticbiomedical.com",
	"schedule@atlanticbiomedical.com",
	"webapp@atlanticbiomedical.com",
	"banfieldservice@atlanticbiomedical.com",
	"chris.sewell@atlanticbiomedical.com",
	"devel@atlanticbiomedical.com",
	"dobie@atlanticbiomedical.com",
	"akirayasha@gmail.com",
	"receipts@atlanticbiomedical.com",
];
