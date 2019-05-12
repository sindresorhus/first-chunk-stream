/// <reference types="node"/>
import * as fs from 'fs';
import {Duplex} from 'stream';
import {expectType, expectError} from 'tsd';
import FirstChunkStream = require('.');

const options: FirstChunkStream.Options = {chunkLength: 1};

expectError(new FirstChunkStream());
expectError(new FirstChunkStream({}, () => {}));

const firstChunkStream = new FirstChunkStream(
	{chunkLength: 7},
	(error, chunk, encoding, callback) => {
		expectType<Error | null>(error);
		expectType<Buffer>(chunk);
		expectType<string>(encoding);
		expectType<
			(
				error?: Error | null,
				buffer?: string | Buffer | Uint8Array,
				encoding?: string
			) => void
		>(callback);

		callback();
		callback(null);
		callback(error);
		callback(null, chunk.toString(encoding).toUpperCase());
		callback(null, Buffer.from(chunk.toString(encoding).toUpperCase()));
		callback(
			null,
			new Uint8Array(Buffer.from(chunk.toString(encoding).toUpperCase()))
		);
		callback(null, chunk.toString(encoding).toUpperCase(), 'utf8');
		callback(null, chunk.toString(encoding).toUpperCase(), encoding);
	}
);

expectType<FirstChunkStream>(firstChunkStream);
expectType<Duplex>(firstChunkStream);

fs.createReadStream('unicorn.txt').pipe(firstChunkStream);
