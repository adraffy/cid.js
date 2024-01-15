import {Bech32} from '../src/index.js';
import {rng} from './utils.js';

for (let type of [1, 69, Bech32.M]) {
	for (let i = 0; i < 1000; i++) {
		let v0 = Uint8Array.from({length: rng(1000)}, () => rng(32));
		let hrp = Array.from({length: 1+rng(10)}, () => 33+rng(1+126-33)).join('');
		let enc = new Bech32(hrp, v0, type).toString();
		let v1 = Bech32.decode(enc, type).v32;
		if (Buffer.compare(v0, v1)) {
			console.log({type, v0, enc, v1});
			throw new Error();
		}
	}
	console.log(`PASS bech32/${type}`);
}
