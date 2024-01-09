import {multibase} from '../src/index.js';

function rng(n) {
	return (Math.random() * n)|0;
}

for (let i = 0; i < 1000; i++) {
	let v0 = Uint8Array.from({length: rng(256)}, () => rng(256));
	let enc0 = Buffer.from(v0).toString('base64');
	let enc1 = multibase.Base64.encode(v0, true);
	if (enc0 !== enc1) throw 1;
	let v1 = multibase.Base64.decode(enc0);
	if (Buffer.compare(v0, v1)) throw 1;
}
console.log('OK');
