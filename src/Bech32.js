import {CharTable} from './CharTable.js';

const TABLE = new CharTable('qpzry9x8gf2tvdw0s3jn54khce6mua7l');
const SEP = '1';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

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

// This part MUST contain 1 to 83 US-ASCII characters, with each character having a value in the range [33-126]. 
// HRP validity may be further restricted by specific applications.
function hrp_expand(s) {
	let v = Array.from(s, x => {
		let cp = x.codePointAt(0);
		if (cp < 33 || cp > 126) throw new Error(`invalid hrp: ${s}`);
		return cp;
	});
	return [...v.map(x => x >> 5), 0, ...v.map(x => x & 31)];
}

export class Bech32 {
	constructor(hrp, v32, type = 1) {
		this.hrp = hrp;
		this.v32 = v32;
		this.type = type;
	}
	toString() {
		return this.hrp + SEP + TABLE.encode(this.v32) + TABLE.encode(checksum(this.type, this.hrp, this.v32));
	}
	static decode(s) {
		let lower = s.toLowerCase();
		if (s !== lower && s !== s.toUpperCase()) throw new Error('mixed case');
		let pos = lower.lastIndexOf(SEP);
		if (pos < 0) throw new Error('no hrp');
		if (lower.length - pos < 7) throw new Error('no check');
		let hrp = lower.slice(0, pos);
		let v32 = Uint8Array.from(lower.slice(pos + 1), x => TABLE.indexOf(x));
		return new this(hrp, v32.subarray(0, -6), polymod([...hrp_expand(hrp), ...v32]));
	}
}
Object.defineProperty(Bech32, 'M', {
	value: 0x2BC830A3,
	writable: false,
	configurable: false,
});