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

	function toIsoDate(d) {
		function pad(n) { return n < 10 ? '0' + n : n }
		return d.getUTCFullYear()+'-'
		      + pad(d.getUTCMonth()+1)+'-'
		      + pad(d.getUTCDate())+'T'
		      + pad(d.getUTCHours())+':'
		      + pad(d.getUTCMinutes())+':'
		      + pad(d.getUTCSeconds())+'Z';
	}

	return {
		scheduleEvent: function(event, callback) {
			api(function(client, callback) {

				var params = {
					calendarId: 'primary',
				};

				var resource = buildResource(event, { sequence: 1 });

				var request = client.calendar.events.insert(params, resource);

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
					var resource = buildResource(event, result);
					if ('sequence' in resource) {
						resource.sequence += 1;
					} else {
						resource.sequence = 1;
					}
					
					var updateRequest = client.calendar.events.patch({
						calendarId: 'primary',
						eventId: event.eventId
					}, buildResource(event, result));

					updateRequest.withAuthClient(oauth2Client).execute(function(err, result) {
						callback(err, result);
					});
				});
			}, callback);
		},

		deleteEvent: function(eventId, callback) {
			api(function(client, callback) {
				var request = client.calendar.events.delete({
					calendarId: 'primary',
					eventId: eventId
				});
				request.withAuthClient(oauth2Client).execute(function(err, result) {
					callback(err, result);
				});
			}, callback);
		}
	};

	function buildResource(event, resource) {
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
					config.auth.accessToken = oauth2Client.credentials.access_token;
				}

				callback(err, result);
			});
		};

		if (apiClient) {
			handler(apiClient);
		} else {
			googleapis.discover('calendar', 'v3').execute(function(err, client) {
				if (err) return callback(err);
				apiClient = client;

				handler(apiClient);
			});
		}

	}
};
