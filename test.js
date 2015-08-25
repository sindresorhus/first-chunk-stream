'use strict';
var assert = require('assert');
var firstChunkStream = require('./');
var streamtest = require('streamtest');

describe('firstChunk()', function () {
	var content = 'unicorn rainbows \ncake';

	describe('should fail', function() {

		it('when the callback is not providen', function() {
			assert.throws(function() {
				firstChunkStream({
					chunkLength: 7
				});
			});
		});

		it('when trying to use it in objectMode', function() {
			assert.throws(function() {
				firstChunkStream({
					chunkLength: 7,
					objectMode: true
				}, function() {});
			});
		});

		it('when firstChunk size is bad or missing', function() {
			assert.throws(function() {
				firstChunkStream({
					chunkLength: 'feferf'
				}, function() {});
			});
			assert.throws(function() {
				firstChunkStream({}.undef, function() {});
			});
		});

	});

	streamtest.versions.forEach(function (version) {

		describe('for ' + version + ' streams', function () {

			describe('emitting errors', function () {

				it('should report error in the callback before first chunk is sent and allow recovery', function (done) {
					var callbackCalled = false;
					var stream = firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
						assert.equal(err.message, 'Hey!');
						assert.equal(chunk.toString('utf-8'), content.substr(0, 2));
						callbackCalled = true;
						cb(null, new Buffer(content.substr(0, 7)));
					});

					stream.pipe(streamtest[version].toText(function (err, text) {
						if(err) {
							return done(err);
						}
						assert.deepEqual(text, content);
						assert(callbackCalled, 'Callback has been called.');
						done();
					}));

					stream.write(new Buffer(content[0]));
					stream.write(new Buffer(content[1]));
					stream.emit('error', new Error('Hey!'));
					stream.write(new Buffer(content.substr(7)));
					stream.end();
				});

				it('should report error in the callback before first chunk is sent and reemit passed errors', function (done) {
					var callbackCalled = false;
					var errEmitted = false;
					var stream = firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
						assert.equal(err.message, 'Hey!');
						callbackCalled = true;
						stream.on('error', function(err) {
							assert.equal(err.message, 'Ho!');
							errEmitted = true;
						});
						cb(new Error('Ho!'));
					});

					stream.pipe(streamtest[version].toText(function (err, text) {
						if(err) {
							return done(err);
						}
						assert.deepEqual(text, content.substr(7));
						assert(callbackCalled, 'Callback has been called.');
						assert(errEmitted, 'Error has been emitted.');
						done();
					}));

					stream.write(new Buffer(content[0]));
					stream.write(new Buffer(content[1]));
					stream.emit('error', new Error('Hey!'));
					stream.write(new Buffer(content.substr(7)));
					stream.end();
				});

				it('should just emit errors when first chunk is sent', function (done) {
					var callbackCalled = false;
					var errEmitted = false;
					var stream = firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
						callbackCalled = true;
						cb(null, chunk);
					});

					stream.on('error', function(err) {
						assert.equal(err.message, 'Hey!');
						errEmitted = true;
					});

					stream.pipe(streamtest[version].toText(function (err, text) {
						if(err) {
							return done(err);
						}
						assert.deepEqual(text, content);
						assert(callbackCalled, 'Callback has been called.');
						assert(errEmitted, 'Error has been emitted.');
						done();
					}));

					stream.write(new Buffer(content.substr(0, 7)));
					stream.emit('error', new Error('Hey!'));
					stream.write(new Buffer(content.substr(7)));
					stream.end();
				});

			});

			describe('and leaving content as is', function () {

				it('should work for a single oversized chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks([content])
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
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
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
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
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
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

			describe('and insufficient content', function () {

				it('should work', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks(['a', 'b', 'c'])
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
							if(err) {
								return done(err);
							}
							assert.equal(chunk.toString('utf-8'), 'abc');
							callbackCalled = true;
							cb(null, new Buffer('b'));
						}))
						.pipe(streamtest[version].toText(function (err, text) {
							if(err) {
								return done(err);
							}
							assert.deepEqual(text, 'b');
							assert(callbackCalled, 'Callback has been called.');
							done();
						}));
				});

			});

			describe('and changing content', function () {

				it('should work when removing the first chunk', function (done) {
					var callbackCalled = false;

					streamtest[version].fromChunks([content])
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
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
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
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
						.pipe(firstChunkStream({chunkLength: 7}, function (err, chunk, enc, cb) {
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
