'use strict';
var assert = require('assert');
var fs = require('fs');
var concat = require('concat-stream');
var firstChunk = require('./');

it('should should ensure the first chunk is minimum of a set size', function (cb) {
	var i = 0;

	var stream = fs.createReadStream('fixture', {highWaterMark: 1})
		.pipe(firstChunk({minSize: 7}, function (chunk, enc, cb) {
			i++;
			this.push(chunk);
			cb();
		}));

	stream.once('data', function (data) {
		assert.strictEqual(data.toString(), 'unicorn');
	});

	stream.pipe(concat(function (data) {
		assert.deepEqual(data, fs.readFileSync('fixture'));
	}));

	stream.on('end', function () {
		assert.strictEqual(i, 1);
		cb();
	});
});

it('should should work with default `highWaterMark`', function (cb) {
	fs.createReadStream('fixture')
		.pipe(firstChunk(function (chunk, enc, cb) {
			this.push(chunk);
			cb();
		}))
		.pipe(concat(function (data) {
			assert.deepEqual(data, fs.readFileSync('fixture'));
			cb();
		}));
});
