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
		listUsers: function(callback) {
			api(function(client, callback) {
				var params = {
					domain: 'atlanticbiomedical.com',
					fields: 'users(name,primaryEmail)',
				};

				var request = client.admin.users.list();
				request.params = params;
				request.withAuthClient(oauth2Client).execute(function(err, result) {
					callback(err, result);
				});
			}, callback);
		}
	};

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

		if (apiClient) {
			console.log("Using cached api client");
			handler(apiClient);
		} else {
			console.log("Getting api client");
			googleapis.discover('admin', 'directory_v1').execute(function(err, client) {
				console.log(err);

				if (err) return callback(err);
				apiClient = client;

				handler(apiClient);
			});
		}

	}
};
