
require('../../dist/assets/apps/Visualizer/main.css')

var angular = require('angular'),
    vtkWeb = require('vtkWeb'),
    $ = require('jQuery'),
    pv = require('pv'),

    moduleName = 'pvwVisualizerModule',
    controllerName = 'pvwVisualizerController',
    directiveName = 'pvwVisualizer';

export default moduleName;

angular.module(moduleName, [])
  .directive(directiveName, function() {
    return {
      scope: {
        url: '@url',
        appKey: '@appkey',
        closeOnDestroy: '=closeOnDestroy'
      },
      template: require('../../dist/assets/apps/Visualizer/visualizer-tpl.html'),
      replace: true,
      controller: controllerName
    };
  })
  .controller(controllerName, ['$scope', function($scope) {

    // Some internal variables that do not need to be attached to the $scope
    var autobahnConnection = null,
        session = null,
        launcher = false;

    $scope.connect = function(url, appKey) {
      if(url === undefined) {
         url = '/paraview';
      }

      var configObject = {
         application: appKey,
      };

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

            $('.app-wait-start-page').remove();
            $('.hide-on-start').removeClass('hide-on-start');

            pv.initializeVisualizer(
                session,
                '.pv-viewport', '.pv-pipeline', '.pv-proxy-editor', '.pv-files', '.pv-source-list',
                '.pv-filter-list', '.pv-data-info', '.pv-global-settings-editor', '.pv-savedata-options');

            $('[data-toggle="tooltip"]').tooltip({container: '.pv-visualizer-app'});
         },
         function(code, error) {
            console.log('Autobahn error ' + error);
         });
    };

    $scope.$on("$destroy", function() {
        if ($scope.closeOnDestroy === true) {
            session.call('application.exit.later', []).then(function() {
              autobahnConnection.close();
            });
        }
    });

    $scope.connect($scope.url, $scope.appKey);

  }]);
