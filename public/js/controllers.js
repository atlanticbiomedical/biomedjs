biomed.AccountCtrl = function($scope, Account) {
	$scope.account = Account.get();
};

biomed.ScheduleIndexCtrl = function($scope, $location, Users, Schedule, LocationBinder) {

//	LocationBinder($scope, ['date'], { date: new Date() });
	updateUsers();

	if (!$scope.date) {
		$scope.date = new Date();
	}

	$scope.group = 'all';

	$scope.$watch('date', updateDate);
	$scope.$watch('group', updateUsers);

	$scope.onEntryClick = function(entry) {
		$location.path('/workorders/' + entry.workorder._id);
	};

	function updateDate() {
		Schedule.index({
			date: $scope.date.toJSON()
		}, function(result) {
			$scope.schedule = result;
		});		
	}

	function updateUsers() {
		Users.index({ group: $scope.group }, function(result) {
			$scope.users = result;
		});
	}

};

biomed.SchedulePmsCtrl = function($scope, Clients) {
	$scope.loading = true;

	$scope.month = moment().month();

	var allData = Clients.frequencies(function() {
		filter();
		$scope.loading = false;
	});

	function filter() {
		$scope.pms = [];

		angular.forEach(allData, function(client) {
			angular.forEach(client.frequencies, function(value, key) {
				if (value[$scope.month]) {
					$scope.pms.push({
						reason: key,
						client: client
					});
				}
			});
		});
	}

	$scope.$watch('month', filter);
};

