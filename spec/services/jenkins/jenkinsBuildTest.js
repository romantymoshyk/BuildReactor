define([
	'services/jenkins/jenkinsBuild',
	'services/request',
	'rx'
], function (Build, request, Rx) {
	'use strict';

	describe('services/jenkins/jenkinsBuild', function () {

		var build;
		var settings;
		var jobJson;
		var lastCompletedBuildJson;

		beforeEach(function () {
			settings = {
				url: 'http://example.com'
			};
			jobJson = JSON.parse(readFixtures('jenkins/job.json'));
			lastCompletedBuildJson = JSON.parse(readFixtures('jenkins/lastCompletedBuild.json'));
			var callCount = 0;
			spyOn(request, 'json').andCallFake(function () {
				callCount++;
				switch (callCount) {
				case 1:
					return Rx.Observable.returnValue(jobJson);
				case 2:
					return Rx.Observable.returnValue(lastCompletedBuildJson);
				}
			});
			build = new Build('build_id', settings);
		});

		it('should make call on update for guest', function () {
			build.update();

			expect(request.json).toHaveBeenCalled();
			expect(request.json.calls[0].args[0].url).toBe('http://example.com/job/build_id/api/json');
			expect(request.json.calls[1].args[0].url).toBe('http://example.com/job/build_id/lastCompletedBuild/api/json');
		});

		it('should parse response and return current state', function () {
			build.update().subscribe(function (state) {
				expect(state.id).toBe('build_id');
				expect(state.name).toBe('build_id');
				expect(state.webUrl).toBe('http://ci.jenkins-ci.org/job/config-provider-model/1354/');
				expect(state.isBroken).toBe(false);
				expect(state.isRunning).toBe(false);
				expect(state.isDisabled).toBe(false);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isBroken', function () {
			lastCompletedBuildJson.result = 'FAILURE';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should not set isBroken on successful build', function () {
			lastCompletedBuildJson.result = 'SUCCESS';

			build.update().subscribe(function (state) {
				expect(state.isBroken).toBe(false);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isRunning', function () {
			jobJson.lastBuild.number = 100;
			jobJson.lastCompletedBuild.number = 99;

			build.update().subscribe(function (state) {
				expect(state.isRunning).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should not set isRunning if it is not', function () {
			jobJson.lastBuild.number = 100;
			jobJson.lastCompletedBuild.number = 100;

			build.update().subscribe(function (state) {
				expect(state.isRunning).toBe(false);
			});

			expect(request.json).toHaveBeenCalled();
		});

		it('should set isDisabled if build disabled', function () {
			jobJson.buildable = false;

			build.update().subscribe(function (state) {
				expect(state.isDisabled).toBe(true);
			});

			expect(request.json).toHaveBeenCalled();
		});

	});

	describe('services/jenkins/jenkinsRequest', function () {

		var settings;

		beforeEach(function () {
			settings = {
				url: 'http://example.com/',
				username: 'username1',
				password: 'password1'
			};
		});

	});

});