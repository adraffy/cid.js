import {read, write} from './uvarint.js';
import {Multibase} from './Multibase.js';

export class Multihash {
	static from(v) {
		if (typeof v === 'string') v = Multibase.decode(v);
		let [code, pos] = read(v);
		let size;
		[size, pos] = read(v, pos);
		v = new Uint8Array(v.slice(pos));
		if (v.length !== size) throw new Error(`expected ${size}, got ${v.length} bytes`);
		return new this(code, v);
	}
	constructor(code, hash) {
		this.code = code;
		this.hash = hash;
	}
	get bytes() {
		let v = [];
		this.write(v, 0);
		return Uint8Array.from(v);
	}
	write(v, pos) {
		let {hash, code} = this;
		pos = write(v, hash.length, write(v, code, pos));
		hash.forEach(x => v[pos++] = x);
		return pos;
	}
}
