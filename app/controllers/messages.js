
var mongoose = require('mongoose'),
	email = require('emailjs'),
	sprintf = require('sprintf').sprintf,
	User = mongoose.model('User');

module.exports = function(config) {
	var server = email.server.connect({
		user: config.email.user,
		password: config.email.password,
		host: 'smtp.gmail.com',
		ssl: true
	});

	return {
		send: function(req, res) {			
			console.log(req.body);

			var userId = req.body.user;
			if (!userId) {
				return res.json(404, null);
			}

			console.log("Sending message");
			User.findById(userId, function(err, user) {
				if (err) return res.json(500, err);

				server.send({
						text: generateMessage(user, req.body),
						from: config.email.user,
						to: generateToLine(user),
						subject: 'Message from portal'
					}, function(err, message) {
						console.log(err || message);
						if (err) {
							res.json(500, err);
						} else {
							res.json(null);
						}
					});
			});
		}
	};
}

function generateToLine(user) {
	return user.name.first + " " + user.name.last + " <" + user.email + ">";
}

function generateMessage(user, message) {
	var template =
		"Message For: %(user)s\n" +
		"\n" +
		"Name: %(name)s\n" +
		"Company: %(company)s\n" +
		"Phone: %(phone)s\n" +
		"Extension: %(extension)s\n" +
		"\n" +
		"%(messages)s\n" +
		"%(notes)s\n";

	var resources = {
		user: user.name.first + " " + user.name.last,
		name: message.name || '',
		company: message.company || '',
		phone: message.phone || '',
		extension: message.extension || '',
		messages: '',
		notes: message.notes || ''
	};

	message.messages.forEach(function(msg) {
		if (msg.checked) {
			resources.messages += msg.message + "\n";
		}
	});

	return sprintf(template, resources);
}
