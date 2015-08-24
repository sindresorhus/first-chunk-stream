'use strict';
var assert = require('assert');
var firstChunkStream = require('./');
var streamtest = require('streamtest');

describe('firstChunk()', function () {
	var content = 'unicorn rainbows \ncake';

	streamtest.versions.forEach(function (version) {

		describe('for ' + version + ' streams', function () {

			describe('and leaving content as is', function () {

				it('should work for a single oversized chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks([content])
						.pipe(firstChunkStream({firstChunkSize: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), content.substr(0, 7));
							callbackCalled = true;
							cb(null, chunk);
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, content);
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});


				it('should work for required size chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks([content.substr(0, 7), content.substr(7)])
						.pipe(firstChunkStream({firstChunkSize: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), content.substr(0, 7));
							callbackCalled = true;
							cb(null, chunk);
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, content);
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});

				it('should work for several small chunks', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks(content.split(''))
						.pipe(firstChunkStream({firstChunkSize: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), content.substr(0, 7));
							callbackCalled = true;
							cb(null, chunk);
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, content);
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});

			});

			describe('and changing content', function () {

				it('should work when removing the first chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks([content])
						.pipe(firstChunkStream({firstChunkSize: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), content.substr(0, 7));
							callbackCalled = true;
							cb(null, new Buffer(0));
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, content.substr(7));
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});


				it('should work when replacing per a larger chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks([content.substr(0, 7), content.substr(7)])
						.pipe(firstChunkStream({firstChunkSize: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), content.substr(0, 7));
							callbackCalled = true;
							cb(null, Buffer.concat([chunk, new Buffer('plop')]));
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, content.substr(0, 7) + 'plop' + content.substr(7));
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});

				it('should work when replacing per a smaller chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks(content.split(''))
						.pipe(firstChunkStream({firstChunkSize: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), content.substr(0, 7));
							callbackCalled = true;
							cb(null, new Buffer('plop'));
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, 'plop' + content.substr(7));
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});

			});

		});

	});

});
