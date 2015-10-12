
require('./style.css');

var angular = require('angular'),
    angularMaterial = require('angular-material'),
    vtkWeb = require('vtkWeb'),
    $ = require('jQuery'),

    moduleName = 'pvwMeshTaggerModule',
    controllerName = 'pvwMeshTaggerController',
    directiveName = 'pvwMeshTagger';

export default moduleName;

angular.module(moduleName, [ angularMaterial ])
  .directive(directiveName, function() {
    return {
      scope: {
        url: '=',
        appKey: '@appkey',
        state: '=',
        config: '=',
        fileToLoad: '=loadfile'
      },
      template: require('./directive.tpl.html'),
      replace: true,
      controller: controllerName
    };
  })
  .controller(controllerName, ['$scope', '$window', '$mdDialog', '$timeout', function($scope, $window, $mdDialog, $timeout) {

    // Some internal variables that do not need to be attached to the $scope
    var autobahnConnection = null,
        viewport = null,
        colorPalette = [
               "#76c9fb", "#7d85f8", "#8ff696", "#99b5ad", "#bfad71",
               "#fed50c", "#e8285d", "#fa4627", "#9c37fe", "#1353fe"
               ],
        session = null,
        launcher = false,
        stateLoaded = false;

    $scope.showingControlTab = true;
    $scope.outlineVisible = true;
    $scope.showingFaces = true;
    $scope.activeElement = 0;

    $scope.faces = [];
    $scope.blocks = [];

    function setBusy() {
        $('.busy-spinner-indicator').css('display', 'block');
    }

    function unsetBusy() {
        $('.busy-spinner-indicator').css('display', 'none');
    }

    function rerender() {
        viewport.render(function() {
            unsetBusy();
        });
    }

    $scope.connect = function(url, appKey) {
      if(url === undefined) {
         url = '/paraview';
      }

      var configObject = {
         application: appKey,
         fileToLoad: $scope.fileToLoad
      };
      angular.extend(configObject, $scope.config);

      if(url.indexOf("ws") === 0) {
         configObject.sessionURL = url;
      } else {
         launcher = true;
         configObject.sessionManagerURL = url;
      }

      vtkWeb.smartConnect(configObject,
         function(connection) {
            autobahnConnection = connection.connection;
            session = connection.session;
            viewport = vtkWeb.createViewport({session:connection.session});
            viewport.bind(".hydra-mesh-viewer .renderer");
            viewport.resetCamera();

            // Handle window resize
            $window.onresize = rerender;

            // Try to load a previous tagging state
            if ($scope.state) {
                stateLoaded = true;
                $scope.state.load(function(myState) {
                  if (myState.hasOwnProperty('faces')) {
                      $scope.faces = angular.copy(myState.faces);
                      $scope.elements = $scope.faces;
                  }
                  if (myState.hasOwnProperty('blocks')) {
                      $scope.blocks = myState.blocks;
                  }
                  stateLoaded = false;
                  unsetBusy();
                });
            }

            // Take the faces and blocks and color each one according to it's internal color property
            function setupColoring() {
                var totalNumberOfElements = $scope.faces.length + $scope.blocks.length,
                    currentlyRecoloredCount = 0;

                function rerenderAfterAll() {
                    currentlyRecoloredCount += 1;
                    if (currentlyRecoloredCount === totalNumberOfElements) {
                        rerender();
                    }
                }

                function initColors(scopeArray, type, updateLut) {
                    for(var index = 0; index < scopeArray.length; ++index) {
                      session.call('toggle.color', [ type, index, scopeArray[index].color, updateLut ]).then(rerenderAfterAll);
                    }
                }

                initColors($scope.blocks, 'blocks', false);
                initColors($scope.faces, 'faces', true);

                $scope.elements = $scope.faces;
                $scope.$apply();
            }

            // Get faces and blocks lists from the server if we don't have them already.
            if (stateLoaded === false) {
                function acquireElements(scopeArray, subsetArray) {
                    var size = subsetArray.length;
                    for (var i = 0; i < size; ++i) {
                        var elt = subsetArray[i];
                        scopeArray.push({
                            visible: elt.visible,
                            id: elt.id,
                            name: elt.name,
                            tags: [],
                            color: colorPalette[i % colorPalette.length]
                        });
                    }
                }

                setBusy();
                session.call('extract.subsets', []).then(function(subsets) {
                    acquireElements($scope.faces, subsets.faces);
                    acquireElements($scope.blocks, subsets.blocks);
                    setupColoring();
                });
            } else {
              // If we did receive stored state, then just color the faces and blocks
              setBusy();
              setupColoring();
            }
         },
         function(code, error) {
            console.log('Autobahn error ' + error);
         });
    };

    $scope.toggleControlTab = function() {
        $scope.showingControlTab = !$scope.showingControlTab;
        $('.control-tab').toggleClass('open closed');
        if ($scope.showingControlTab) {
            $('.hydra-mesh-viewer > .control-panel').css('border-radius', '5px 5px 0 0');
        } else {
            $('.hydra-mesh-viewer > .control-panel').css('border-radius', '5px');
        }
    };

    $scope.toggleVisibility = function(index) {
        setBusy();
        if(index === -1) {
           // Toggle outline
           $scope.outlineVisible = !$scope.outlineVisible;
           session.call('toggle.visibility', [ -1, $scope.outlineVisible ]).then(function(){
              rerender();
           });
        } else if (index < 0 && $scope.elements.length) {
           var count = $scope.elements.length,
               allVisible = (index === -2 ? true : false);
           while(count--) {
              $scope.elements[count].visible = allVisible;
           }
           session.call('toggle.visibility', [ -2, allVisible ]).then(function(){
              rerender();
           });
        } else {
           $scope.elements[index].visible = !$scope.elements[index].visible;
           session.call('toggle.visibility', [ index, $scope.elements[index].visible ]).then(function(){
              rerender();
           });
        }
    };

    $scope.toggleElementType = function() {
        setBusy();
        $timeout(function() {
            $scope.showingFaces = !$scope.showingFaces;

            if ($scope.showingFaces) {
                $scope.elements = $scope.faces;
            } else {
                $scope.elements = $scope.blocks;
            }

            session.call('set.showing.elements', [$scope.showingFaces]).then(function() {
                rerender();
            });
        }, 20);
    };

    $scope.updateActiveElement = function(index) {
      $scope.activeElement = index;
    };

    function getNextColor(oldColor) {
        var oldIndex = colorPalette.indexOf(oldColor);
        oldIndex++;
        oldIndex = (oldIndex < 0) ? 0 : (oldIndex >= colorPalette.length ? 0 : oldIndex);
        return colorPalette[oldIndex];
    }

    $scope.changeColor = function(index) {
      setBusy();
      $scope.elements[index].color = getNextColor($scope.elements[index].color);
      session.call('toggle.color', [ 'faces', index, $scope.elements[index].color, true ]).then(function(){
         rerender();
      });
    };

    $scope.resetCamera = function() {
        if(viewport) {
            setBusy();
            viewport.resetCamera();
            unsetBusy();
        }
    };

    $scope.toggleBackgroundColor = function() {
        setBusy();
        session.call('toggle.bg.color', []).then(function(newBgColor){
            console.log("New background color:");
            console.log(newBgColor);
            if (newBgColor[0] < 0.5) {
                $('.busy-spinner-indicator').css('color', 'white');
                $('.hydra-mesh-viewer > .control-panel').css('background-color', '#aaaaaa').css('color', 'black');
                $('.hydra-mesh-viewer > .control-tab.open').css('border', 'none');
            } else {
                $('.busy-spinner-indicator').css('color', 'black');
                $('.hydra-mesh-viewer > .control-panel').css('background-color', '#444444').css('color', 'white');
                if (Math.abs(newBgColor[0] - 1.0) <= 0.000001) {
                    $('.hydra-mesh-viewer > .control-tab.open').css('border', '1px solid gray');
                } else {
                    $('.hydra-mesh-viewer > .control-tab.open').css('border', 'none');
                }
            }
            rerender();
        });
    };

    $scope.tag = function(event) {
        var elements = $scope.elements,
            dialogTitle = $scope.showingFaces ? "Tag Mesh Faces" : "Tag Mesh Blocks",
            elementInputLabel = $scope.showingFaces ? "List of faces" : "List of blocks";

          function saveAnnotation() {
              $scope.state.save({
                faces: $scope.faces,
                blocks: $scope.blocks
              });
          }

          // return a-b
          function arraySubtract(a, b) {
              var result = [],
                  count = a.length;

              while(count--) {
                  if(b.indexOf(a[count]) === -1) {
                      result.push(a[count]);
                  }
               }

               return result;
          }

          function extractUnique(array) {
              var uniqueArray = [],
                  count = array.length;

              while(count--) {
                  if(uniqueArray.indexOf(array[count]) === -1) {
                      uniqueArray.push(array[count]);
                  }
              }

              return uniqueArray;
          }

          $mdDialog.show({
              controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
                  var indexList = [], elementList = [], count;

                  // Update elements
                  for (var idx=0; idx<elements.length; ++idx) {
                     if(elements[idx].visible) {
                        indexList.push(idx);
                        elementList.push(elements[idx].id);
                     }
                  }

                  // Update tags
                  function isTagShared(name) {
                      console.log(name + ' => ' + indexList);
                      var count = indexList.length;
                      while(count--) {
                          var tags = elements[indexList[count]].tags;
                          if(tags.indexOf(name) === -1) {
                              console.log("==> no");
                              return false;
                          }
                      }
                      console.log("==> ok");
                      return true;
                  }

                  function extractAllUnionFaceTags() {
                     var count = indexList.length,
                        allTags = [],
                        uniqueTags = [],
                        unionTags = [];

                     // Extract all
                     while(count--) {
                        allTags = allTags.concat(elements[indexList[count]].tags);
                     }

                     // Keep union of tags
                     uniqueTags = extractUnique(allTags);
                     count = uniqueTags.length;
                     while(count--) {
                        if(isTagShared(uniqueTags[count])) {
                           unionTags.push(uniqueTags[count]);
                        }
                     }

                     return unionTags;
                  }

                  $scope.data = {
                     title: dialogTitle,
                     elementInputLabel: elementInputLabel,
                     union: extractAllUnionFaceTags(),
                     indices: indexList,
                     ids: elementList.join(', '),
                     tags: extractAllUnionFaceTags().join(', ')
                  };

                  $scope.ok = function(response) {
                      $mdDialog.hide(response);
                  };
                  $scope.cancel = function() {
                      $mdDialog.cancel();
                  };
              }],
              template: require('./dialog.tpl.html'),
              targetEvent: event,
         })
         .then(function(formData) {
            var tags = formData.tags.split(','),
               eltIndices = formData.indices,
               unionList = formData.union,
               count = 0;

            if(tags.length === 1 && tags[0].trim() === "") {
               tags.pop();
            }

            count = tags.length;
            while(count--) {
               tags[count] = tags[count].trim();
            }

            count = eltIndices.length;
            while(count--) {
                var idx = eltIndices[count],
                    listToKeep = arraySubtract(elements[idx].tags, unionList);

                elements[idx].tags = listToKeep.concat(tags);
            }

            saveAnnotation();
         }, function() {
         });
    };

    $scope.$on("$destroy", function() {
        session.call('application.exit.later', []).then(function() {
          autobahnConnection.close();
        });
    });

    $scope.connect($scope.url, $scope.appKey);

  }]);
