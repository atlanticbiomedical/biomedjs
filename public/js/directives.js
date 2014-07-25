angular.module('biomed.directives', [])
.directive("bioNavbar", function($location) {
	return {
		restrict: 'A',
		link: function($scope, element, attrs, controller) {
			$scope.$watch(function() {
				return $location.path();
			}, function(newValue, oldValue) {
				element.find('li[data-match-route]').each(function(k, li) {
					var $li = angular.element(li);
					var pattern = $li.attr('data-match-route');
					var regex = new RegExp('^' + pattern + '$', ['i']);

					if (regex.test(newValue)) {
						$li.addClass('active');
					} else {
						$li.removeClass('active');
					}
				});
			});
		}
	}
})
.directive('infiniteScroll', function ($window) {
    return {
        link:function (scope, element, attrs) {
            var offset = parseInt(attrs.threshold) || 0;
            var e = angular.element($window);

			e.bind("scroll", function() {
                if (scope.canLoad && e.height() + e.scrollTop() >= $(document).height() - offset) {
                    scope.$apply(attrs.infiniteScroll);
                }
            });
        }
    }
})
.directive('tabbable', function() {
  return {
    restrict: 'C',
    compile: function(element) {
      var navTabs = angular.element('<ul class="nav nav-tabs"></ul>'),
          tabContent = angular.element('<div class="tab-content"></div>');

      tabContent.append(element.contents());
      element.append(navTabs).append(tabContent);
    },
    controller: ['$scope', '$element', function($scope, $element) {
      var navTabs = $element.contents().eq(0),
          ngModel = $element.controller('ngModel') || {},
          tabs = [],
          selectedTab;

      ngModel.$render = function() {
        var $viewValue = this.$viewValue;

        if (selectedTab ? (selectedTab.value != $viewValue) : $viewValue) {
          if(selectedTab) {
            selectedTab.paneElement.removeClass('active');
            selectedTab.tabElement.removeClass('active');
            selectedTab = null;
          }
          if($viewValue) {
            for(var i = 0, ii = tabs.length; i < ii; i++) {
              if ($viewValue == tabs[i].value) {
                selectedTab = tabs[i];
                break;
              }
            }
            if (selectedTab) {
              selectedTab.paneElement.addClass('active');
              selectedTab.tabElement.addClass('active');
            }
          }

        }
      };

      this.addPane = function(element, attr) {
        var li = angular.element('<li><a href></a></li>'),
            a = li.find('a'),
            tab = {
              paneElement: element,
              paneAttrs: attr,
              tabElement: li
            };

        tabs.push(tab);

        attr.$observe('value', update)();
        attr.$observe('title', function(){ update(); a.text(tab.title); })();

        function update() {
          tab.title = attr.title;
          tab.value = attr.value || attr.title;
          if (!ngModel.$setViewValue && (!ngModel.$viewValue || tab == selectedTab)) {
            // we are not part of angular
            ngModel.$viewValue = tab.value;
          }
          ngModel.$render();
        }

        navTabs.append(li);
        li.bind('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          if (ngModel.$setViewValue) {
            $scope.$apply(function() {
              ngModel.$setViewValue(tab.value);
              ngModel.$render();
            });
          } else {
            // we are not part of angular
            ngModel.$viewValue = tab.value;
            ngModel.$render();
          }
        });

        return function() {
          tab.tabElement.remove();
          for(var i = 0, ii = tabs.length; i < ii; i++ ) {
            if (tab == tabs[i]) {
              tabs.splice(i, 1);
            }
          }
        };
      }
    }]
  };
})
.directive('tabPane', function() {
  return {
    require: '^tabbable',
    restrict: 'C',
    link: function(scope, element, attrs, tabsCtrl) {
      element.bind('$remove', tabsCtrl.addPane(element, attrs));
    }
  };
})
.directive('datepicker', function($timeout) {
  var isTouch = 'ontouchstart' in window && !window.navigator.userAgent.match(/PhantomJS/i);

  return {
    restrict: 'AC',
    require: '?ngModel',
    link: function postLink(scope, element, attrs, controller) {

      var format = 'MM-DD-YYYY';

      // Handle date validity according to dateFormat
      if(controller) {
      	controller.$formatters.unshift(function(value) {
      		return moment(value).format(format);
      	});

        controller.$parsers.unshift(function(viewValue) {
        	if (angular.isDate(viewValue)) {
        		return viewValue;
        	} else {
        		var date = moment(viewValue);
        		if (date.isValid()) {
        			return date;
        		} else {
        			return undefined;
        		}
         	}
         });
      }

      // Use native interface for touch devices
//      if(isTouch && element.prop('type') === 'text') {
//
//        element.prop('type', 'date');
//        element.on('change', function(ev) {
//          scope.$apply(function () {
//            controller.$setViewValue(moment(element.val()).toDate());
//          });
//        });

//      } else {

        // If we have a controller (i.e. ngModelController) then wire it up
        if(controller) {
          element.on('changeDate', function(ev) {
            scope.$apply(function () {
              controller.$setViewValue(moment(element.val()).toDate());
            });
          });
        }

        // Popover GarbageCollection
        var $popover = element.closest('.popover');
        if($popover) {
          $popover.on('hide', function(e) {
            var datepicker = element.data('datepicker');
            if(datepicker) {
              datepicker.picker.remove();
              element.data('datepicker', null);
            }
          });
        }

        // Create datepicker
        element.attr('data-toggle', 'datepicker');
        element.datepicker({
          autoclose: true,
          format: 'mm-dd-yyyy',
          forceParse: attrs.forceParse || false
        });

//      }

      // Support add-on
      var component = element.siblings('[data-toggle="datepicker"]');
      if(component.length) {
        component.on('click', function() { element.trigger('focus'); });
      }

    }
  };
})
.directive('techschedule', function() {
	return {
		restrict: 'E',
		scope: {
			schedule: '=',
			date: '=',
			onEntryClick: '&'
		},
		templateUrl: '/partials/techSchedule.html',
		replace: true,
		link: function($scope, element, attrs) {
			var x, rangeDate, rangeStart, rangeEnd;

			function setupScale() {
				x = d3.scale.linear()
					.range([0, 100])
					.domain([420, 1320])
					.clamp(true);
			}

			setupScale();

			var color = d3.scale.category20();
			var hourWidth = 100 / 15;

			$scope.hourMarkers = [];
			for (var i = 7; i < 22; i++) {
				$scope.hourMarkers.push({
					date: moment({ hour: i }).toDate(),
					style: {
						left: x(i * 60) + '%',
						width: hourWidth + '%'
					}
				});
			}

                        $scope.$watch('schedule', function(newVal, oldVal) {
                                generateDate();
                        });

                        $scope.$watch('date', function(newVal, oldVal) {
                                setupScale();
                        });

                        function generateDate() {
				var range = moment($scope.date);
				var data = {};

				for (var i = 0; i < 7; i++) {
					var day = range.clone().add(i, 'days');
					var key = day.format('MM-DD-YYYY');
					var label = day.format('ddd MMM Do YYYY');

					data[key] = {
						label: label,
						values: []
					};
				}

				var c = 0;

                                angular.forEach($scope.schedule, function(workorder) {
					var start = moment(workorder.scheduling.start);
					var startMinutes = start.diff(start.clone().startOf('day'), 'minutes');

					var end = moment(workorder.scheduling.end);
					var endMinutes = end.diff(end.clone().startOf('day'), 'minutes');
					
					var length = end.diff(start, 'days') + 1;
					
					console.log('length: ' + length + ' start: ' + startMinutes + ' end: ' + endMinutes);

					var backgroundColor = color(c++);

					for (var i = 0; i < length; i++) {
						var adjStart, adjEnd;

						var key = start.clone().add(i, 'days').format('MM-DD-YYYY');

						if (i == 0)  {
							adjStart = startMinutes;
						} else {
							adjStart = 420;
						}

						if (i == length - 1) {
							adjEnd = endMinutes;
						} else {
							adjEnd = 1320;
						}

						if (data[key]) {
							data[key].values.push({
								style: {
									backgroundColor: color(c),
									left: x(adjStart) + '%',
									width: (x(adjEnd) - x(adjStart)) + '%'
								},
								workorder: workorder
							});
						}

					}

					return;

                                        angular.forEach(workorder.techs, function(tech) {
                                                var key = tech.name.first + ' ' + tech.name.last;

                                                if (!data[key])
                                                        return;

                                                var start = moment(workorder.scheduling.start);
                                                var end = moment(workorder.scheduling.end);

                                                data[key].values.push({
                                                        style: {
                                                                backgroundColor: color(key),
                                                                left: x(start) + "%",
                                                                width: (x(end) - x(start)) + "%"
                                                        },
                                                        workorder: workorder
                                                });
                                        })
                                });

                                $scope.data = data;
                        }
		}
	};
})
.filter('pretty', function() {
	return function(input) {
		return "\n" + angular.toJson(input, true);
	}
})
.directive('techpicker', function() {
	return {
		restrict: 'E',
		scope: {
			users: '=',
			schedule: '=',
			date: '=',
			onEntryClick: '&'
		},
		templateUrl: '/partials/techPicker.html',
		replace: true,
		link: function($scope, element, attrs) {

			var x, rangeDate, rangeStart, rangeEnd;

			function setupScale() {
				rangeDate = moment($scope.date).startOf('day');

				rangeStart = moment(rangeDate).add('hours', 7);
				rangeEnd = moment(rangeDate).add('hours', 22);

				x = d3.time.scale()
					.range([0, 100])
					.domain([rangeStart.toDate(), rangeEnd.toDate()])
					.clamp(true);
			}

			setupScale();

			var color = d3.scale.category20();

			var totalHours = moment.duration(rangeEnd - rangeStart).hours();
			var hourWidth = 100 / totalHours;

			$scope.hourMarkers = [];
			for (var i = 0; i < totalHours; i++) {
				var date = moment(rangeStart).add('hours', i).toDate();
				$scope.hourMarkers.push({
					date: date,
					style: {
						left: x(date) + "%",
						width: hourWidth  + "%"
					}
				});
			}

			$scope.$watch('users', function(newVal, oldVal) {
				generateDate();
			});

			$scope.$watch('schedule', function(newVal, oldVal) {
				generateDate();
			});

			$scope.$watch('date', function(newVal, oldVal) {
				setupScale();
			});

			function generateDate() {
				var data = {};

				var labels = [];

				angular.forEach($scope.users, function(user) {
					var key =  user.name.first + ' ' + user.name.last;
					labels.push(key);
					data[key] = {
						id: user._id,
						values: []
					};
				});

				labels.sort();
				color.domain(labels);

				angular.forEach($scope.schedule, function(workorder) {
					angular.forEach(workorder.techs, function(tech) {
						var key = tech.name.first + ' ' + tech.name.last;

						if (!data[key])
							return;

						var start = moment(workorder.scheduling.start);
						var end = moment(workorder.scheduling.end);

						data[key].values.push({
							style: {
								backgroundColor: color(key),
								left: x(start) + "%",
								width: (x(end) - x(start)) + "%"
							},
							workorder: workorder
						});
					})
				});
				$scope.data = data;
			}
		}
	};
})
.value('uiSelect2Config', {})
.directive('uiSelect2', ['uiSelect2Config', '$timeout', function (uiSelect2Config, $timeout) {
  var options = {};
  if (uiSelect2Config) {
    angular.extend(options, uiSelect2Config);
  }
  return {
    require: 'ngModel',
    priority: 1,
    compile: function (tElm, tAttrs) {
      var watch,
        repeatOption,
        repeatAttr,
        isSelect = tElm.is('select'),
        isMultiple = angular.isDefined(tAttrs.multiple);

      // Enable watching of the options dataset if in use
      if (tElm.is('select')) {
        repeatOption = tElm.find( 'optgroup[ng-repeat], optgroup[data-ng-repeat], option[ng-repeat], option[data-ng-repeat]');

        if (repeatOption.length) {
          repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
          watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
        }
      }

      return function (scope, elm, attrs, controller) {
        // instance-specific options
        var opts = angular.extend({}, options, scope.$eval(attrs.uiSelect2));

        /*
        Convert from Select2 view-model to Angular view-model.
        */
        var convertToAngularModel = function(select2_data) {
          var model;
          if (opts.simple_tags) {
            model = [];
            angular.forEach(select2_data, function(value, index) {
              model.push(value.id);
            });
          } else {
            model = select2_data;
          }
          return model;
        };

        /*
        Convert from Angular view-model to Select2 view-model.
        */
        var convertToSelect2Model = function(angular_data) {
          var model = [];
          if (!angular_data) {
            return model;
          }

          if (opts.simple_tags) {
            model = [];
            angular.forEach(
              angular_data,
              function(value, index) {
                model.push({'id': value, 'text': value});
              });
          } else {
            model = angular_data;
          }
          return model;
        };

        if (isSelect) {
          // Use <select multiple> instead
          delete opts.multiple;
          delete opts.initSelection;
        } else if (isMultiple) {
          opts.multiple = true;
        }
        if (controller) {
          // Watch the model for programmatic changes
           scope.$watch(tAttrs.ngModel, function(current, old) {
            if (!current) {
              return;
            }
            if (current === old) {
              return;
            }
		blah();
//            controller.$render();
          }, true);

          var blah = controller.$render = function () {
            if (isSelect) {
              elm.select2('val', controller.$viewValue);
            } else {
              if (opts.multiple) {
                var viewValue = controller.$viewValue;
                if (angular.isString(viewValue)) {
                  viewValue = viewValue.split(',');
                }
                elm.select2(
                  'data', convertToSelect2Model(viewValue));
              } else {
                if (angular.isObject(controller.$viewValue)) {
                  elm.select2('data', controller.$viewValue);
                } else if (!controller.$viewValue) {
                  elm.select2('data', null);
                } else {
                  elm.select2('val', controller.$viewValue);
                }
              }
            }
          };

          // Watch the options dataset for changes
          if (watch) {
            scope.$watch(watch, function (newVal, oldVal, scope) {
              if (angular.equals(newVal, oldVal)) {
                return;
              }
              // Delayed so that the options have time to be rendered
              $timeout(function () {
                elm.select2('val', controller.$viewValue);
                // Refresh angular to remove the superfluous option
                elm.trigger('change');
                if(newVal && !oldVal && controller.$setPristine) {
                  controller.$setPristine(true);
                }
              });
            });
          }

          // Update valid and dirty statuses
          controller.$parsers.push(function (value) {
            var div = elm.prev();
            div
              .toggleClass('ng-invalid', !controller.$valid)
              .toggleClass('ng-valid', controller.$valid)
              .toggleClass('ng-invalid-required', !controller.$valid)
              .toggleClass('ng-valid-required', controller.$valid)
              .toggleClass('ng-dirty', controller.$dirty)
              .toggleClass('ng-pristine', controller.$pristine);
            return value;
          });

          if (!isSelect) {
            // Set the view and model value and update the angular template manually for the ajax/multiple select2.
            elm.bind("change", function (e) {
              e.stopImmediatePropagation();
              
              if (scope.$$phase || scope.$root.$$phase) {
                return;
              }
              scope.$apply(function () {
                controller.$setViewValue(
                  convertToAngularModel(elm.select2('data')));
              });
            });

            if (opts.initSelection) {
              var initSelection = opts.initSelection;
              opts.initSelection = function (element, callback) {
                initSelection(element, function (value) {
                  var isPristine = controller.$pristine;
                  controller.$setViewValue(convertToAngularModel(value));
                  callback(value);
                  if (isPristine) {
                    controller.$setPristine();
                  }
                  elm.prev().toggleClass('ng-pristine', controller.$pristine);
                });
              };
            }
          }
        }

        elm.bind("$destroy", function() {
          elm.select2("destroy");
        });

        attrs.$observe('disabled', function (value) {
          elm.select2('enable', !value);
        });

        attrs.$observe('readonly', function (value) {
          elm.select2('readonly', !!value);
        });

        if (attrs.ngMultiple) {
          scope.$watch(attrs.ngMultiple, function(newVal) {
            attrs.$set('multiple', !!newVal);
            elm.select2(opts);
          });
        }

        // Initialize the plugin late so that the injected DOM does not disrupt the template compiler
        $timeout(function () {
          elm.select2(opts);

          // Set initial value - I'm not sure about this but it seems to need to be there
          elm.select2('data', controller.$modelValue);
          // important!
          controller.$render();

          // Not sure if I should just check for !isSelect OR if I should check for 'tags' key
          if (!opts.initSelection && !isSelect) {
            var isPristine = controller.$pristine;
            controller.$setViewValue(
              convertToAngularModel(elm.select2('data'))
            );
            if (isPristine) {
              controller.$setPristine();
            }
            elm.prev().toggleClass('ng-pristine', controller.$pristine);
          }
        });
      };
    }
  };
}])
.directive('uiSelect2-old', function ($timeout) {
  var options = {};

  return {
    restrict: 'AC',
    require: '?ngModel',
    compile: function (tElm, tAttrs) {
      var watch,
        repeatOption,
        repeatAttr,
        isSelect = tElm.is('select'),
        isMultiple = (tAttrs.multiple !== undefined);

      // Enable watching of the options dataset if in use
      if (tElm.is('select')) {
        repeatOption = tElm.find('option[ng-repeat], option[data-ng-repeat]');

        if (repeatOption.length) {
          repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
          watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
        }
      }

      return function (scope, elm, attrs, controller) {
        // instance-specific options
        var opts = angular.extend({}, options, scope.$eval(attrs.uiSelect2));

        if (isSelect) {
          // Use <select multiple> instead
          delete opts.multiple;
          delete opts.initSelection;
        } else if (isMultiple) {
          opts.multiple = true;
        }

        if (controller) {
          // Watch the model for programmatic changes
          controller.$render = function () {
            if (isSelect) {
              elm.select2('val', controller.$modelValue);
            } else {
              if (isMultiple) {
                if (!controller.$modelValue) {
                  elm.select2('data', []);
                } else if (angular.isArray(controller.$modelValue)) {
                  elm.select2('data', controller.$modelValue);
                } else {
                  elm.select2('val', controller.$modelValue);
                }
              } else {
                if (angular.isObject(controller.$modelValue)) {
                  elm.select2('data', controller.$modelValue);
                } else {
                  elm.select2('val', controller.$modelValue);
                }
              }
            }
          };

          // Watch the options dataset for changes
          if (watch) {
            scope.$watch(watch, function (newVal, oldVal, scope) {
              if (!newVal) return;
              // Delayed so that the options have time to be rendered
              $timeout(function () {
                elm.select2('val', controller.$viewValue);
                // Refresh angular to remove the superfluous option
                elm.trigger('change');
              });
            });
          }

          if (!isSelect) {
            // Set the view and model value and update the angular template manually for the ajax/multiple select2.
            elm.bind("change", function () {
              scope.$apply(function () {
                controller.$setViewValue(elm.select2('data'));
              });
            });

            if (opts.initSelection) {
              var initSelection = opts.initSelection;
              opts.initSelection = function (element, callback) {
                initSelection(element, function (value) {
                  controller.$setViewValue(value);
                  callback(value);
                });
              };
            }
          }
        }

        attrs.$observe('disabled', function (value) {
          elm.select2(value && 'disable' || 'enable');
        });

        if (attrs.ngMultiple) {
          scope.$watch(attrs.ngMultiple, function(newVal) {
            elm.select2(opts);
          });
        }

        // Set initial value since Angular doesn't
        elm.val(scope.$eval(attrs.ngModel));

        // Initialize the plugin late so that the injected DOM does not disrupt the template compiler
        $timeout(function () {
          elm.select2(opts);
          // Not sure if I should just check for !isSelect OR if I should check for 'tags' key
          if (!opts.initSelection && !isSelect)
            controller.$setViewValue(elm.select2('data'));
        });
      };
    }
  };
});
