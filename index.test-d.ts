import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {Duplex as DuplexStream} from 'node:stream';
import {expectType, expectError} from 'tsd';
import FirstChunkStream from './index.js';

expectError(new FirstChunkStream({}, () => {})); // eslint-disable-line @typescript-eslint/no-empty-function

const firstChunkStream = new FirstChunkStream({chunkSize: 7}, async (chunk, encoding) => {
	expectType<Buffer>(chunk);
	expectType<string>(encoding);
	return '';
});
expectType<FirstChunkStream>(firstChunkStream);
expectType<DuplexStream>(firstChunkStream);

fs.createReadStream('unicorn.txt').pipe(firstChunkStream); // eslint-disable-line @typescript-eslint/no-unsafe-member-access

expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => FirstChunkStream.stop));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ''));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => Buffer.from('')));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => 'string'));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => new Uint8Array(0)));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: Buffer.from('')})));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: new Uint8Array(0)})));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: 'string'})));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: 'string', encoding: 'utf8'})));
