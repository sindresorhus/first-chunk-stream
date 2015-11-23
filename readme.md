# first-chunk-stream [![Build Status](https://travis-ci.org/sindresorhus/first-chunk-stream.svg?branch=master)](https://travis-ci.org/sindresorhus/first-chunk-stream)

> Buffer and transform the n first bytes of a stream


## Install

```
$ npm install --save first-chunk-stream
```


## Usage

```js
const fs = require('fs');
const getStream = require('get-stream');
const firstChunkStream = require('first-chunk-stream');

// unicorn.txt => unicorn rainbow
const stream = fs.createReadStream('unicorn.txt')
	.pipe(firstChunkStream({chunkLength: 7}, (err, chunk, enc, cb) => {
		if (err) {
			cb(err);
			return;
		}

		cb(null, chunk.toUpperCase());
	}));

getStream(stream).then(data => {
	if (data.length < 7) {
		throw new Error(`Couldn't get the minimum required first chunk length`);
	}

	console.log(data);
	//=> 'UNICORN rainbow'
});
```


## API

### firstChunkStream([options], transform)

Returns a `FirstChunkStream` instance.

#### options

The options object is passed to the [`Duplex` stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) constructor allowing you to customize your stream behavior. In addition you can specify the following option:

##### chunkLength

Type: `number`

How many bytes you want to buffer.

#### transform(err, chunk, encoding, callback)

Type: `function`

The function that gets the required `options.chunkLength` bytes.

Note that the buffer can have a smaller length than the required one. In that case, it will be due to the fact that the complete stream contents has a length less than the `options.chunkLength` value. You should check for this yourself if you strictly depend on the length.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
