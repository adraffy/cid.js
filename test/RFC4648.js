import {Multibase} from '../src/index.js';
import {rng, random_bytes} from './utils.js';

function check_buffer(mb, encoding) {
	for (let i = 0; i < 1000; i++) {
		let v0 = random_bytes(rng(1024));
		let enc0 = Buffer.from(v0).toString(encoding);
		let enc1 = mb.encode(v0);
		if (enc0 !== enc1) {
			console.log({encoding, v0, enc0, enc1});
			throw 'encode';
		}
		let v1 = mb.decode(enc0);
		if (Buffer.compare(v0, v1)) {
			console.log({encoding, v0, v1});
			throw 'decode';
		}
	}
	console.log(`PASS buffer/${encoding}`);
}

check_buffer(Multibase.for('M'), 'base64');
check_buffer(Multibase.for('u'), 'base64url');
check_buffer(Multibase.for('f'), 'hex');