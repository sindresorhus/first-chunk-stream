'use strict';

var util = require('util');
var Duplex = require('stream').Duplex;

function FirstChunkStream(options, cb) {
	var _this = this;
	var manager;

	if (!(this instanceof FirstChunkStream)) {
		return new FirstChunkStream(options, cb);
	}

	options = options || {};

	if (!(cb instanceof Function)) {
		throw new Error('FirstChunkStream constructor requires a callback as its second argument.');
	}

	if ('number' !== typeof options.firstChunkSize) {
		throw new Error('FirstChunkStream constructor requires options.firstChunkSize to be a number.');
	}

	Duplex.call(this, options);

	manager = createReadStreamBackpressureManager(this);

	if (1 > options.firstChunkSize) {
		this.__firstChunkSent = true;
	} else {
		this.__firstChunkSent = false;
	}

	this.__firstChunkBuffer = [];
	this.__firstChunkBufferSize = 0;

	this._write = function firstChunkStreamWrite(chunk, encoding, done) {
		if(_this.__firstChunkSent) {
      manager.programPush(chunk, encoding, done);
		} else {
			if(chunk.length < options.firstChunkSize - _this.__firstChunkBufferSize) {
				_this.__firstChunkBuffer.push(chunk);
				_this.__firstChunkBufferSize += chunk.length;
				done();
			} else {
				_this.__firstChunkBuffer.push(chunk.slice(0, options.firstChunkSize - _this.__firstChunkBufferSize));
				chunk = chunk.slice(options.firstChunkSize - _this.__firstChunkBufferSize);
				_this.__firstChunkBufferSize += _this.__firstChunkBuffer[_this.__firstChunkBuffer.length - 1].length;
				cb(null, Buffer.concat(_this.__firstChunkBuffer), encoding, function(err, buf) {
					_this.__firstChunkSent = true;
					if(!(buf.length || chunk.length)) {
						return done();
					}
					manager.programPush(Buffer.concat([buf, chunk]), encoding, done);
				});
			}
		}
	};

  this.on('finish', function firstChunkStreamFinish() {
		if(!_this.__firstChunkSent) {
			cb(new Error('Couldn\'t get the firstChunk!'), Buffer.concat(_this.__firstChunkBuffer));
		}
    manager.programPush(null, {}.undef, function() {});
  });
}

util.inherits(FirstChunkStream, Duplex);

// Utils to manage readable stream backpressure
function createReadStreamBackpressureManager(readableStream) {
  var manager = {
    waitPush: true,
    programmedPushs: [],
    programPush: function programPush(chunk, encoding, done) {
      // Store the current write
      manager.programmedPushs.push([chunk, encoding, done]);
      // Need to be async to avoid nested push attempts
      // Programm a push attempt
      setImmediate(manager.attemptPush);
      // Let's say we're ready for a read
      readableStream.emit('readable');
      readableStream.emit('drain');
    },
    attemptPush: function attemptPush() {
      var nextPush;

      if(manager.waitPush) {
        if(manager.programmedPushs.length) {
          nextPush = manager.programmedPushs.shift();
          manager.waitPush = readableStream.push(nextPush[0], nextPush[1]);
          (nextPush[2])();
        }
      } else {
        setImmediate(function() {
          // Need to be async to avoid nested push attempts
          readableStream.emit('readable');
        });
      }
    },
  };

  // Patch the readable stream to manage reads
  readableStream._read = function streamFilterRestoreRead() {
    manager.waitPush = true;
    // Need to be async to avoid nested push attempts
    setImmediate(manager.attemptPush);
  };

  return manager;
}

module.exports = FirstChunkStream;
