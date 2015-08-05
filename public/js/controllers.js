angular.module('biomed')
.controller("TechScheduleCtrl", function($scope, $routeParams, $location, Schedule, Users, LocationBinder) {

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
			start: moment($scope.date).subtract('days', 10).toDate().toJSON(),
			end: moment($scope.date).add('days', 21).toDate().toJSON()
		}, function(result) {
			$scope.schedule = result;
		});
	}
})

.controller("ScheduleIndexCtrl", function($scope, $location, Users, Schedule, LocationBinder) {

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

})

.controller("SchedulePmsCtrl", function($scope, $q, Clients, Workorders, Pms) {
	$scope.loading = true;

	// Setup initial state
	$scope.filter = "all";
	$scope.month = moment().month();
	$scope.year = 2015;
	$scope.frequency = "";

        $scope.sort = {
                column: 'client.name',
                descending: false
        };

	function update() {
		$scope.loading = true;

		if ($scope.filter != 'scheduled' && $scope.filter != 'complete') {
			if ($scope.month == "") {
				$scope.month = moment().month();
			}
		}
		if ($scope.month == "" && $scope.frequency == "") {
			$scope.frequency = "Anesthesia";
		}

		var query = {
			type: $scope.filter,
			year: $scope.year,
			month: $scope.month,
			frequency: $scope.frequency
		};

		$scope.pms = Pms.index(query, function() {
			$scope.loading = false;
		});
	}

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
        };

	$scope.$watch('filter', update);
	$scope.$watch('month', update);
	$scope.$watch('year', update);
	$scope.$watch('frequency', update);
})

.controller("FrequencyReportCtrl", function($scope, $q, $filter, Clients, Workorders, Pms) {
	$scope.loading = true;

	// Setup initial state
	$scope.month = moment().month();
	$scope.year = 2015;
	$scope.frequency = "Anesthesia";

        $scope.sort = {
                column: 'client.name',
                descending: false
        };

	function update() {
		$scope.loading = true;

		if ($scope.month == "" && $scope.frequency == "") {
			$scope.frequency = "Anesthesia";
		}

		var query = {
			year: $scope.year,
			month: $scope.month,
			frequency: $scope.frequency,
			type: 'all'
		};

		$scope.pms = Pms.index(query, function() {
			$scope.loading = false;
		});
	}

        $scope.selectedCls = function(column) {
                return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
        }

        $scope.changeSorting = function(column) {
		console.log(column);
                var sort = $scope.sort;
                if (sort.column == column) {
                        sort.descending = !sort.descending;
                } else {
                        sort.column = column;
                        sort.descending = false;
                }
        };

	$scope.$watch('month', update);
	$scope.$watch('year', update);
	$scope.$watch('frequency', update);
})


