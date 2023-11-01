import fs from 'node:fs';
import {type Duplex as DuplexStream} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {stringToUint8Array} from 'uint8array-extras';
import FirstChunkStream from './index.js';

expectError(new FirstChunkStream({}, () => {})); // eslint-disable-line @typescript-eslint/no-empty-function

const firstChunkStream = new FirstChunkStream({chunkSize: 7}, async (chunk, encoding) => {
	expectType<Uint8Array>(chunk);
	expectType<string>(encoding);
	return '';
});
expectType<FirstChunkStream>(firstChunkStream);
expectType<DuplexStream>(firstChunkStream);

fs.createReadStream('unicorn.txt').pipe(firstChunkStream);

expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => FirstChunkStream.stop));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ''));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => stringToUint8Array('') as Uint8Array));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => 'string'));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => new Uint8Array(0)));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: stringToUint8Array('') as Uint8Array})));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: new Uint8Array(0)})));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: 'string'})));
expectType<FirstChunkStream>(new FirstChunkStream({chunkSize: 7}, async () => ({buffer: 'string', encoding: 'utf8'})));
