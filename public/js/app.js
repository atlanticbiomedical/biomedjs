var biomed = {};

angular.module('biomed', ['biomed.filters', 'biomed.services', 'biomed.directives', 'ngResource', 'ui.bootstrap.dialog'])
	.run(function($rootScope) {
		$rootScope.TECH_GROUPS = {
			all: 'All',
			biomed: 'Biomed',
			ice: 'ICE',
			sales: 'Sales',
			other: 'Others'
		};
	})
	.config(function($routeProvider, $locationProvider, $httpProvider) {

		var JSON_START = /^\s*(\[|\{[^\{])/,
		  	JSON_END = /[\}\]]\s*$/,
		  	PROTECTION_PREFIX = /^\)\]\}',?\n/,
			DATE_MATCHER = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

		$httpProvider.defaults.transformResponse = [function(data) {
			if (angular.isString(data)) {
				data = data.replace(PROTECTION_PREFIX, '');
		        if (JSON_START.test(data) && JSON_END.test(data)) {
		        	data = JSON.parse(data, function(key, val) {
		        		if (DATE_MATCHER.test(val)) {
		        			return new moment(val).zone(-5).toDate();
					}
		        		return val;
		        	})
		        }

		        return data;
			}
		}];

		$locationProvider.html5Mode(true);
		$routeProvider
			.when('/schedule', {
				templateUrl: '/partials/schedule/index.html',
				controller: biomed.ScheduleIndexCtrl
			})
			.when('/schedule/pms', {
				templateUrl: '/partials/schedule/pms.html',
				controller: biomed.SchedulePmsCtrl
			})
			.when('/clients', {
				templateUrl: '/partials/clients/index.html',
				controller: biomed.ClientIndexCtrl,
				reloadOnSearch: false
			})
			.when('/clients/add', {
				templateUrl: '/partials/clients/add.html',
				controller: biomed.ClientAddCtrl
			})
			.when('/clients/:id', {
				templateUrl: '/partials/clients/edit.html',
				controller: biomed.ClientEditCtrl
			})
			.when('/workorders', {
				templateUrl: '/partials/workorders/index.html',
				controller: biomed.WorkorderIndexCtrl,
				reloadOnSearch: false
			})
			.when('/workorders/add', {
				templateUrl: '/partials/workorders/add.html',
				controller: biomed.WorkorderAddCtrl
			})
			.when('/workorders/:id', {
				templateUrl: '/partials/workorders/edit.html',
				controller: biomed.WorkorderEditCtrl
			})
			.when('/techs/:id', {
				templateUrl: '/partials/techs/schedule.html',
				controller: biomed.TechScheduleCtrl
			})
			.when('/admin', {
				templateUrl: '/partials/users/index.html',
				controller: biomed.UsersIndexCtrl,
				reloadOnSearch: false
			})
			.when('/admin/users/:id', {
				templateUrl: '/partials/users/clock.html',
				controller: biomed.UserClockCtrl
			})
			.otherwise({
				redirectTo: '/schedule'
			});
	});