.controller("UsersIndexCtrl", function($scope, $filter, $routeParams, $location, Users, LocationBinder) {
	$scope.loading = true;

	$scope.account.$promise.then(function(value) {
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
})

.controller("UserClockCtrl", function($scope, $routeParams, Users) {
        Users.index({userid: $routeParams.id}, function(result) {
                $scope.tech = result[0];
        });

	$scope.clocks = Users.clocks($routeParams);
})

.controller("PostIndexCtrl", function($scope, $routeParams, Posts, LocationBinder) {
	var updatePosts = function() {
		$scope.loading = true;

		$scope.posts = Posts.index(
			{page: $scope.page},
			function() {
				$scope.loading = false;

				$scope.posted = 0;

				angular.forEach($scope.posts, function(value) {
					if (value.status === "posted") {
						$scope.posted += 1;
					}
				});
			});
	};

	$scope.selectPage = function(page) {
		$scope.page = page;
	};

	$scope.$watch('page', updatePosts);
})

.controller("PostAddCtrl", function($scope, Posts, $location) {

        $scope.tagOptions = {
                'multiple': true,
                'simple_tags': true,
                'tags': [],
                'formatNoMatches': function() { return 'Type a tag and press return to add it.'; }
        };

	$scope.pages = [
		{ value: 'front',    label: 'Front Page' },
		{ value: 'about-us', label: 'About Us' },
		{ value: 'sales',    label: 'Sales' },
		{ value: 'service',  label: 'Service' }
	];

	$scope.togglePage = function(page) {
		var idx = $scope.model.pages.indexOf(page.value);
		if (idx > -1) {
			$scope.model.pages.splice(idx, 1);
		} else {
			$scope.model.pages.push(page.value);
		}
	}

	$scope.model = {
		gallery: [],
		pages: [],
		postedOn: new Date()
	};

	$scope.titleImageOptions = {
		options: {
			url: '/api/posts/upload',
			maxFiles: 1,
			addRemoveLinks: true
		},
		eventHandlers: {
			success: function(file, response) {
				$scope.$apply(function() {
					$scope.model.image = response.filename;
				});
			},
			removedfile: function(file) {
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
				file.filename = response.filename;

				if (galleryImages[file.filename]) {
					galleryImages[file.filename]++;
					this.removeFile(file);
				} else {
					galleryImages[file.filename] = 1;
				}
			},
                        removedfile: function(file) {
                                galleryImages[file.filename]--;

				if (galleryImages[file.filename] <= 0) {
					delete galleryImages[file.filename];
				}
                        }
		}
	};

	var save = function(status) {
		$scope.model.gallery = Object.keys(galleryImages);
		$scope.model.status = status;
		$scope.model.createdOn = new Date();

		Posts.create($scope.model, function(result) {
			$location.path("/posts/" + result._id);
		});
	}

	$scope.saveAsDraft = function() {
		save('draft');
	};

	$scope.saveAsPosted = function() {
		save('posted');
	};
})

.controller("PostEditCtrl", function($scope, Posts, $routeParams, $location) {
	var galleryImages = {};

        $scope.tagOptions = {
                'multiple': true,
                'simple_tags': true,
                'tags': [],
                'formatNoMatches': function() { return 'Type a tag and press return to add it.'; }
        };

        $scope.pages = [
                { value: 'front',    label: 'Front Page' },
                { value: 'about-us', label: 'About Us' },
                { value: 'sales',    label: 'Sales' },
                { value: 'service',  label: 'Service' }
        ];

        $scope.togglePage = function(page) {
                var idx = $scope.model.pages.indexOf(page.value);
                if (idx > -1) {
                        $scope.model.pages.splice(idx, 1);
                } else {
                        $scope.model.pages.push(page.value);
                }
        }

	$scope.model = Posts.get($routeParams, function() {
		$scope.loading = false;

		if ($scope.model.image) {
			$scope.existingTitleImages = [$scope.model.image];
		}

		$scope.existingGalleryImages = $scope.model.gallery;
		for (var i = 0; i < $scope.model.gallery.length; i++) {
			galleryImages[$scope.model.gallery[i]] = 1;
		}

		if (!$scope.model.postedOn) {
			$scope.model.postedOn = new Date();
		}
	});

        $scope.titleImageOptions = {
                options: {
                        url: '/api/posts/upload',
                        maxFiles: 1,
                        addRemoveLinks: true,
			existing: []
                },
                eventHandlers: {
                        success: function(file, response) {
                                $scope.$apply(function() {
                                        $scope.model.image = response.filename;
                                });
                        },
                        removedfile: function(file) {
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

        $scope.galleryImageOptions = {
                options: {
                        url: '/api/posts/upload',
                        addRemoveLinks: true,
			existing: []
                },
                eventHandlers: {
                        success: function(file, response) {
                                file.filename = response.filename;

                                if (galleryImages[file.filename]) {
                                        galleryImages[file.filename]++;
                                        this.removeFile(file);
                                } else {
                                        galleryImages[file.filename] = 1;
                                }
                        },
                        removedfile: function(file) {
                                galleryImages[file.filename]--;

				if (galleryImages[file.filename] <= 0) {
					delete galleryImages[file.filename];
				}
                        }
                }
        };

        var save = function(status) {
                $scope.model.gallery = Object.keys(galleryImages);
                $scope.model.status = status;

                Posts.update({id: $scope.model._id}, $scope.model, function(result) {
                        $location.path("/posts/");
                });
        }

        $scope.saveAsDraft = function() {
                save('draft');
        };

        $scope.saveAsPosted = function() {
                save('posted');
        };

        $scope.saveAsArchived = function() {
                save('archived');
        };
})


.controller("ClientIndexCtrl", function($scope, $filter, $routeParams, Clients, LocationBinder) {
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
		filteredData = $filter('orderBy')($filter('filter')(allData, $scope.query), $scope.sort.column, $scope.sort.descending);
		index = initialPageSize;
		$scope.canLoad = true;
		$scope.clients = filteredData.slice(0, initialPageSize);
	};

	$scope.addItems = function() {
		$scope.clients = $scope.clients.concat(filteredData.slice(index, index + pageSize));
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
})

.controller("ClientAddCtrl", function($scope, Clients, $location) {

	$scope.save = function() {
		$scope.model.contacts = [$scope.primaryContact, $scope.secondaryContact];

		Clients.create($scope.model, function(result) {
			$location.path("/clients/" + result._id);
		})
	};
})

.controller("ClientEditCtrl", function($scope, $routeParams, Clients) {
	$scope.route = $routeParams;
	$scope.loading = true;

	$scope.master = Clients.get($routeParams, function() {
		$scope.loading = false;
	});

	$scope.workorders = Clients.workorders($routeParams, function() {
		updatePms();
	});

	$scope.devices = Clients.devices($routeParams);

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
		if ($scope.accountHasPermission('system.edit')) {
			$scope.master.frequencies[frequency][month] =! $scope.master.frequencies[frequency][month];
			Clients.update({id: $scope.master._id}, $scope.master, function() {
				updatePms();
			});
		}
	}
})


.controller("AccountingIndexCtrl", function($scope, $filter, $routeParams, Workorders, LocationBinder) {
	$scope.loading = true;

	var data = {};

	var defaultEnd = moment().toDate();
	var defaultStart = moment(defaultEnd).subtract('days', 7).toDate();

	$scope.start = defaultStart;
	$scope.end = defaultEnd;

//	LocationBinder($scope, ['query', 'status', 'start', 'end'], {
//		start: defaultStart,
//		end: defaultEnd
//	});

	fetchData();


	var filteredData = [];
	var index = 0;
	var initialPageSize = 100;
	var pageSize = 5;

	$scope.query = '!n/a';
	$scope.canLoad = true;

	$scope.$watch('query', filter);

	$scope.$watch('status', filter);

	$scope.$watch('start', fetchData);

	$scope.$watch('end', fetchData);

	$scope.sort = {
		column: 'scheduling.start',
		descending: true
	};

	$scope.addItems = function() {
		$scope.workorders = $scope.workorders.concat(filteredData.slice(index, index + pageSize));
		index += pageSize;
		$scope.canLoad = index < filteredData.length;
	}

	function filter() {
		filteredData = $filter('filter')(data, {
			$: $scope.query,
			status: $scope.status
		});
		index = initialPageSize;
		$scope.canLoad = true;
		$scope.workorders = filteredData.slice(0, initialPageSize);
		$scope.total = filteredData.length;
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
	};

	$scope.selectPage = function(status) {
		$scope.status = status;
	}

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
})

.controller("WorkorderIndexCtrl", function($scope, $filter, $routeParams, Workorders, LocationBinder) {
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

	$scope.sort = {
		column: 'scheduling.start',
		descending: true
	};

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
})

.controller("WorkorderAddCtrl", function($scope, $location, $filter, Workorders, Schedule, Clients, Users) {

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

	$scope.model.status = 'scheduled';

	if (search.workorderType == 'pm') {
		$scope.model.client = search.clientId;
		$scope.model.reason = "Preventive Maintenance";
		$scope.model.maintenanceType = search.type;

		$scope.workorderType = 'pm';
	} else if (search.workorderType == "meeting") {
		$scope.model.reason = "Meeting";
		$scope.model.status = 'n/a';
		$scope.workorderType = 'meeting';

		if (search.clientId) {
			$scope.model.client = search.clientId;
		}
	} else if (search.workorderType == 'shipment') {
		$scope.model.reason = 'Shipment';
		$scope.model.status = 'scheduled';
		$scope.workorderType = 'shipment';
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

	if ($scope.model.client) {
		Clients.get({ id: $scope.model.client }, function(item) {
			$scope.clientPicker = {id: item._id, text: item.name + " (" + item.identifier + ")", data: item};
		});
	}

	updateAllUsers();
	updateUsers();

	$scope.$watch('group', updateUsers);

	$scope.$watch('clientPicker', function() {
		if ($scope.clientPicker) {
			var client = $scope.clientPicker.data;
			$scope.model.client = client._id;
			$scope.currentClient = client;

			$scope.devices = Clients.devices({id: client._id}, function() {
				console.log($scope.devices);
			});
		} else {
			$scope.model.client = null;
			$scope.currentClient = null;
		}
	});

	Clients.index(function(result) {
		$scope.clients = result;
	});

	$scope.clientOpts = {
		containerCssClass: 'input-xxlarge',
		placeholder: 'Choose a Client',
		minimumInputLength: 2,
		query: function(query) {
			var data = $filter('filter')($scope.clients, query.term);
			var results = [];
			data.forEach(function(item) {
				results.push({id: item._id, text: item.name + " (" + item.identifier + ")", data: item}); 
			});
			query.callback({ results: results });
		}
	};

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

		model.scheduling = {};
		model.scheduling.start = moment(startDate + 'T' + picker.startTime).toDate();
		model.scheduling.end = moment(endDate + 'T' + picker.endTime).toDate();

		model._notify = notify;

		Workorders.create(model, function(result) {
			$location.path("/workorders/" + result._id);
		});
	};

	function updateUsers() {
		Users.index({ group: $scope.group, perms: 'workorder.schedulable' }, function(result) {
			$scope.users = result;
		});
	}


	function updateAllUsers() {
		var criteria = { perms: 'workorder.schedulable' };

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
})

.controller("WorkorderEditCtrl", function($scope, $routeParams, Workorders, Schedule, Users, Clients) {
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

	Workorders.get($routeParams, function(workorderData) {
		Clients.devices({id: workorderData.client._id}, function(devicesData) {

			$scope.allDevices = devicesData;
			$scope.master = workorderData;

			if ($scope.master.reason == "Meeting") {
				$scope.workorderType = "meeting";
			}

			$scope.loading = false;
		});
	});

	$scope.emails = createController();
	$scope.status = createController();
	$scope.remarks = createController();
	$scope.devices = createController();
	$scope.scheduling = createSchedulingController();

	function updateStatus() {
		if ($scope.status.model.invoiceNumber && $scope.status.model.checkNumber) {
			$scope.status.model.status = 'paid';
		} else if ($scope.status.model.invoiceNumber) {
			$scope.status.model.status = 'invoiced';
		} else {
			$scope.status.model.status = 'scheduled';
		}
	}

	$scope.$watch('status.model.invoiceNumber', function() {
		updateStatus();
	});

	$scope.$watch('status.model.checkNumber', function() {
		updateStatus();
	});

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
			if ($scope.scheduling.startDate) {
				Schedule.index({
					date: $scope.scheduling.startDate.toJSON()
				}, function(result) {
					$scope.scheduling.schedule = result;
				});

				if (datesOverlap()) {
					$scope.scheduling.endDate = $scope.scheduling.startDate;
				}
				updateDuration();
			}
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
		Users.index({ group: $scope.group, perms: 'workorder.schedulable' }, function(result) {
			$scope.users = result;
		});
	}

	function updateAllUsers() {
		var criteria = {perms: 'workorder.schedulable'};

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
})


.controller("PageCtrl", function($scope, $dialog, Account) {
	$scope.opts = {
		backdrop: true,
		keyboard: true,
		backdropClick: true,
		dialogFade: true,
		backdropFade: true,
		templateUrl: '/partials/messages.html',
		controller: 'MessagesCtrl'
	};

	$scope.openDialog = function(){
		var d = $dialog.dialog($scope.opts);
		d.open();
	};

	$scope.accountHasPermission = function(perm) {
		if ($scope.account && $scope.account.perms) {
			return $scope.account.perms.indexOf(perm) > -1;
		}

		return false;
	};

	$scope.account = Account.get();
})

.controller("MessagesCtrl", function($scope, dialog, Users, Messages) {
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
})
