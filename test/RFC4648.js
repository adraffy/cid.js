import {test, assert, rng, random_bytes} from './utils.js';
import {Multibase} from '../src/index.js';

function check_buffer(mb, encoding) {
	test(`RFC4648/buffer/${encoding}`, () => {
		for (let i = 0; i < 1000; i++) {
			let v0 = random_bytes(rng(1024));
			let enc0 = Buffer.from(v0).toString(encoding);
			let enc1 = mb.encode(v0);
			assert.equal(enc0, enc1);
			let v1 = mb.decode(enc0);
			assert.deepEqual(v0, v1);
		}
	});
}

function check_padded(name) {
	test(`RFC4648/padded/${name}`, () => {
		// unpadded can digest padded
		let enc = Multibase.for(name).encode([1]); 
		assert(enc.endsWith('='));
		Multibase.for(name.replace('pad', '')).decode(enc); 
	});
}

check_buffer(Multibase.for('M'), 'base64');
check_buffer(Multibase.for('u'), 'base64url');
check_buffer(Multibase.for('f'), 'hex');

check_padded('base32hexpad');
check_padded('base32hexpadupper');
check_padded('base64pad');
