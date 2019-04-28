import test from 'ava';
import streamtest from 'streamtest';
import FirstChunkStream from '.';

const content = 'unicorn rainbows \ncake';

test('fails when the callback is not provided', t => {
	t.throws(() => new FirstChunkStream({chunkLength: 7}));
});

test('fails when trying to use it in objectMode', t => {
	t.throws(
		() => new FirstChunkStream({chunkLength: 7, objectMode: true}, () => {})
	);
});

test('fails when firstChunk size is bad or missing', t => {
	t.throws(() => new FirstChunkStream({chunkLength: 'feferf'}, () => {}));
	t.throws(() => new FirstChunkStream({}, () => {}));
});

streamtest.versions.forEach(version => {
	test.cb(
		`for ${version} streams, emitting errors reports error in the callback before first chunk is sent and allows recovery`,
		t => {
			t.plan(3);

			const stream = new FirstChunkStream(
				{chunkLength: 7},
				(error, chunk, encoding, callback) => {
					t.is(error.message, 'Hey!');
					t.is(chunk.toString('utf-8'), content.substr(0, 2));

					callback(null, Buffer.from(content.substr(0, 7)));
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
			stream.write(Buffer.from(content.substr(7)));
			stream.end();
		}
	);

	test.cb(
		`for ${version} streams, emitting errors reports error in the callback before first chunk is sent and reemits passed errors`,
		t => {
			t.plan(3);

			const stream = new FirstChunkStream(
				{chunkLength: 7},
				(error, chunk, encoding, callback) => {
					t.is(error.message, 'Hey!');

					stream.on('error', error => {
						t.is(error.message, 'Ho!');
					});

					callback(new Error('Ho!'));
				}
			);

			stream.pipe(
				streamtest[version].toText((error, text) => {
					if (error) {
						t.end(error);
						return;
					}

					t.is(text, content.substr(7));
					t.end();
				})
			);

			stream.write(Buffer.from(content[0]));
			stream.write(Buffer.from(content[1]));
			stream.emit('error', new Error('Hey!'));
			stream.write(Buffer.from(content.substr(7)));
			stream.end();
		}
	);

	test.cb(
		`for ${version} streams, emitting errors just emits errors when first chunk is sent`,
		t => {
			t.plan(3);

			const stream = new FirstChunkStream(
				{chunkLength: 7},
				(error, chunk, encoding, callback) => {
					t.pass();

					callback(null, chunk);
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

			stream.write(Buffer.from(content.substr(0, 7)));
			stream.emit('error', new Error('Hey!'));
			stream.write(Buffer.from(content.substr(7)));
			stream.end();
		}
	);

	test.cb(`for ${version} streams, requires a 0 length first chunk`, t => {
		t.plan(2);

		streamtest[version]
			.fromChunks([content])
			.pipe(
				new FirstChunkStream(
					{chunkLength: 0},
					(error, chunk, encoding, callback) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(chunk.toString('utf-8'), '');

						callback(null, Buffer.from('popop'));
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
						{chunkLength: 7},
						(error, chunk, encoding, callback) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf-8'), content.substr(0, 7));

							callback(null, chunk);
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
				.fromChunks([content.substr(0, 7), content.substr(7)])
				.pipe(
					new FirstChunkStream(
						{chunkLength: 7},
						(error, chunk, encoding, callback) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf-8'), content.substr(0, 7));

							callback(null, chunk);
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
						{chunkLength: 7},
						(error, chunk, encoding, callback) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf-8'), content.substr(0, 7));

							callback(null, chunk);
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
					{chunkLength: 7},
					(error, chunk, encoding, callback) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(chunk.toString('utf-8'), content.substr(0, 7));

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

						callback(null, chunk);
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
					{chunkLength: 7},
					(error, chunk, encoding, callback) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(chunk.toString('utf-8'), 'abc');

						callback(null, Buffer.from('b'));
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
						{chunkLength: 7},
						(error, chunk, encoding, callback) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf-8'), content.substr(0, 7));

							callback(null, Buffer.alloc(0));
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content.substr(7));
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
				.fromChunks([content.substr(0, 7), content.substr(7)])
				.pipe(
					new FirstChunkStream(
						{chunkLength: 7},
						(error, chunk, encoding, callback) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf-8'), content.substr(0, 7));

							callback(null, Buffer.concat([chunk, Buffer.from('plop')]));
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, content.substr(0, 7) + 'plop' + content.substr(7));
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
						{chunkLength: 7},
						(error, chunk, encoding, callback) => {
							if (error) {
								t.end(error);
								return;
							}

							t.is(chunk.toString('utf-8'), content.substr(0, 7));

							callback(null, Buffer.from('plop'));
						}
					)
				)
				.pipe(
					streamtest[version].toText((error, text) => {
						if (error) {
							t.end(error);
							return;
						}

						t.is(text, 'plop' + content.substr(7));
						t.end();
					})
				);
		}
	);
});
