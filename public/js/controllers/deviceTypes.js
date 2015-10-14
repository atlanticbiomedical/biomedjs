angular.module('biomed')

.controller("DeviceTypeIndexCtrl", function($scope, $filter, $routeParams, DeviceTypes, LocationBinder) {
  $scope.loading = true;

  var allData = DeviceTypes.index(function() {
    $scope.loading = false;
    $scope.filter();
  });

  var filteredData = [];
  var index = 0;
  var initialPageSize = 100;
  var pageSize = 5;

  $scope.canLoad = true;

  $scope.$watch('query', function() {
    $scope.filter();
  });

  LocationBinder($scope, ['query']);

  $scope.filter = function() {
    filteredData = $filter('orderBy')($filter('filter')(allData, $scope.query), $scope.sort.column, $scope.sort.descending);
    index = initialPageSize;
    $scope.canLoad = true;
    $scope.devices = filteredData.slice(0, initialPageSize);
  };

  $scope.addItems = function() {
    $scope.devices = $scope.devices.concat(filteredData.slice(index, index + pageSize));
    index += pageSize;
    $scope.canLoad = index < filteredData.length;
  }

  $scope.sort = {
    column: 'category',
    descending: false
  };

  $scope.selectedCls = function(column) {
    return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
  }

  $scope.changeSorting = function(column) {
    var sort = $scope.sort;
    if (sort.column == column) {
      sort.descending = !sort.descending;
    } else {
      sort.column = column;
      sort.descending = false;
    }

    $scope.filter();
  };
})

.controller("DeviceTypeAddCtrl", function($scope, DeviceTypes, CheckLists, $location, $filter) {
  $scope.model = {};

  $scope.categories = DeviceTypes.categories();
  $scope.deviceMakes = DeviceTypes.makes();

  $scope.checkLists = CheckLists.index();

  $scope.categoryOpts = {
    containerCssClass: 'input-xxlarge',
    placeholder: 'Choose a Device Type',
    query: function(query) {
      var data = $filter('filter')($scope.categories, query.term);
      var results = [];
      data.forEach(function(item) {
        results.push({id: item, text: item});
      });
      query.callback({results: results });
    },
    createSearchChoice: function(term) {
      return { id: term, text: term };
    }
  };

  $scope.makeOpts = {
    containerCssClass: 'input-xxlarge',
    placeholder: 'Choose a Device Make',
    query: function(query) {
      var data = $filter('filter')($scope.deviceMakes, query.term);
      var results = [];
      data.forEach(function(item) {
        results.push({id: item, text: item});
      });
      query.callback({results: results });
    },
    createSearchChoice: function(term) {
      return { id: term, text: term };
    }
  };

  var images = {};

  $scope.imageOpts = {
    options: {
      url: '/api/deviceTypes/images',
      addRemoveLinks: true
    },
    eventHandlers: {
      success: function(file, response) {
        file.filename = response.filename;

        if (images[file.filename]) {
          images[file.filename]++;
          this.removeFile(file);
        } else {
          images[file.filename] = 1;
        }
      },
      removedfile: function(file) {
        images[file.filename]--;

        if (images[file.filename] <= 0) {
          delete images[file.filename];
        }
      }
    }
  };

  $scope.$watch('categoryPicker', function() {
    if ($scope.categoryPicker) {
      $scope.model.category = $scope.categoryPicker.id;
    } else {
      $scope.model.category = null;
    }
  });

  $scope.$watch('makePicker', function() {
    if ($scope.makePicker) {
      $scope.model.make = $scope.makePicker.id;
    } else {
      $scope.model.make = null;
    }
  });

  $scope.save = function() {
    $scope.model.images = Object.keys(images);

    DeviceTypes.create($scope.model, function(result) {
      $location.path("/deviceTypes/");
    });
  };
})

.controller("DeviceTypeEditCtrl", function($scope, DeviceTypes, Devices, CheckLists, $location, $filter, $routeParams) {
  var images = {};

  $scope.checkLists = CheckLists.index(function() {
    $scope.model = DeviceTypes.get($routeParams, function() {
      $scope.loading = false;

      $scope.existingImages = $scope.model.images;
      if ($scope.model.images) {
        for (var i = 0; i < $scope.model.images.length; i++) {
          images[$scope.model.images[i]] = 1;
        }
      }

      $scope.categoryPicker = {id: $scope.model.category, text: $scope.model.category};
      $scope.makePicker = {id: $scope.model.make, text: $scope.model.make};
    });
  });

  console.log($routeParams);

  $scope.devices = Devices.index({ deviceType: $routeParams.id });

  $scope.categories = DeviceTypes.categories();
  $scope.deviceMakes = DeviceTypes.makes();


  $scope.categoryOpts = {
    containerCssClass: 'input-xxlarge',
    placeholder: 'Choose a Device Type',
    query: function(query) {
      var data = $filter('filter')($scope.categories, query.term);
      var results = [];
      data.forEach(function(item) {
        results.push({id: item, text: item});
      });
      query.callback({results: results });
    },
    createSearchChoice: function(term) {
      return { id: term, text: term };
    }
  };

  $scope.makeOpts = {
    containerCssClass: 'input-xxlarge',
    placeholder: 'Choose a Device Make',
    query: function(query) {
      var data = $filter('filter')($scope.deviceMakes, query.term);
      var results = [];
      data.forEach(function(item) {
        results.push({id: item, text: item});
      });
      query.callback({results: results });
    },
    createSearchChoice: function(term) {
      return { id: term, text: term };
    }
  };

  $scope.imageOpts = {
    options: {
      url: '/api/deviceTypes/images',
      addRemoveLinks: true
    },
    eventHandlers: {
      success: function(file, response) {
        file.filename = response.filename;

        if (images[file.filename]) {
          images[file.filename]++;
          this.removeFile(file);
        } else {
          images[file.filename] = 1;
        }
      },
      removedfile: function(file) {
        images[file.filename]--;

        if (images[file.filename] <= 0) {
          delete images[file.filename];
        }
      }
    }
  };

  $scope.$watch('categoryPicker', function() {
    if ($scope.categoryPicker) {
      $scope.model.category = $scope.categoryPicker.id;
    } else {
      $scope.model.category = null;
    }
  });

  $scope.$watch('makePicker', function() {
    if ($scope.makePicker) {
      $scope.model.make = $scope.makePicker.id;
    } else {
      $scope.model.make = null;
    }
  });

  $scope.save = function() {
    $scope.model.images = Object.keys(images);

    DeviceTypes.update({id: $scope.model._id}, $scope.model, function(result) {
      $location.path("/deviceTypes/");
    });
  };

  $scope.delete = function() {
    $scope.model.images = Object.keys(images);
    $scope.model.deleted = true;

    DeviceTypes.update({id: $scope.model._id}, $scope.model, function(result) {
      $location.path("/deviceTypes/");
    });
  };
})