biomed.ClientIndexCtrl = function($scope, $filter, $routeParams, Clients, LocationBinder) {
	$scope.loading = true;

	var allData = Clients.index(function() {
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
		filteredData = $filter('filter')(allData, $scope.query);
		index = initialPageSize;
		$scope.canLoad = true;
		$scope.clients = filteredData.slice(0, initialPageSize);
	};

	$scope.addItems = function() {
		$scope.clients = $scope.clients.concat(filteredData.slice(index, index + pageSize));
		index += pageSize;
		$scope.canLoad = index < filteredData.length;
	}
};

biomed.ClientAddCtrl = function($scope, Clients, $location) {

	$scope.save = function() {
		$scope.model.contacts = [$scope.primaryContact, $scope.secondaryContact];

		Clients.create($scope.model, function(result) {
			$location.path("/clients/" + result._id);
		})
	};
};

biomed.ClientEditCtrl = function($scope, $routeParams, Clients) {
	$scope.route = $routeParams;
	$scope.loading = true;

	$scope.master = Clients.get($routeParams, function() {
		$scope.loading = false;
	});

	$scope.workorders = Clients.workorders($routeParams, function() {
		updatePms();
	});

	$scope.identification = createController();
	$scope.address = createController();
	$scope.primaryContact = createContactController(0);
	$scope.secondaryContact = createContactController(1);
	$scope.other = createOtherController();

	function updatePms() {
		var currentMonth = new Date().getMonth();

		$scope.pms = [];

		angular.forEach($scope.master.frequencies, function(value, key) {
			if (value[currentMonth]) {
				$scope.pms.push(key);
			}
		});
	}

	function createOtherController() {
		var controller = {
			edit: function() {
				if (!$scope.editing) {
					angular.copy($scope.master, controller.model);
					controller.visible = true;
					$scope.editing = true;
				}
			},
			destroy: function() {
				Clients.destroy({id: $scope.master._id});
				window.history.back();
			},
			reset: function() {
				angular.copy($scope.master, controller.model);
				controller.visible = false;
				$scope.editing = false;
			},
			model: {},
			form: {}
		};

		return controller;
	}

	function createController() {
		var controller = {
			edit: function() {
				if (!$scope.editing) {
					angular.copy($scope.master, controller.model);
					controller.visible = true;
					$scope.editing = true;
				}
			},
			save: function() {
				Clients.update({id: $scope.master._id}, controller.model);
				angular.copy(controller.model, $scope.master);
				controller.visible = false;
				$scope.editing = false;
			},
			reset: function() {
				angular.copy($scope.master, controller.model);
				controller.visible = false;
				$scope.editing = false;
			},
			model: {},
			form: {}
		};

		return controller;
	}

	function createContactController(index) {
		var controller = {
			edit: function() {
				if (!$scope.editing) {
					angular.copy($scope.master, controller.model);

					if (!controller.model.contacts[index]) {
						controller.model.contacts[index] = {};
					}

					controller.visible = true;
					$scope.editing = true;
				}
			},
			save: function() {
				Clients.update({id: $scope.master._id}, controller.model);
				angular.copy(controller.model, $scope.master);
				controller.visible = false;
				$scope.editing = false;
			},
			reset: function() {
				angular.copy($scope.master, controller.model);
				controller.visible = false;
				$scope.editing = false;
			},
			model: {},
			form: {}
		};

		return controller;
	}

	$scope.toggleFrequency = function(frequency, month) {
		$scope.master.frequencies[frequency][month] =! $scope.master.frequencies[frequency][month];
		Clients.update({id: $scope.master._id}, $scope.master, function() {
			updatePms();
		});
	}
};

biomed.WorkorderIndexCtrl = function($scope, $filter, $routeParams, Workorders, LocationBinder) {
	$scope.loading = true;

	var data = {};

	var defaultEnd = moment().toDate();
	var defaultStart = moment(defaultEnd).subtract('days', 7).toDate();

	LocationBinder($scope, ['query', 'start', 'end'], {
		start: defaultStart,
		end: defaultEnd
	});

	fetchData();


	var filteredData = [];
	var index = 0;
	var initialPageSize = 100;
	var pageSize = 5;

	$scope.canLoad = true;

	$scope.$watch('query', filter);

	$scope.$watch('start', fetchData);

	$scope.$watch('end', fetchData);


	$scope.addItems = function() {
		$scope.workorders = $scope.workorders.concat(filteredData.slice(index, index + pageSize));
		index += pageSize;
		$scope.canLoad = index < filteredData.length;
	}

	function filter() {
		filteredData = $filter('filter')(data, $scope.query);
		index = initialPageSize;
		$scope.canLoad = true;
		$scope.workorders = filteredData.slice(0, initialPageSize);
	};

	function fetchData() {
		$scope.loading = true;

		data = Workorders.index({
			start: $scope.start.toJSON(),
			end: $scope.end.toJSON()
		}, function() {
			$scope.loading = false;
			filter();
		});
	}
} 

biomed.WorkorderAddCtrl = function($scope, $location, Workorders, Schedule, Clients, Users) {

	$scope.group = 'all';
	$scope.model = {};
	$scope.picker = {
		start: '09:00:00',
		end: '17:00:00'
	};
	$scope.picker.date = new Date();

	var search = $location.search();

	if (search.workorderType == 'pm') {
		$scope.model.client = search.clientId;
		$scope.model.reason = "Preventive Maintenance";
		$scope.model.maintenanceType = search.type;

		$scope.workorderType = 'pm';
	} else {
		if (search.clientId) {
			$scope.model.client = search.clientId;
		}

		if (search.reason) {
			$scope.model.reason = search.reason;
		}

		if (search.remarks) {
			$scope.model.remarks = search.remarks;
		}
	}

	updateAllUsers();
	updateUsers();

	$scope.$watch('group', updateUsers);

	Clients.index(function(result) {
		$scope.clients = result;
	});

	$scope.$watch('picker.date', function() {
		Schedule.index({
			date: $scope.picker.date.toJSON()
		}, function(result) {
			$scope.schedule = result;
		});
	});

	$scope.save = function() {
		var picker = $scope.picker;
		var model = $scope.model;

		var date = moment(picker.date).format('YYYY-MM-DD');
		model.status = 'scheduled';
		model.scheduling = {};
		model.scheduling.start = moment(date + 'T' + picker.start).toDate();
		model.scheduling.end = moment(date + 'T' + picker.end).toDate();

		Workorders.create(model, function(result) {
			$location.path("/workorders/" + result._id);
		});
	};

	function updateUsers() {
		Users.index({ group: $scope.group }, function(result) {
			$scope.users = result;
		});
	}


	function updateAllUsers() {
		var criteria = {};

		Users.index(criteria, function(result) {
			$scope.allUsers = result;

			$scope.usersMap = {};
			$scope.allUsers.forEach(function(user) {
				$scope.usersMap[user._id] = user;
			});
		});
	}
}

biomed.WorkorderEditCtrl = function($scope, $routeParams, Workorders, Schedule, Users) {
	$scope.group = 'all';
	$scope.route = $routeParams;
	$scope.loading = true;

	updateAllUsers();
	updateUsers();

	$scope.$watch('group', updateUsers);

	$scope.master = Workorders.get($routeParams, function() {
		$scope.loading = false;
	});

	$scope.status = createController();
	$scope.remarks = createController();
	$scope.scheduling = createSchedulingController();

	$scope.destroy = function() {
		Workorders.destroy({id: $scope.master._id});
		window.history.back();
	}

	function createController() {
		var controller = {
			edit: function() {
				if (!$scope.editing) {
					angular.copy($scope.master, controller.model);
					controller.visible = true;
					$scope.editing = true;
				}
			},
			save: function() {
				Workorders.update({id: $scope.master._id}, controller.model);
				angular.copy(controller.model, $scope.master);
				controller.visible = false;
				$scope.editing = false;
			},
			reset: function() {
				angular.copy($scope.master, controller.model);
				controller.visible = false;
				$scope.editing = false;
			},
			model: {},
			form: {}
		};

		return controller;
	}

	function createSchedulingController() {
		var controller = {
			edit: function() {
				if (!$scope.editing) {
					angular.copy($scope.master, controller.model);

					controller.date = moment(controller.model.scheduling.start).startOf('day').toDate();
					controller.start = moment(controller.model.scheduling.start).format('HH:mm:ss');
					controller.end = moment(controller.model.scheduling.end).format('HH:mm:ss');

					controller.techs = controller.model.techs.map(function(t) { return t._id; });

					controller.visible = true;
					$scope.editing = true;
				}
			},
			save: function() {
				var date = moment(controller.date).format('YYYY-MM-DD');
				controller.model.scheduling.start = moment(date + 'T' + controller.start).toDate();
				controller.model.scheduling.end = moment(date + 'T' + controller.end).toDate();

				controller.model.techs = controller.techs.map(function(t) { return $scope.usersMap[t]; });

				Workorders.update({id: $scope.master._id}, controller.model);
				angular.copy(controller.model, $scope.master);
				controller.visible = false;
				$scope.editing = false;
			},
			reset: function() {
				angular.copy($scope.master, controller.model);
				controller.visible = false;
				$scope.editing = false;
			},
			model: {},
			form: {}
		};


		$scope.$watch('scheduling.date', function() {

			Schedule.index({
				date: $scope.scheduling.date.toJSON()
			}, function(result) {
				$scope.scheduling.schedule = result;
			});
		});

		return controller;
	}

	function updateUsers() {
		Users.index({ group: $scope.group }, function(result) {
			$scope.users = result;
		});
	}

	function updateAllUsers() {
		var criteria = {};

		Users.index(criteria, function(result) {
			$scope.allUsers = result;

			$scope.usersMap = {};
			$scope.allUsers.forEach(function(user) {
				$scope.usersMap[user._id] = user;
			});
		});
	}
};


biomed.PageCtrl = function($scope, $dialog) {
	$scope.opts = {
		backdrop: true,
		keyboard: true,
		backdropClick: true,
		dialogFade: true,
		backdropFade: true,
		templateUrl: '/partials/messages.html',
		controller: 'biomed.MessagesCtrl'
	};

	$scope.openDialog = function(){
		var d = $dialog.dialog($scope.opts);
		d.open();
	};
};

biomed.MessagesCtrl = function($scope, dialog, Users, Messages) {
	$scope.model = {};

	$scope.model.messages = [
		{ message: 'Telephoned', checked: false },
		{ message: 'Came to see you', checked: false },
		{ message: 'Wants to see you', checked: false },
		{ message: 'Returned your call', checked: false },
		{ message: 'Please call', checked: false },
		{ message: 'Will call again', checked: false },
		{ message: 'Rush', checked: false },
		{ message: 'Special Attention', checked: false }
	];

	Users.index({ perms: "messages.receive" }, function(result) {
		$scope.users = result;
	});

	$scope.send = function() {
		Messages.send($scope.model, function(result) {
			dialog.close();
		});
	};

	$scope.cancel = function() {
		dialog.close();
	};
};
