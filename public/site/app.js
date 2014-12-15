site = {};


angular.module('site', ['ngResource'])
.factory("Posts", function($resource) {
        return $resource('/api/posts/:id',
                { id: "@id" },
                {
                        index:          { method: 'GET', params: {}, isArray: true },
                        get:            { method: 'GET', params: { id: 0} },
                        create:         { method: 'POST', params: {} },
                        update:         { method: 'POST', params: { id: 0} },
                        destroy:        { method: 'DELETE', params: { id: 0 } },
                });
})
.directive('dropzone', function() {
        return {
                scope: {
                        dropzone: '=',
                        existing: '='
                },
                controller: function($scope, $element, $attrs) {
                        var config, dropzone;
                        config = $scope.dropzone;

                        dropzone = new Dropzone($element[0], config.options);
                        angular.forEach(config.eventHandlers, function (handler, event) {
                                dropzone.on(event, handler);
                        });

                        $scope.$watch('existing', function() {
                                var existing = $scope.existing;

                                console.log(dropzone);

                                if (existing) {
                                        for (var i = 0; i < existing.length; i++) {
                                                var file = { name: existing[i], size: 0, accepted: true, filename: existing[i] };
                                                dropzone.options.addedfile.call(dropzone, file);
                                                dropzone.options.thumbnail.call(dropzone, file, "http://atlanticbiomedical.com/images/" + existing[i]);
                                                dropzone.files.push(file);
                                        }
                                }
                        });
                }
        };
});

site.PageCtrl = function($scope, Posts, $location) {

        $scope.model = {
                gallery: []
        };

        $scope.titleImageOptions = {
                options: {
                        url: '/api/posts/upload',
                        maxFiles: 1,
                        addRemoveLinks: true
                },
                eventHandlers: {
                        success: function(file, response) {
                                console.log('adding file');
                                $scope.$apply(function() {
                                        $scope.model.image = response.filename;
                                });
                        },
                        removedfile: function(file) {
                                console.log('removing file');
                                $scope.$apply(function() {
                                        $scope.model.image = undefined;
                                });
                        },
                        maxfilesexceeded: function(file) {
                                this.removeAllFiles();
                                this.addFile(file);
                        }
                }
        };

        var galleryImages = {};

        $scope.galleryImageOptions = {
                options: {
                        url: '/api/posts/upload',
                        addRemoveLinks: true
                },
                eventHandlers: {
                        success: function(file, response) {
                                console.log('Adding File');
                                file.filename = response.filename;

                                if (galleryImages[file.filename]) {
                                        galleryImages[file.filename]++;
                                        this.removeFile(file);
                                } else {
                                        galleryImages[file.filename] = 1;
                                }
                        },
                        removedfile: function(file) {
                                console.log('Removing File');
                                galleryImages[file.filename]--;

                                if (galleryImages[file.filename] <= 0) {
                                        delete galleryImages[file.filename];
                                }
                        }
                }
        };

	$scope.save = function() {
		$scope.model.gallery = Object.keys(galleryImages);
		$scope.model.status = "draft";
		$scope.model.createdOn = new Date();

		Posts.create($scope.model, function(result) {
			$scope.saved = true;
		});
	};

	$scope.refresh = function() {
		window.location.reload();
	}
}


