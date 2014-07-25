angular.module('biomed.filters', [])
.filter('techs', function() {
	return function(techs) {
		if (!techs) return techs;

		return techs.map(function(tech) {
			return tech.name.first + ' ' + tech.name.last;
		}).join(', ');
	};
})
.filter('time', function() {
	return function(time) {
		return moment(time).format('h:mma');
	};
})
.filter('email', function() {
	return function(email) {
		var parts = email.split("@", 2);
		if (parts[1].toLowerCase() == "atlanticbiomedical.com")
			return parts[0] + "@";
		else
			return email;
	}
});
