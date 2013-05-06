var googleapis = require('googleapis'),
	sprintf = require('sprintf'),
	OAuth2Client = googleapis.OAuth2Client;


module.exports = function(config) {

	var oauth2Client = new OAuth2Client(
		config.auth.clientId, config.auth.clientSecret, config.auth.callback);

	oauth2Client.credentials = {
		access_token: config.auth.accessToken,
		refresh_token: config.auth.refreshToken
	};

	var opts = { baseDiscoveryUrl: 'https://www.googleapis.com/discovery/v1/apis/' };


	return {
		scheduleEvent: function(event, callback) {
			console.log("schedule event");
		
			api(function(client, callback) {

				var resource = buildResource(event);

				var request = client.calendar.events.insert({
					calendarId: 'primary',
					resource: resource
				});

				request.withAuthClient(oauth2Client).execute(function(err, result) {
					callback(err, result);
				});
			}, callback);
		},

		updateEvent: function(event, callback) {
			api(function(client, callback) {

				var resource = buildResource(event);

				var request = client.calendar.events.update({
					calendarId: 'primary',
					eventId: event.eventId,
					resource: resource
				});

				request.withAuthClient(oauth2Client).execute(function(err, result) {
					callback(err, result);
				});
			}, callback);
		}
	};

	function buildResource(event) {
		var resource = {
			summary: event.summary,
			description: event.description,
			location: event.location,
			start: {
				dateTime: event.start
			},
			end: {
				dateTime: event.end
			},
			attendees: []
		};

		event.attendees.forEach(function(attendee) {
			resource.attendees.push({
				email: attendee
			});
		})

		return resource;
	}

	function api(workorder, callback) {
		googleapis
			.discover('calendar', 'v3')
			.execute(function(err, client) {
				if (err) return callback(err);

				workorder(client, function(err, result) {
					if (oauth2Client.credentials.access_token != config.auth.accessToken) {
						console.log("Updating access token");
						config.auth.accessToken = oauth2Client.credentials.access_token;
					}

					callback(err, result);
				});
			});
	}

};
