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
    restrict: 'A',
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
      if(isTouch && element.prop('type') === 'text') {

        element.prop('type', 'date');
        element.on('change', function(ev) {
          scope.$apply(function () {
            controller.$setViewValue(moment(element.val()).toDate());
          });
        });

      } else {

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

      }

      // Support add-on
      var component = element.siblings('[data-toggle="datepicker"]');
      if(component.length) {
        component.on('click', function() { element.trigger('focus'); });
      }

    }
  };
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
			var timePickerParser = d3.time.format('%I:%M%p');

			var rangeStart = timePickerParser.parse('7:00am');
			var rangeEnd = timePickerParser.parse('10:00pm');

			var x = d3.time.scale()
				.range([0, 100])
				.domain([rangeStart, rangeEnd]);

			var color = d3.scale.category20();

			var totalHours = moment.duration(moment(rangeEnd) - moment(rangeStart)).hours();
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

			function generateDate() {
				var data = {};

				var labels = [];

				angular.forEach($scope.users, function(user) {
					var key =  user.name.first + ' ' + user.name.last;
					labels.push(key);
					data[key] = [];
				});

				labels.sort();
				color.domain(labels);

				angular.forEach($scope.schedule, function(workorder) {
					angular.forEach(workorder.techs, function(tech) {
						var key = tech.name.first + ' ' + tech.name.last;

            if (!data[key])
              return;

						var start = moment(workorder.scheduling.start).year(1900).month(0).date(1).toDate();
						var end = moment(workorder.scheduling.end).year(1900).month(0).date(1).toDate();

						data[key].push({
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
.directive('uiSelect2', function ($timeout) {
  var options = {};

  return {
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