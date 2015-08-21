'use strict';
var assert = require('assert');
var firstChunkStream = require('./');
var streamtest = require('streamtest');

describe('firstChunk()', function () {
	var content = 'unicorn rainbows \ncake';

	streamtest.versions.forEach(function (version) {

		describe('for ' + version + ' streams', function () {

			it('should should work for a single oversized chunk', function (cb) {
				streamtest[version].fromChunks([content])
					.pipe(firstChunkStream(function (chunk, enc, cb) {
						this.push(chunk);
						cb();
					}))
					.pipe(streamtest[version].toText(function (err, text) {
						if(err) {
							return done(err);
						}
						assert.deepEqual(text, content);
						cb();
					}));
			});


			it('should should work for required size chunk', function (cb) {
				streamtest[version].fromChunks([content.substr(0, 7), content.substr(7)])
					.pipe(firstChunkStream({minSize: 7}, function (chunk, enc, cb) {
						this.push(chunk);
						cb();
					}))
					.pipe(streamtest[version].toText(function (err, text) {
						if(err) {
							return done(err);
						}
						assert.deepEqual(text, content);
						cb();
					}));
			});

			it('should should work for several small chunks', function (cb) {
				streamtest[version].fromChunks(content.split(''))
					.pipe(firstChunkStream(function (chunk, enc, cb) {
						this.push(chunk);
						cb();
					}))
					.pipe(streamtest[version].toText(function (err, text) {
						if(err) {
							return done(err);
						}
						assert.deepEqual(text, content);
						cb();
					}));
			});

		});

	});

});
