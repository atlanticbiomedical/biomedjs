var tags = {}

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
}
