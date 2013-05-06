module.exports = {
	development: {
		root: require('path').normalize(__dirname + '/..'),
		debug: true,
		database: 'mongodb://biomed.akira.gs/biomed_devel2',
		auth: {
			clientId: '223145213165.apps.googleusercontent.com',
			clientSecret: '8MRNar9E_pRTOGTQonPzYOW_',
			callback: 'http://devel.portal.atlanticbiomedical.com/auth/callback',
			accessToken: 'ya29.AHES6ZR-vUVEh7CZzsEeGFSHqFfXtU1-LHyEAidi0CKhDGQ',
			refreshToken: '1/exRXjTaGNlWEo-HZZWyn4NTwJ4TY3wKb-_npce21c50',
		},
		email: {
			user: 'api@atlanticbiomedical.com',
			password: 'success4'
		},
		mysql: {
			host: 'biomed.akira.gs',
			user: 'biomed_prod',
			password: 'wUw3RB8rrXX4HwKj',
			database: 'biomed_prod',
		}
	},
	prod: {
		root: require('path').normalize(__dirname + '/..'),
		debug: true,
		database: 'mongodb://localhost/biomed_prod',
		auth: {
			clientId: '333768673996-8epedo3je5h59n4l97v4dv8nofs7qnee.apps.googleusercontent.com',
			clientSecret: 'afu9KhKxckWJ3Tk6uxzp9Pg6',
			callback: 'http://portal.atlanticbiomedical.com/auth/callback',
			accessToken: 'ya29.AHES6ZT1Sj1vpgidR2I_ksLdlV_VeZUjkitnZ01cP6VRrknjUEVbuw',
			refreshToken: '1/XQW9P9FNYm6jikTsV8HOIuPAo1APYhwTH5CLhq9263g'
		},
		email: {
			user: 'api@atlanticbiomedical.com',
			password: 'success4',
		},
		mysql: {
			host: 'localhost',
			user: 'biomed_prod',
			password: 'wUw3RB8rrXX4HwKj',
			database: 'biomed_prod'
		}
	}
};
