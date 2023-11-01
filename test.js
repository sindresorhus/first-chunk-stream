import test from 'ava';
import streamtest from 'streamtest';
import {concatUint8Arrays, stringToUint8Array, uint8ArrayToString} from 'uint8array-extras';
import FirstChunkStream from './index.js';

const content = 'unicorn rainbows \ncake';

/* eslint-disable no-new */
test('fails when the options are not provided', t => {
	t.throws(() => {
		new FirstChunkStream();
	});
});

test('fails when the callback is not provided', t => {
	t.throws(() => {
		new FirstChunkStream({chunkSize: 7});
	});
});

test('fails when trying to use it in objectMode', t => {
	t.throws(() => {
		new FirstChunkStream({chunkSize: 7, objectMode: true}, () => {});
	});
});

test('fails when firstChunk size is bad or missing', t => {
	t.throws(() => {
		new FirstChunkStream({chunkSize: 'feferf'}, () => {});
	});

	t.throws(() => {
		new FirstChunkStream({}, () => {});
	});
});
/* eslint-enable no-new */

for (const version of streamtest.versions) {
	test.cb(
		`for ${version} streams, emitting errors emits errors before first chunk is sent`,
		t => {
			t.plan(4);

			const stream = new FirstChunkStream(
				{chunkSize: 7},
				async chunk => {
					t.pass();
					return chunk;
				},
			);

			stream.on('error', error => {
				t.is(error.message, 'Hey!');
			});

			stream.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, content);
					t.end();
				}),
			);

			stream.write(stringToUint8Array(content.slice(0, 3)));
			stream.emit('error', new Error('Hey!'));
			stream.write(stringToUint8Array(content.slice(3, 7)));
			stream.emit('error', new Error('Hey!'));
			stream.write(stringToUint8Array(content.slice(7)));
			stream.end();
		},
	);

	test.cb(
		`for ${version} streams, throwing errors from callback emits error`,
		t => {
			t.plan(2);

			const stream = new FirstChunkStream(
				{chunkSize: 7},
				async () => {
					throw new Error('Ho!');
				},
			);

			stream.on('error', error => {
				t.is(error.message, 'Ho!');
			});

			stream.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, content.slice(7));
					t.end();
				}),
			);

			stream.write(stringToUint8Array(content.slice(0, 7)));
			stream.write(stringToUint8Array(content.slice(7)));
			stream.end();
		},
	);

	test.cb(`for ${version} streams, requires a 0 length first chunk`, t => {
		t.plan(2);

		streamtest[version]
			.fromChunks([content])
			.pipe(
				new FirstChunkStream(
					{chunkSize: 0},
					async chunk => {
						t.is(uint8ArrayToString(chunk), '');
						return stringToUint8Array('popop');
					},
				),
			)
			.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, 'popop' + content);
					t.end();
				}),
			);
	});

	test.cb(
		`for ${version} streams, leaves content as is with a single oversized chunk`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks([content])
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return chunk;
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, leaves content as is with required size chunk`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks([content.slice(0, 7), content.slice(7)])
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return chunk;
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, leaves content as is with several small chunks`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks(content.split(''))
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return chunk;
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, leaves content as is even when consuming the stream in the callback`,
		t => {
			t.plan(2);

			const inputStream = streamtest[version].fromChunks(content.split(''));

			const firstChunkStream = inputStream.pipe(
				new FirstChunkStream(
					{chunkSize: 7},
					async chunk => {
						t.is(uint8ArrayToString(chunk), content.slice(0, 7));

						firstChunkStream.pipe(
							streamtest[version].toText((error, text) => {
								if (error) {
									t.end(error);
									return;
								}

								t.is(text, content);
								t.end();
							}),
						);

						return chunk;
					},
				),
			);
		},
	);

	test.cb(`for ${version} streams, works with insufficient content`, t => {
		t.plan(2);

		streamtest[version]
			.fromChunks(['a', 'b', 'c'])
			.pipe(
				new FirstChunkStream(
					{chunkSize: 7},
					async chunk => {
						t.is(uint8ArrayToString(chunk), 'abc');
						return stringToUint8Array('b');
					},
				),
			)
			.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, 'b');
					t.end();
				}),
			);
	});

	test.cb(
		`for ${version} streams, works with changing content when removing the first chunk`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks([content])
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return new Uint8Array(0);
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content.slice(7));
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, works with string and encoding`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks([content])
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return {buffer: uint8ArrayToString(chunk), encoding: 'utf8'};
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, works with stop`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks([content])
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return FirstChunkStream.stop;
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, '');
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, works with changing content when replacing per a larger chunk`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks([content.slice(0, 7), content.slice(7)])
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return concatUint8Arrays([chunk, stringToUint8Array('plop')]);
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content.slice(0, 7) + 'plop' + content.slice(7));
						t.end();
					}),
				);
		},
	);

	test.cb(
		`for ${version} streams, works with changing content when replacing per a smaller chunk`,
		t => {
			t.plan(2);

			streamtest[version]
				.fromChunks(content.split(''))
				.pipe(
					new FirstChunkStream(
						{chunkSize: 7},
						async chunk => {
							t.is(uint8ArrayToString(chunk), content.slice(0, 7));
							return stringToUint8Array('plop');
						},
					),
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, 'plop' + content.slice(7));
						t.end();
					}),
				);
		},
	);
}
