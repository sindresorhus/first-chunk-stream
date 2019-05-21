import test from 'ava';
import streamtest from 'streamtest';
import FirstChunkStream from '.';

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

streamtest.versions.forEach(version => {
	test.cb(
		`for ${version} streams, emitting errors reports error in the callback before first chunk is sent and allows recovery`,
		t => {
			t.plan(3);

			const stream = new FirstChunkStream(
				{chunkSize: 7},
				async (error, chunk) => {
					t.is(error.message, 'Hey!');
					t.is(chunk.toString('utf8'), content.slice(0, 2));

					return Buffer.from(content.slice(0, 7));
				}
			);

			stream.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, content);
					t.end();
				})
			);

			stream.write(Buffer.from(content[0]));
			stream.write(Buffer.from(content[1]));
			stream.emit('error', new Error('Hey!'));
			stream.write(Buffer.from(content.slice(7)));
			stream.end();
		}
	);

	test.cb(
		`for ${version} streams, emitting errors reports error in the callback before first chunk is sent and reemits passed errors`,
		t => {
			t.plan(3);

			const stream = new FirstChunkStream(
				{chunkSize: 7},
				async error => {
					t.is(error.message, 'Hey!');

					stream.on('error', error => {
						t.is(error.message, 'Ho!');
					});

					throw new Error('Ho!');
				}
			);

			stream.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, content.slice(7));
					t.end();
				})
			);

			stream.write(Buffer.from(content[0]));
			stream.write(Buffer.from(content[1]));
			stream.emit('error', new Error('Hey!'));
			stream.write(Buffer.from(content.slice(7)));
			stream.end();
		}
	);

	test.cb(
		`for ${version} streams, emitting errors just emits errors when first chunk is sent`,
		t => {
			t.plan(3);

			const stream = new FirstChunkStream(
				{chunkSize: 7},
				async (error, chunk) => {
					t.pass();
					return chunk;
				}
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
				})
			);

			stream.write(Buffer.from(content.slice(0, 7)));
			stream.emit('error', new Error('Hey!'));
			stream.write(Buffer.from(content.slice(7)));
			stream.end();
		}
	);

	test.cb(`for ${version} streams, requires a 0 length first chunk`, t => {
		t.plan(2);

		streamtest[version]
			.fromChunks([content])
			.pipe(
				new FirstChunkStream(
					{chunkSize: 0},
					async (error, chunk) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(chunk.toString('utf8'), '');

						return Buffer.from('popop');
					}
				)
			)
			.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, 'popop' + content);
					t.end();
				})
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));

							return chunk;
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					})
				);
		}
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));

							return chunk;
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					})
				);
		}
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));

							return chunk;
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					})
				);
		}
	);

	test.cb(
		`for ${version} streams, leaves content as is even when consuming the stream in the callback`,
		t => {
			t.plan(2);

			const inputStream = streamtest[version].fromChunks(content.split(''));

			const firstChunkStream = inputStream.pipe(
				new FirstChunkStream(
					{chunkSize: 7},
					async (error, chunk) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(chunk.toString('utf8'), content.slice(0, 7));

						firstChunkStream.pipe(
							streamtest[version].toText((error, text) => {
								if (error) {
									t.end(error);
									return;
								}

								t.is(text, content);
								t.end();
							})
						);

						return chunk;
					}
				)
			);
		}
	);

	test.cb(`for ${version} streams, works with insufficient content`, t => {
		t.plan(2);

		streamtest[version]
			.fromChunks(['a', 'b', 'c'])
			.pipe(
				new FirstChunkStream(
					{chunkSize: 7},
					async (error, chunk) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(chunk.toString('utf8'), 'abc');

						return Buffer.from('b');
					}
				)
			)
			.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, 'b');
					t.end();
				})
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));

							return Buffer.alloc(0);
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content.slice(7));
						t.end();
					})
				);
		}
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));
							return {buffer: chunk.toString('utf8'), encoding: 'utf8'};
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content);
						t.end();
					})
				);
		}
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));
							return FirstChunkStream.stop;
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, '');
						t.end();
					})
				);
		}
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));

							return Buffer.concat([chunk, Buffer.from('plop')]);
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content.slice(0, 7) + 'plop' + content.slice(7));
						t.end();
					})
				);
		}
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
						async (error, chunk) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf8'), content.slice(0, 7));

							return Buffer.from('plop');
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, 'plop' + content.slice(7));
						t.end();
					})
				);
		}
	);
});
