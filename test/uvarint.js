import {test, assert, rng, random_bytes} from './utils.js';
import {read, readBigInt, write} from '../src/uvarint.js';

test('uvarint/Number', () => {
	for (let i = 0; i < 10000; i++) {
		let u0 = rng(Number.MAX_SAFE_INTEGER-1);
		let v = [];
		write(v, u0);
		let [u1] = read(v);
		assert.equal(u1, u0);
	}
});

test('uvarint/BigInt', () => {
	for (let i = 0; i < 10000; i++) {
		let u0 = BigInt('0x' + Buffer.from(random_bytes(1+rng(256))).toString('hex'));
		let v = [];
		write(v, u0);
		let [u1] = readBigInt(v);
		assert.equal(u1, u0);
	}
});
