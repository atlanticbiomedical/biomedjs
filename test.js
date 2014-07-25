var env = process.env.NODE_ENV || 'development',
	config = require('./config/config')[env];

config.auth.accessToken = "ya29.1.AADtN_Xjt0PK6YVs8q5csiQFXQg2ZDtrVhsH6P4a5zm0mHqhGx0Nnjx4Jk68Gw";
config.auth.refreshToken = "1/_5SkDLYmsi4XNaQyAzld-W5-GEqEqt5byH6VkI-j5QI";

var directory = require('./config/directory')(config);


directory.listUsers(function(err, result) { console.log(result); console.log(err); console.log('Done.'); });
