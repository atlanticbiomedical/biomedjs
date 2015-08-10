angular.module('biomed')
.controller("CheckListIndexCtrl", checkListsIndexController)
.controller("CheckListAddCtrl", checkListsControllerFactory(false))
.controller("CheckListEditCtrl", checkListsControllerFactory(true))

function checkListsIndexController($scope, $filter, $routeParams, CheckLists, LocationBinder) {
  $scope.loading = true;

  var allData = CheckLists.index(function() {
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
    $scope.checkLists = filteredData.slice(0, initialPageSize);
  };

  $scope.addItems = function() {
    $scope.checkLists = $scope.checkLists.concat(filteredData.slice(index, index + pageSize));
    index += pageSize;
    $scope.canLoad = index < filteredData.length;
  }

  $scope.sort = {
    column: 'name',
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
}

function checkListsControllerFactory(isEdit) {
  return function($scope, CheckLists, $location, $filter, $routeParams) {

    function addField() {
      $scope.model.fields.push({ type: 'boolean' })
    }

    function removeField(index) {
      console.log('Index: ', index);
      if (index != -1) {
        $scope.model.fields.splice(index, 1);
      }
    }

    function save() {
      if (isEdit) {
        CheckLists.update({id: $scope.model._id}, $scope.model, function() {
          $location.path("/checkLists/");
        });
      } else {
        CheckLists.create($scope.model, function(result) {
          $location.path("/checkLists/" + result._id);
        });        
      }
    }

    $scope.addField = addField;
    $scope.removeField = removeField;
    $scope.save = save;
    $scope.isEdit = isEdit;

    if (!isEdit) {
      $scope.model = {
        name: '',
        fields: []
      };

      addField();
    } else {
      $scope.model = CheckLists.get($routeParams);
    }
  }
}
