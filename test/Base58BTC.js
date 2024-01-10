import {Base58BTC} from '../src/index.js';

[
	[Buffer.from('Hello World!'), '2NEpo7TZRRrLZSi2U'],
	[Buffer.from('The quick brown fox jumps over the lazy dog.'), 'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z'],
	[Buffer.from('0000287fb4cd', 'hex'), '11233QC4']
].forEach(([dec, enc]) => {
	let res = Base58BTC.encode(dec);
	if (enc !== res) {
		console.log({dec, enc, res});
		throw 'encode';
	}
	res = Base58BTC.decode(enc);
	if (Buffer.compare(dec, res)) {
		console.log({dec, enc, res});
		throw 'decode';
	}
});
console.log('PASS https://datatracker.ietf.org/doc/html/draft-msporny-base58-03#section-5');
