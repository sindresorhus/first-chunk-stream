# first-chunk-stream [![Build Status](https://travis-ci.org/sindresorhus/first-chunk-stream.svg?branch=master)](https://travis-ci.org/sindresorhus/first-chunk-stream)

> Buffer and transform the n first bytes of a stream

## Install

```
$ npm install --save first-chunk-stream
```

## Usage

```js
var fs = require('fs');
var concatStream = require('concat-stream');
var firstChunkStream = require('first-chunk-stream');

// unicorn.txt => unicorn rainbow
fs.createReadStream('unicorn.txt')
	.pipe(firstChunkStream({chunkLength: 7}, function (chunk, enc, cb) {
		this.push(chunk.toUpperCase());
		cb();
	}))
	.pipe(concatStream(function (data) {
		if(data.length < 7) {
			console.log('Couldn\'t get the minimum required first chunk length.');
		}
		console.log(data);
		//=> UNICORN rainbow
	}));
```

Note this is your responsibility to check if the given first chunk isn't too
 small than expected.

## API

### firstChunkStream(options, transform)

Returns a `FirstChunkStream` instance.

#### options

##### options.chunkLength

Type: `number`

How many bytes you want to buffer.

##### options.*

The options object is also passed to the `Duplex` stream constructor allowing
 you to customize your stream behavior.

#### transform(err, chunk, encoding, callback)

*Required*  
Type: `function`

The function that gets the required `options.chunkLength` bytes.

Note that the buffer can have a smaller length than the required one. In that
 case, it will be due to the fact that the overwhole stream content has a length
 inferior than the `òptions.chunkLength` value.

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
