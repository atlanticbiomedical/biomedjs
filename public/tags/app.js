var tags = {}

var fields = [
	{ field: 'device', label: 'Device' },
	{ field: 'make', label: 'Manufacture' },
	{ field: 'model', label: 'Model' },
	{ field: 'serialNumber', label: 'Serial Number' },
	{ field: 'purchaseDate', label: 'Purchase Date' },
	{ field: 'deviceWarrantyExpiration', label: 'Warranty Expiration' },
	{ field: 'test', label: 'PM Test' },
	{ field: 'roomNumber', label: 'Room #' },
	{ field: 'poNumber', label: 'PO Number' },
	{ field: 'MoveTo', label: 'Move To' }
];

angular.module('tags', ['ngResource', 'biomed.directives'])
	.factory("Tag", function($resource) {
		return $resource('/api/tags');
	})
	.factory("Clients", function($resource) {
		return $resource('/api/clients/:id/:cmd',
			{ id: "@id", cmd: "@cmd" },
			{
				index: 	 	{ method: 'GET', params: {}, isArray: true },
			});
	})

tags.PageCtrl = function($scope, $window, Tag, Clients) {
	console.log($window.payload)

	var payload = $scope.payload = $window.payload;

	$scope.tag = payload.tag ? payload.tag.data : undefined;

	$scope.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;

	if (payload.user) {
		$scope.user = payload.user;
		$scope.clients = Clients.index(function() {
			if (payload.tag && payload.tag.client) {
				$scope.client = payload.tag.client._id;
			}
		});
	}

	$scope.save = function() {
		Tag.save({
			tag_id: $window.payload.id,
			client: $scope.client,
			data: $scope.tag
		}, function() {
			alert('Your changes have been saved.');
		});
	}

	$scope.fields = [];

	if ($scope.tag) {
		for (var i = 0; i < fields.length; i++) {
			fields[i].value = $scope.tag[fields[i].field];
			$scope.fields.push(fields[i]);
		}
	}

	console.log($scope.fields);
}
