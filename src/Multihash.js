import {read, write} from './uvarint.js';
import {Multibase} from './Multibase.js';

export class Multihash {
	static from(v) {
		if (typeof v === 'string') v = Multibase.decode(v);
		let [codec, pos] = read(v);
		let size;
		[size, pos] = read(v, pos);
		v = new Uint8Array(v.slice(pos));
		if (v.length !== size) throw new Error(`expected ${size}, got ${v.length} bytes`);
		return new this(codec, v);
	}
	constructor(codec, data) {
		this.codec = codec;
		this.data = data;
	}
	get bytes() {
		let v = [];
		this.write(v);
		return Uint8Array.from(v);
	}
	write(v, pos = 0) {
		let {data, codec} = this;
		pos = write(v, data.length, write(v, codec, pos));
		data.forEach(x => v[pos++] = x);
		return pos;
	}
}
