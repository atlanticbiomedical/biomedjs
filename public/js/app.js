var biomed = {};

angular.module('biomed', ['biomed.filters', 'biomed.services', 'biomed.directives', 'ngResource', 'ngRoute', 'ui.bootstrap.dialog'])
	.run(function($rootScope) {
		$rootScope.TECH_GROUPS = {
			all: 'All',
			biomed: 'Biomed',
			ice: 'ICE',
			sales: 'Sales',
			other: 'Others'
		};
		$rootScope.dayOfYear = moment().dayOfYear();
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
				controller: "ScheduleIndexCtrl"
			})
			.when('/schedule/pms', {
				templateUrl: '/partials/schedule/pms.html',
				controller: "SchedulePmsCtrl"
			})
			.when('/schedule/pms/report', {
				templateUrl: '/partials/schedule/report.html',
				controller: "FrequencyReportCtrl"
			})
			.when('/clients', {
				templateUrl: '/partials/clients/index.html',
				controller: "ClientIndexCtrl",
				reloadOnSearch: false
			})
			.when('/clients/add', {
				templateUrl: '/partials/clients/add.html',
				controller: "ClientAddCtrl"
			})
			.when('/clients/:id', {
				templateUrl: '/partials/clients/edit.html',
				controller: "ClientEditCtrl"
			})
			.when('/deviceTypes', {
				templateUrl: '/partials/deviceTypes/index.html',
				controller: "DeviceTypeIndexCtrl",
				reloadOnSearch: false
			})
			.when('/deviceTypes/add', {
				templateUrl: '/partials/deviceTypes/add.html',
				controller: "DeviceTypeAddCtrl"
			})
			.when('/deviceTypes/:id', {
				templateUrl: '/partials/deviceTypes/edit.html',
				controller: "DeviceTypeEditCtrl"
			})
			.when('/devices/add', {
				templateUrl: '/partials/devices/add.html',
				controller: "DeviceAddCtrl"
			})
			.when('/devices/:id', {
				templateUrl: '/partials/devices/edit.html',
				controller: "DeviceEditCtrl"
			})
			.when('/checkLists', {
				templateUrl: '/partials/checkLists/index.html',
				controller: "CheckListIndexCtrl",
				reloadOnSearch: false
			})
			.when('/checkLists/add', {
				templateUrl: '/partials/checkLists/add.html',
				controller: "CheckListAddCtrl"
			})
			.when('/checkLists/:id', {
				templateUrl: '/partials/checkLists/add.html',
				controller: "CheckListEditCtrl"
			})
			.when('/testRuns/add', {
				templateUrl: '/partials/testRuns/add.html',
				controller: "TestRunAddCtrl"
			})
			.when('/testRuns/:id', {
				templateUrl: '/partials/testRuns/view.html',
				controller: "TestRunViewCtrl"
			})
			.when('/accounting', {
				templateUrl: '/partials/accounting/index.html',
				controller: "AccountingIndexCtrl",
				reloadOnSearch: false
			})
			.when('/workorders', {
				templateUrl: '/partials/workorders/index.html',
				controller: "WorkorderIndexCtrl",
				reloadOnSearch: false
			})
			.when('/workorders/add', {
				templateUrl: '/partials/workorders/add.html',
				controller: "WorkorderAddCtrl"
			})
			.when('/workorders/:id', {
				templateUrl: '/partials/workorders/edit.html',
				controller: "WorkorderEditCtrl"
			})
			.when('/techs/:id', {
				templateUrl: '/partials/techs/schedule.html',
				controller: "TechScheduleCtrl"
			})
			.when('/posts', {
				templateUrl: '/partials/posts/index.html',
				controller: "PostIndexCtrl"
			})
			.when('/posts/add', {
				templateUrl: '/partials/posts/add.html',
				controller: "PostAddCtrl"
			})
			.when('/posts/:id', {
				templateUrl: '/partials/posts/edit.html',
				controller: "PostEditCtrl"
			})
			.when('/admin', {
				templateUrl: '/partials/users/index.html',
				controller: "UsersIndexCtrl",
				reloadOnSearch: false
			})
			.when('/admin/users/:id', {
				templateUrl: '/partials/users/clock.html',
				controller: "UserClockCtrl"
			})
			.otherwise({
				redirectTo: '/schedule'
			});
	});
