
biomed.TechScheduleCtrl = function($scope, $routeParams, $location, Schedule, Users, LocationBinder) {

	if (!$scope.date) {
		$scope.date = new Date();
	}

	Users.index({userid: $routeParams.id}, function(result) {
		$scope.tech = result[0];	
	});

	$scope.$watch('date', updateDate);

        $scope.onEntryClick = function(entry) {
                $location.path('/workorders/' + entry.workorder._id);
        };

	function updateDate() {
		Schedule.index({
			tech: $routeParams.id,
			start: $scope.date.toJSON(),
			end: moment($scope.date).add('days', 7).toDate().toJSON()
		}, function(result) {
			$scope.schedule = result;
		});
	}
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

biomed.UsersIndexCtrl = function($scope, $filter, $routeParams, $location, Users, LocationBinder) {
	$scope.loading = true;

	$scope.account.$then(function(value) {
		if (!$scope.accountHasPermission('system.admin'))
			return $location.path('/');
	});


	var allData = Users.details(function() {
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
		$scope.users = filteredData.slice(0, initialPageSize);
	};

	$scope.addItems = function() {
		$scope.users = $scope.users.concat(filteredData.slice(index, index + pageSize));
		index += pageSize;
		$scope.canLoad = index < filteredData.length;
	};

	function save(user) {
		if ('_id' in user) {
			Users.update({id: user._id}, user, function(result) {
				angular.copy(result, user);
			});
		} else {
			Users.create(user, function(result) {
				angular.copy(result, user);
			});
		}
	}

	$scope.toggleGroup = function(user, group) {
		var index = user.groups.indexOf(group);
		if (index > -1) 
			user.groups.splice(index, 1);
		else
			user.groups.push(group);

		save(user);
	}

	$scope.checkGroup = function(user, group) {
		return $.inArray(group, user.groups) > -1;
	};

	$scope.togglePerm = function(user, perm) {
		var index = user.perms.indexOf(perm);
		if (index > -1)
			user.perms.splice(index, 1);
		else
			user.perms.push(perm);

		save(user);
	};
	
	$scope.checkPerm = function(user, perm) {
		return $.inArray(perm, user.perms) > -1;
	};

	$scope.isNew = function(user) {
		return !('_id' in user);
	};
};

biomed.UserClockCtrl = function($scope, $routeParams, Users) {
        Users.index({userid: $routeParams.id}, function(result) {
		console.log(result);
                $scope.tech = result[0];
        });

	$scope.clocks = Users.clocks($routeParams);
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

	$scope.tags = Clients.tags($routeParams, function() {

	});

	$scope.identification = createController();
	$scope.address = createController();
	$scope.primaryContact = createContactController(0);
	$scope.secondaryContact = createContactController(1);
	$scope.other = createOtherController();
	$scope.internalNotes = createController();
	$scope.techNotes = createController();
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
		if (accountHasPermission('system.edit')) {
			$scope.master.frequencies[frequency][month] =! $scope.master.frequencies[frequency][month];
			Clients.update({id: $scope.master._id}, $scope.master, function() {
				updatePms();
			});
		}
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

        $scope.emailsOptions = {
		'multiple': true,
		'simple_tags': true,
		'tags': [],
		'formatNoMatches': function() { return 'Type an e-mail address and press return to add it.'; }
	};

	$scope.group = 'all';
	$scope.model = {};
	$scope.picker = {
		startTime: '09:00:00',
		endTime: '09:45:00'
	};
	$scope.picker.startDate = new Date();
	$scope.picker.endDate = new Date();

	var search = $location.search();

	if (search.workorderType == 'pm') {
		$scope.model.client = search.clientId;
		$scope.model.reason = "Preventive Maintenance";
		$scope.model.maintenanceType = search.type;

		$scope.workorderType = 'pm';
	} else if (search.workorderType == "meeting") {
		$scope.model.reason = "Meeting";
		$scope.workorderType = 'meeting';

		if (search.clientId) {
			$scope.model.client = search.clientId;
		}
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

	function convertToDate(date, time) {
		return moment(moment(date).format('YYYY-MM-DD') + 'T' + time).toDate();
	}

	function datesOverlap() {
		var start = convertToDate($scope.picker.startDate, $scope.picker.startTime);
		var end = convertToDate($scope.picker.endDate, $scope.picker.endTime);
		return start >= end;
	}

                function updateDuration() {
                        var start = convertToDate($scope.picker.startDate, $scope.picker.startTime);
                        var end = convertToDate($scope.picker.endDate, $scope.picker.endTime);

                        var duration = moment.duration(end - start);

                        var days = duration.days()
                        var hours = duration.hours();
                        var minutes = duration.minutes();

                        var result = "";

                        if (days == 1) {
                                result += "1 Day ";
                        }
                        if (days > 1) {
                                result += days + " Days ";
                        }
                        if (hours == 1) {
                                result += "1 Hour ";
                        }
                        if (hours > 1) {
                                result += hours + " Hours ";
                        }
                        if (minutes > 0) {
                                result += minutes + " Minutes";
                        }

                        $scope.picker.duration = result;
                }


	$scope.$watch('picker.startDate', function() {
		Schedule.index({
			date: $scope.picker.startDate.toJSON()
		}, function(result) {
			$scope.schedule = result;
		});

		if (datesOverlap()) {
			$scope.picker.endDate = $scope.picker.startDate;
		}
		updateDuration();
	});

	$scope.$watch('picker.endDate', function() {
		if (datesOverlap()) {
			$scope.picker.startDate = $scope.picker.endDate;
		}
		updateDuration();
	});

	$scope.$watch('picker.startTime', function() {
		$scope.picker.endTime = moment($scope.picker.startTime, "HH:mm:ss").add('minutes', 45).format("HH:mm:ss");
		$scope.picker.endDate = $scope.picker.startDate;
		updateDuration();
	});

	$scope.$watch('picker.endTime', function() {
		if (datesOverlap()) {
			$scope.picker.startTime = moment($scope.picker.endTime, "HH:mm:ss").subtract('minutes', 15).format("HH:mm:ss");
		}
		updateDuration();
	});

	$scope.save = function(notify) {
		var picker = $scope.picker;
		var model = $scope.model;

		var startDate = moment(picker.startDate).format('YYYY-MM-DD');
		var endDate = moment(picker.endDate).format('YYYY-MM-DD');

		model.status = 'scheduled';
		model.scheduling = {};
		model.scheduling.start = moment(startDate + 'T' + picker.startTime).toDate();
		model.scheduling.end = moment(endDate + 'T' + picker.endTime).toDate();

		model._notify = notify;

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
			result.sort(function(a,b) {
				var r = a.name.first.localeCompare(b.name.first);
				if (r == 0) {
					r = a.name.last.localeCompare(b.name.last);
				}
				return r;
			});

			$scope.allUsers = result;

			$scope.usersMap = {};
			$scope.allUsers.forEach(function(user) {
				$scope.usersMap[user._id] = user;
			});
		});
	}
}

biomed.WorkorderEditCtrl = function($scope, $routeParams, Workorders, Schedule, Users) {
        $scope.emailsOptions = {
                'multiple': true,
                'simple_tags': true,
                'tags': [],
                'formatNoMatches': function() { return 'Type an e-mail address and press return to add it.'; }
        };

	$scope.group = 'all';
	$scope.route = $routeParams;
	$scope.loading = true;

	updateAllUsers();
	updateUsers();

	$scope.$watch('group', updateUsers);

	$scope.master = Workorders.get($routeParams, function() {
		$scope.loading = false;

		if ($scope.master.reason == "Meeting") {
			$scope.workorderType = "meeting";
		}
	});

	$scope.emails = createController();
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
			save: function(notify) {
				controller.model._notify = notify;

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

					controller.startDate = moment(controller.model.scheduling.start).startOf('day').toDate();
					controller.endDate = moment(controller.model.scheduling.end).startOf('day').toDate();
					
					controller.startTime = moment(controller.model.scheduling.start).format('HH:mm:ss');
					controller.endTime = moment(controller.model.scheduling.end).format('HH:mm:ss');

					controller.techs = controller.model.techs.map(function(t) { return t._id; });

					controller.visible = true;
					$scope.editing = true;
				}
			},
			save: function(notify) {
				var startDate = moment(controller.startDate).format('YYYY-MM-DD');
				var endDate = moment(controller.endDate).format('YYYY-MM-DD');

				controller.model.scheduling.start = moment(startDate + 'T' + controller.startTime).toDate();
				controller.model.scheduling.end = moment(endDate + 'T' + controller.endTime).toDate();

				controller.model.techs = controller.techs.map(function(t) { return $scope.usersMap[t]; });

				controller.model._notify = notify;

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


	        function convertToDate(date, time) {
	                return moment(moment(date).format('YYYY-MM-DD') + 'T' + time).toDate();
	        }
	
	        function datesOverlap() {
	                var start = convertToDate($scope.scheduling.startDate, $scope.scheduling.startTime);
	                var end = convertToDate($scope.scheduling.endDate, $scope.scheduling.endTime);
	                return start >= end;
	        }

		function updateDuration() {
			var start = convertToDate($scope.scheduling.startDate, $scope.scheduling.startTime);
			var end = convertToDate($scope.scheduling.endDate, $scope.scheduling.endTime);

			var duration = moment.duration(end - start);

			var days = duration.days()
			var hours = duration.hours();
			var minutes = duration.minutes();

			var result = "";
	
			if (days == 1) {
				result += "1 Day ";
			}
			if (days > 1) {
				result += days + " Days ";
			}
			if (hours == 1) {
				result += "1 Hour ";
			}
			if (hours > 1) {
				result += hours + " Hours ";
			}
			if (minutes > 0) {
				result += minutes + " Minutes";
			}

			$scope.scheduling.duration = result;
		}

		$scope.$watch('scheduling.startDate', function() {
			Schedule.index({
				date: $scope.scheduling.startDate.toJSON()
			}, function(result) {
				$scope.scheduling.schedule = result;
			});

			if (datesOverlap()) {
				$scope.scheduling.endDate = $scope.scheduling.startDate;
			}
			updateDuration();
		});

	        $scope.$watch('scheduling.endDate', function() {
	                if (datesOverlap()) {
	                        $scope.scheduling.startDate = $scope.scheduling.endDate;
	                }
			updateDuration();
	        });

	        $scope.$watch('scheduling.startTime', function() {
                        $scope.scheduling.endTime = moment($scope.scheduling.startTime, "HH:mm:ss").add('minutes', 45).format("HH:mm:ss");
			$scope.scheduling.endDate = $scope.scheduling.startDate;
			updateDuration();
	        });

	        $scope.$watch('scheduling.endTime', function() {
	                if (datesOverlap()) {
	                        $scope.scheduling.startTime = moment($scope.scheduling.endTime, "HH:mm:ss").subtract('minutes', 15).format("HH:mm:ss");
	                }
			updateDuration();
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
                        result.sort(function(a,b) {
                                var r = a.name.first.localeCompare(b.name.first);
                                if (r == 0) {
                                        r = a.name.last.localeCompare(b.name.last);
                                }
                                return r;
                        });

			$scope.allUsers = result;

			$scope.usersMap = {};
			$scope.allUsers.forEach(function(user) {
				$scope.usersMap[user._id] = user;
			});
		});
	}
};


biomed.PageCtrl = function($scope, $dialog, Account) {
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

	$scope.accountHasPermission = function(perm) {
		console.log($scope);
		if ($scope.account && $scope.account.perms) {
			return $scope.account.perms.indexOf(perm) > -1;
		}

		return false;
	};

	$scope.account = Account.get();
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
