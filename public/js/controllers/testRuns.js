angular.module('biomed')
.controller("TestRunAddCtrl", testRunAddController)
.controller("TestRunViewCtrl", testRunViewController)


function testRunAddController($scope, Devices, CheckLists, TestRuns, $location, $filter, $routeParams) {
  var search = $location.search();

  console.log(search);

  $scope.device = Devices.get({id: search.deviceId}, function() {
    console.log($scope.device);

    $scope.checkList = CheckLists.get({id: $scope.device.deviceType.checkList}, function() {
      $scope.loading = false;

      $scope.model = {
        device: $scope.device._id,
        date: new Date(),
        fields: []
      };

      _.each($scope.checkList.fields, function(field) {

        if (field.type == 'boolean') {
          field.value = 'false'
        }

        field.result = false;
        $scope.model.fields.push(field);
      });
    })
  });

  $scope.$watch('model', function() {
    $scope.model.result = true;

    _.each($scope.model.fields, function(field) {
      if (field.type == 'boolean') {
        field.result = (field.value == 'true');
      } else if (field.type == 'range') {
        field.result = field.value >= field.min && field.value <= field.max;
      } else if (field.type == 'text') {
        field.result = true;
      }

      $scope.model.result &= field.result;
    })
  }, true);

  $scope.save = function() {
    TestRuns.create($scope.model, function(result) {
      $location.path("/testRuns/" + result._id);
    });
  }
}

function testRunViewController($scope, Devices, CheckLists, TestRuns, $location, $filter, $routeParams) {
  $scope.model = TestRuns.get($routeParams);
}
