// https://en.bitcoin.it/wiki/BIP_0173 bech32
// https://en.bitcoin.it/wiki/BIP_0350 bech32m

// type is the checksum

// https://github.com/sipa/bech32/issues/51
// type=1 has an unexpected weakness: whenever the final character is a 'p', 
// inserting or deleting any number of 'q' characters immediately preceding it 
// does not invalidate the checksum.

import {CharTable} from './CharTable.js';

// Encoders MUST always output an all lowercase Bech32 string
const TABLE = new CharTable('qpzry9x8gf2tvdw0s3jn54khce6mua7l');
const SEP = '1';
const GEN = [0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3];
const TYPE_M = 0x2BC830A3;

function polymod(v32) {
	let check = 1;
	for (let x of v32) {
		let digit = check >> 25;
		check = (check & 0x1FFFFFF) << 5 ^ x;
		for (let i = 0; i < 5; i++) {
			if ((digit >> i) & 1) {
				check ^= GEN[i];
			}
		}
	}
	return check;
}

function checksum(type, hrp, v32) {
	let check = polymod([...hrp_expand(hrp), ...v32, 0, 0, 0, 0, 0, 0]) ^ type;
	return [25, 20, 15, 10, 5, 0].map(x => (check >> x) & 31);	
}

// This part MUST contain 1 to 83 US-ASCII characters,
// with each character having a value in the range [33-126].
function hrp_expand(s) {
	let v = Array.from(s, x => {
		let cp = x.codePointAt(0);
		if (cp < 33 || cp > 126) throw new Error(`invalid hrp character: ${s}`);
		return cp;
	});
	let n = v.length;
	if (!n || n > 83) throw new Error(`invalid hrp length`);
	return [...v.map(x => x >> 5), 0, ...v.map(x => x & 31)];
}

export class Bech32 {
	constructor(hrp, v32, type = 1) {
		this.hrp = hrp;
		this.v32 = v32; // this is array of base32 numbers
		this.type = type;
	}
	//get is1() { return this.type === 1; }
	//get isM() { return this.type === TYPE_M; }
	toString() {
		return this.hrp + SEP + TABLE.encode(this.v32) + TABLE.encode(checksum(this.type, this.hrp, this.v32));
	}
	static from(s) {
		// The lowercase form is used when determining a character's value for checksum purposes. 
		let lower = s.toLowerCase();
		// Decoders MUST NOT accept strings where some characters are uppercase and 
		// some are lowercase (such strings are referred to as mixed case strings).
		if (s !== lower && s !== s.toUpperCase()) throw new Error('mixed case');
		let pos = lower.lastIndexOf(SEP);
		if (pos < 1) throw new Error('no hrp');
		if (lower.length - pos < 7) throw new Error('no check');
		let hrp = lower.slice(0, pos);
		let v32 = Uint8Array.from(lower.slice(pos + 1), x => TABLE.indexOf(x));
		return new this(hrp, v32.subarray(0, -6), polymod([...hrp_expand(hrp), ...v32])); 
	}
}
Object.defineProperty(Bech32, 'M', {
	value: TYPE_M,
	writable: false,
	configurable: false,
});
