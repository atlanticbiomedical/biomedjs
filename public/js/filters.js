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
});

