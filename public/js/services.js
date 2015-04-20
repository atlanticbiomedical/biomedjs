angular.module('biomed.services', [])
.factory("Clients", function($resource) {
	return $resource('/api/clients/:id/:cmd',
		{ id: "@id", cmd: "@cmd" },
		{
			index: 	 	{ method: 'GET', params: {}, isArray: true },
			frequencies:	{ method: 'GET', params: { cmd: 'frequencies' }, isArray: true },
			get: 	 	{ method: 'GET', params: { id: 0} },
			create:  	{ method: 'POST', params: {} },
			update:  	{ method: 'POST', params: { id: 0} },
			destroy: 	{ method: 'DELETE', params: { id: 0 } },
			workorders: 	{ method: 'GET', params: { id: 0, cmd: 'workorders' }, isArray: true },
			tags:       	{ method: 'GET', params: { id: 0, cmd: 'tags' }, isArray: true },
			isUnique:	{ method: 'GET', params: { cmd: 'isUnique' } },
		});
})
.factory("Posts", function($resource) {
	return $resource('/api/posts/:id',
		{ id: "@id" },
		{
			index: 	 	{ method: 'GET', params: {}, isArray: true },
			get: 	 	{ method: 'GET', params: { id: 0} },
			create:  	{ method: 'POST', params: {} },
			update:  	{ method: 'POST', params: { id: 0} },
			destroy: 	{ method: 'DELETE', params: { id: 0 } },
		});
})
.factory("Workorders", function($resource) {
	return $resource('/api/workorders/:id',
		{ id: "@id" },
		{
			index: 	 	{ method: 'GET', params: {}, isArray: true },
			get: 	 	{ method: 'GET', params: { id: 0} },
			create:  	{ method: 'POST', params: {} },
			update:  	{ method: 'POST', params: { id: 0} },
			destroy: 	{ method: 'DELETE', params: { id: 0 } },
		});
})
.factory("Pms", function($resource) {
	return $resource('/api/pms',
		{},
		{
			index:		{ method: 'GET', isArray: true },
		});
})
.factory("Users", function($resource) {
	return $resource('/api/users/:id/:cmd',
		{ id: "@id", cmd: "@cmd" },
		{
			index: 	 	{ method: 'GET', isArray: true },
			details:	{ method: 'GET', params: { cmd: 'details' }, isArray: true },
			create:		{ method: 'POST', params: {} },
			update:		{ method: 'POST', params: { id: 0 } },
			clocks:		{ method: 'GET', params: { id: 0, cmd: 'clocks' }, isArray: true }
		});
})
.factory("Schedule", function($resource) {
	return $resource('/api/schedule', { },
		{
			index: 	 	{ method: 'GET', isArray: true },
		});
})
.factory("Account", function($resource) {
	return $resource('/api/account',
		{ id: "@id", cmd: "@cmd" },
		{
			get: 	 	{ method: 'GET' },
		});
})
.factory("Messages", function($resource) {
	return $resource('/api/messages/:cmd',
		{ cmd: "@cmd" },
		{
			send: 	 	{ method: 'POST', params: { cmd: 'send' } },
		});
})
.factory("LocationBinder", function($location, $timeout) {
	var DATE_MATCHER = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

	return function($scope, params, defaults) {

		function init() {
			var search = $location.search();

			params.forEach(function(binding) {
				var val = search[binding];

				if (val) {
					if (DATE_MATCHER.test(val)) {
						val = new Date(val);
					}

					$scope[binding] = val;
				} else if (defaults && defaults[binding]) {
					$scope[binding] = defaults[binding];
				}
			});
		}
		init();

		var updateTimeout;
		function updateLocation() {
			console.log("Update Timer Fired");
			if (updateTimeout) $timeout.cancel(updateTimeout);
			updateTimeout = $timeout(function() {
				params.forEach(function(binding) {

					var val = $scope[binding] || null;
					if (angular.isDate(val)) {
						val = val.toJSON();
					}

					$location.search(binding, val);
				});
			}, 1000);
		}

		params.forEach(function(binding) {
			$scope.$watch(binding, function() {
				updateLocation();
			});
		});

		$scope.$on('$routeUpdate', function() {
			console.log('Route updated');
			var search = $location.search();

			params.forEach(function(binding) {
				var val = search[binding];

				if (DATE_MATCHER.test(val)) {
					val = new Date(val);
				}

				$scope[binding] = val;
			});
		});
	}
});
