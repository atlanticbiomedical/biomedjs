clock = {};


angular.module('clock', ['ngResource'])
	.factory("Clock", function($resource) {
		return $resource('/api/clock');
	})
	.constant('geolocation_msgs', {
	        'errors.location.unsupportedBrowser':'Browser does not support location services',
	        'errors.location.permissionDenied':'You have rejected access to your location',
	        'errors.location.positionUnavailable':'Unable to determine your location',
	        'errors.location.timeout':'Service timeout has been reached'
	})
	.factory('geolocation', ['$q','$rootScope','$window','geolocation_msgs',function ($q,$rootScope,$window,geolocation_msgs) {
		return {
			getLocation: function (opts) {
				var deferred = $q.defer();
				if ($window.navigator && $window.navigator.geolocation) {
					$window.navigator.geolocation.getCurrentPosition(function(position){
						$rootScope.$apply(function(){deferred.resolve(position);});
					}, function(error) {
						switch (error.code) {
							case 1:
								$rootScope.$broadcast('error',geolocation_msgs['errors.location.permissionDenied']);
								$rootScope.$apply(function() {
									deferred.reject(geolocation_msgs['errors.location.permissionDenied']);
								});
								break;
							case 2:
								$rootScope.$broadcast('error',geolocation_msgs['errors.location.positionUnavailable']);
								$rootScope.$apply(function() {
									deferred.reject(geolocation_msgs['errors.location.positionUnavailable']);
								});
								break;
							case 3:
								$rootScope.$broadcast('error',geolocation_msgs['errors.location.timeout']);
								$rootScope.$apply(function() {
									deferred.reject(geolocation_msgs['errors.location.timeout']);
								});
								break;
						}
					}, opts);
				}
				else
				{
					$rootScope.$broadcast('error',geolocation_msgs['errors.location.unsupportedBrowser']);
					$rootScope.$apply(function(){deferred.reject(geolocation_msgs['errors.location.unsupportedBrowser']);});
				}
				return deferred.promise;
			}
		};
	}])
	.directive('gmap', function($parse) {
		return {
			template: '<img alt="Google Map">',
			replace: true,
			restrict: 'E',
			controller: 'GMapController',
			scope: true,
			link: function postLink(scope, element, attrs, ctrl) {
				var el = element[0];

				var sizeBits = attrs.size.split('x');
				el.width = parseInt(sizeBits[0], 10);
				el.height = parseInt(sizeBits[1], 10);
				
				scope.$watch(attrs.markers, function(value) {
					el.src = ctrl.buildSourceString(attrs, value);
				});
			}
		}
	})
	.controller('GMapController', function() {
		var BASE_URL = '//maps.googleapis.com/maps/api/staticmap?';
		var STYLE_ATTRIBUTES = ['color', 'label', 'size'];
		
		function makeMarkerStrings(markers) {
			return markers.map(function(marker) {
				var str = Object.keys(marker).map(function(key) {
					if (STYLE_ATTRIBUTES.indexOf(key) > -1) {
						return key + ':' + marker[key] + '|';
					}
				}).join('');

				return str + marker.coords.join(',');
			});
		}

		this.buildSourceString = function(attrs, markers) {
			var markerStrings;
			if (markers) {
				if (!angular.isArray(markers)) {
					markers = [markers];
				}
				markerStrings = makeMarkerStrings(markers);
			}

			var params = Object.keys(attrs).map(function(attr) {
				if (attr === 'markers' && markerStrings) {
					return Object.keys(markerStrings).map(function(key) {
						return 'markers=' + encodeURIComponent(markerStrings[key]);
					}).join('&');
				}

				if (attr[0] !== '$' && attr !== 'alt') {
					return encodeURIComponent(attr) + '=' + encodeURIComponent(attrs[attr]);
				}
			});

			return BASE_URL + params.reduce(function(a, b) {
				if (!a) {
					return b;
				}

				if (b !== undefined) {
					return a + '&' + b;
				}

				return a;
			}, '');
		};
	});

clock.PageCtrl = function($scope, $rootScope, geolocation, Clock) {

	function save(action) {
		Clock.save({
			action: action,
			lat: $scope.coords.latitude,
			long: $scope.coords.longitude
		}, function(success) {
			$scope.success = 'Request was successful.';
		}, function(error) {
			$scope.error = 'Unable to complete request, Try again later';
		});
	}

	$scope.working = true;


	$scope.clockIn = function() {
		save('in');
	};

	$scope.clockOut = function() {
		save('out');
	};

	$rootScope.$on('error', function(event, msg) {
		$scope.working = false;

		console.log("ERROR");
		console.log(msg);

		$scope.error = msg;
	});

	geolocation.getLocation().then(function(data) {
		$scope.working = false;

		$scope.coords = data.coords;

		console.log('Got location Data');
		console.log(data);
		$scope.markers = [{
			color: 'blue',
			coords: [data.coords.latitude, data.coords.longitude]
		}];
	});
}


