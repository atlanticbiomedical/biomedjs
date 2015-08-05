angular.module('biomed')
.controller("DeviceAddCtrl", devicesControllerFactory(false))
.controller("DeviceEditCtrl", devicesControllerFactory(true))


function devicesControllerFactory(isEdit) {
  return function($scope, Devices, DeviceTypes, $location, $filter, $routeParams) {
    function buildDeviceTypeFilterQuery(ignore) {
      var query = {};

      _.each(['category', 'make', 'model'], function(key) {
        if (key == ignore)
          return;

        if ($scope.deviceTypes[key].picker) {
          query[key] = $scope.deviceTypes[key].picker.id;
        }
      })

      return query;
    }

    function filterDeviceTypeSelectors() {
      console.log('Filtering Device Data');

      var data = {};

      _.each(['category', 'make', 'model'], function(key) {
        var query = buildDeviceTypeFilterQuery(key);
        var filteredResults = $filter('filter')(deviceTypesList, query);

        data[key] = [];

        _.each(filteredResults, function(entry) {
          data[key].push(entry[key]);
        });
      });

      _.each(['category', 'make', 'model'], function(key) {
        $scope.deviceTypes[key].data = _.uniq(data[key]);

        if (data[key].length == 1) {
          var value = data[key][0];
          $scope.deviceTypes[key].picker = { id: value, text: value };
        }
      });
    }

    function deviceTypePickerFactory(key, label) {
      var optsKey = key + 'Opts';

      $scope.deviceTypes[key] = {};
      $scope.deviceTypes[key].opts = {
        containerCssClass: 'input-xxlarge',
        placeholder: 'Choose a ' + label,
        query: function(query) {
          var data = $filter('filter')($scope.deviceTypes[key].data, query.term);
          query.callback({
            results: _.map(data, function(entry) {
              return { id: entry, text: entry }
            })
          });
        }
      };

      $scope.$watch('deviceTypes.' + key + '.picker',function() {
        filterDeviceTypeSelectors();
        updateDeviceTypeSelection();
      }, true);
    }

    function clearDeviceTypePickers() {
      _.each(['category', 'make', 'model'], function(key) {
        $scope.deviceTypes[key].picker = null;
      });
    }

    function updateDeviceTypeSelection() {
        var query = buildDeviceTypeFilterQuery();
        var results = $filter('filter')(deviceTypesList, query);

        $scope.model.deviceType = (results.length == 1) ? results[0]._id : null;
    }

    function generateRandomIdentifier() {
      $scope.model.biomedId = hashids.encode(Date.now());
    }

    function toggleFrequency(index) {
      $scope.model.frequencySchedule[index] = !$scope.model.frequencySchedule[index];

      console.log($scope.model);
    }

    function create() {
      Devices.create($scope.model, function(result) {
        console.log('here');
        $location.path("/devices/" + result._id);
      });
    }

    function update() {
      Devices.update({id: $scope.model._id}, $scope.model);
    }

    var hashids = new Hashids("biomed");
    var search = $location.search();

    $scope.model = {
      frequencySchedule: [false, false, false, false, false, false, false, false, false, false, false, false]
    };

    $scope.toggleFrequency = toggleFrequency;

    $scope.deviceTypes = {};
    $scope.deviceTypes.reset = clearDeviceTypePickers;

    $scope.biomedId = {};
    $scope.biomedId.reset = generateRandomIdentifier;

    $scope.create = create;
    $scope.update = update;

    deviceTypePickerFactory('category', 'Device Type');
    deviceTypePickerFactory('make', 'Make');
    deviceTypePickerFactory('model', 'Model');

    var deviceTypesList = DeviceTypes.index(filterDeviceTypeSelectors)

    console.log((isEdit ? "Edit" : "Create") + " Mode");

    if (isEdit) {
      $scope.model = Devices.get($routeParams, function() {
        $scope.loading = false;

        var deviceType = $scope.model.deviceType;

        _.each(['category', 'make', 'model'], function(key) {
          $scope.deviceTypes[key].picker = { id: deviceType[key], text: deviceType[key] };
        });

        $scope.model.client = $scope.model.client._id;
        $scope.model.deviceType = $scope.model.deviceType._id;

        $scope.testRuns = Devices.testRuns($routeParams, function() {
          console.log($scope.testRuns);
        });
      });
    } else {
      if (search.clientId) {
        $scope.model.client = search.clientId;
      } else {
        $location.path("/deviceTypes");
        return;
      }

      generateRandomIdentifier();
    }
  }
}
