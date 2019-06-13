# first-chunk-stream [![Build Status](https://travis-ci.org/sindresorhus/first-chunk-stream.svg?branch=master)](https://travis-ci.org/sindresorhus/first-chunk-stream)

> Buffer and transform the n first bytes of a stream


## Install

```
$ npm install first-chunk-stream
```


## Usage

```js
const fs = require('fs');
const getStream = require('get-stream');
const FirstChunkStream = require('first-chunk-stream');

// unicorn.txt => unicorn rainbow
const stream = fs.createReadStream('unicorn.txt')
	.pipe(new FirstChunkStream({chunkSize: 7}, async (chunk, encoding) => {
		return chunk.toString(encoding).toUpperCase();
	}));

(async () => {
	const data = await getStream(stream);

	if (data.length < 7) {
		throw new Error('Couldn\'t get the minimum required first chunk length');
	}

	console.log(data);
	//=> 'UNICORN rainbow'
})();
```


## API

### firstChunkStream(options, transform)

Returns a `FirstChunkStream` instance.

#### transform(chunk, encoding)

Type: `Function`

Async function that gets the required `options.chunkSize` bytes.

Note that the buffer can have a smaller length than the required one. In that case, it will be due to the fact that the complete stream contents has a length less than the `options.chunkSize` value. You should check for this yourself if you strictly depend on the length.

#### options

Type: `object`

The options object is passed to the [`Duplex` stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) constructor allowing you to customize your stream behavior. In addition you can specify the following option:

###### chunkSize

Type: `number`

How many bytes you want to buffer.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
