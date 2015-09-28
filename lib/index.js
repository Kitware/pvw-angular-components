var angular = require('angular'),
    meshTagger = require('./meshtagger'),
    visualizer = require('./visualizer'),
    moduleName = 'pvweb-module';

export default moduleName;

angular.module(moduleName, [meshTagger, visualizer]);