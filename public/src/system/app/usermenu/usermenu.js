define(function() {
	return angular.module(
		'usermenu', ['ngRoute', 'ngResource']).run(function($location) {
			$location.url("/index");
		});
});