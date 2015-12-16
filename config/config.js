module.exports = {
	prod: {
		root: require('path').normalize(__dirname + '/..'),
		debug: true,
		database: 'mongodb://localhost/biomed',
		auth: {
			clientId: '333768673996-8epedo3je5h59n4l97v4dv8nofs7qnee.apps.googleusercontent.com',
			clientSecret: 'afu9KhKxckWJ3Tk6uxzp9Pg6',
			callback: 'http://localhost:9000/auth/callback',
			accessToken: 'ya29.1.AADtN_Xjt0PK6YVs8q5csiQFXQg2ZDtrVhsH6P4a5zm0mHqhGx0Nnjx4Jk68Gw',
			refreshToken: '1/_5SkDLYmsi4XNaQyAzld-W5-GEqEqt5byH6VkI-j5QI',
			jwtSecret: '97v4dvcsiQFXQg28nofedo3jemsi4XNaQy5h59n4l97m0mHqhGx0Nnjxv4dv8n'
		},
		email: {
			user: 'api@atlanticbiomedical.com',
			password: 'success4',

      partsRequest: 'akirayasha@gmail.com',
      exception: 'akirayasha@gmail.com'
		},
		mysql: {
			host: 'localhost',
			user: 'biomed_prod',
			password: 'wUw3RB8rrXX4HwKj',
			database: 'biomed_prod'
		}
	}
};
