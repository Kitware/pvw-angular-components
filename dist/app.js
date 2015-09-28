
angular.module('pvwebExampleApp', [ 'pvwMeshTaggerModule', 'pvwVisualizerModule' ])
    .directive('demoApp', function() {
        return {
            scope: {},
            controller: 'mainAppController',
            templateUrl: 'main-app.tpl.html'
        };
    })
    .controller('mainAppController', ['$scope', function($scope) {

        $scope.stateInterface = {
            save: function(data) {
                //console.log(data);
                //$scope.savedState = data;
            },
            load: function() {
                return $scope.savedState;
                /*
                // If you saved out the state before, you can pass it back in
                // here to restore the tags you've already created.
                return {
                    faces: [...],
                    blocks: [...]
                };
                */
            }
        };


        $scope.savedState = {};
        $scope.file = {
            name: 'hexMeshH.exo'
        };

        $scope.meshTaggerConnected = false;
        $scope.resultViewerConnected = false;

        $scope.meshTagConnect = function() {
            $scope.meshTaggerConnected = true;
        };

        $scope.meshTagDisconnect = function() {
            $scope.meshTaggerConnected = false;
        };

        $scope.resultViewConnect = function() {
            $scope.resultViewerConnected = true;
        };

        $scope.resultViewDisconnect = function() {
            $scope.resultViewerConnected = false;
        };
     }]);
