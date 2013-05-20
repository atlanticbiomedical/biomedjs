var googleapis = require('googleapis'),
	sprintf = require('sprintf'),
	OAuth2Client = googleapis.OAuth2Client;

var apiClient;

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

				var resource = buildResource(event, {});
				console.log("Insert Google Calendar");
				console.log(resource);

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

				var getRequest = client.calendar.events.get({
					calendarId: 'primary',
					eventId: event.eventId
				});
				
				getRequest.withAuthClient(oauth2Client).execute(function(err, result) {
					console.log("get result");
					console.log(err);
					console.log(result);

					var resource = buildResource(event, result);
					if ('sequence' in resource) {
						resource.sequence += 1;
					} else {
						resource.sequence = 1;
					}
					
					var updateRequest = client.calendar.events.update({
						calendarId: 'primary',
						eventId: event.eventId,
						resource: buildResource(event, result)
					});

					updateRequest.withAuthClient(oauth2Client).execute(function(err, result) {
						callback(err, result);
					});
				});
			}, callback);
		}
	};

	function buildResource(event, resource) {
		console.log(event.start);
		console.log(event.end);

		resource.summary = event.summary;
		resource.description = event.description;
		resource.location = event.location;
		resource.start = { dateTime: event.start };
		resource.end = { dateTime: event.end };
		resource.attendees = [];

		event.attendees.forEach(function(attendee) {
			resource.attendees.push({
				email: attendee
			});
		})

		return resource;
	}

	function api(workorder, callback) {
		var handler = function(client) {
			workorder(client, function(err, result) {
				if (oauth2Client.credentials.access_token != config.auth.accessToken) {
					console.log("Updating access token");
					config.auth.accessToken = oauth2Client.credentials.access_token;
				}

				callback(err, result);
			});
		};

		console.log(apiClient);
		if (apiClient) {
			console.log("Using cached api client");
			handler(apiClient);
		} else {
			console.log("Getting api client");
			googleapis.discover('calendar', 'v3').execute(function(err, client) {
				if (err) return callback(err);
				apiClient = client;

				handler(apiClient);
			});
		}

	}
};
