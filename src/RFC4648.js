import {CharTable} from './CharTable.js';

const PAD = '='; // currently global

export class RFC4648 {
	constructor(s) { // must be power of 2
		let table = this.table = new CharTable(s);
		let n = table.length;
		let bits = this.bits = Math.log2(n);
		if (n < 2 || !Number.isInteger(bits)) throw new TypeError();
		table.chars.push(PAD); // haxor
	}
	decode(s) {
		let {table, bits} = this;
		let n = s.length;
		let pos = 0;
		let carry = 0;
		let width = 0;
		// opinion: there is no need to fail when padding 
		// is present when it wasn't allowed or needed
		while (n && s[n-1] == PAD) --n; // remove padding
		let v = new Uint8Array((n * bits) >> 3);
		for (let i = 0; i < n; i++) {
			carry = (carry << bits) | table.indexOf(s[i]);
			width += bits;
			if (width >= 8) {
				v[pos++] = (carry >> (width -= 8)) & 0xFF;
			}
		}
		// the bits afterwards should be 0
		if ((carry << (8 - width)) & 0xFF) throw new Error('invalid');
		return v;
	}
	encode(v, pad) {
		let {table, bits} = this;
		let mask = (1 << bits) - 1;
		let carry = 0;
		let width = 0;
		let u = [];
		for (let i = 0, e = v.length; i < e; i++) {
			carry = (carry << 8) | v[i];
			width += 8;
			while (width >= bits) {
				u.push((carry >> (width -= bits)) & mask);
			}
		}
		if (width) u.push((carry << (bits - width)) & mask); // left align remainder
		while (pad && (u.length * bits) & 7) u.push(mask + 1); // add padding
		return table.encode(u);
	}
}
