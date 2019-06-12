/// <reference types="node"/>
import * as fs from 'fs';
import {Duplex} from 'stream';
import {expectType, expectError} from 'tsd';
import FirstChunkStream = require('.');

const options: FirstChunkStream.Options = {chunkSize: 1};

expectError(new FirstChunkStream({}, () => {}));

const firstChunkStream = new FirstChunkStream({chunkSize: 7}, async (chunk, encoding) => {
		expectType<Buffer>(chunk);
		expectType<string>(encoding);
		return '';
});
expectType<FirstChunkStream>(firstChunkStream);
expectType<Duplex>(firstChunkStream);

fs.createReadStream('unicorn.txt').pipe(firstChunkStream);

expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => FirstChunkStream.stop));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ''));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => Buffer.from('')));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => 'string'));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => new Uint8Array(0)));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => {
	return {buffer: Buffer.from('')};
}));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => {
	return {buffer: new Uint8Array(0)};
}));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => {
	return {buffer: 'string'};
}));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => {
	return {buffer: 'string', encoding: 'utf8'};
}));
