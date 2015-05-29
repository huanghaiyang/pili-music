define(["usermenu"], function(app) {
    'use strict';
    app.config(
        function($routeProvider, $locationProvider) {
            var index = {
                templateUrl: "src/system/app/usermenu/index.html",
                controller: 'IndexController'
            };
            $routeProvider.when("/", index).when('/index', index);

        });
});