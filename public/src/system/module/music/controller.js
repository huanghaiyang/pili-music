define(["app", "fun"], function(app, Fun) {
	app.controller("MusicController", ["$scope", "$location", "Paginator", "MusicService",
		function($scope, $location, Paginator, MusicService) {
			$scope.pyear = Paginator({
				resource: MusicService
			});
			$scope.reset = function() {
				$scope.name = "";
				$scope.title = "";
				$scope.year = "";
				$scope.artist = "";
				$scope.search();
			};
			$scope.search = function() {
				$scope.pyear.setParams({
					name: $scope.name,
					title: $scope.title,
					year: $scope.year,
					artist: $scope.artist
				});
				$scope.pyear.fresh();
			};
			$scope.delete = function(id) {
				Fun.msg.delConfirm(function() {
					MusicService.delete({
						id: id
					}, function(result) {
						Fun.msg.notify(result);
						$location.path("/music");
					});
				});
			};
		}
	]).controller("MusicNewController", ["$scope", "$location", "MusicService",
		function($scope, $location, MusicService) {
			$scope.save = function() {
				MusicService.save($scope.music, function(result) {
					Fun.msg.notify(result);
					$location.path("/music");
				});
			}
		}
	]);
});