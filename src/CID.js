import {read, write} from './uvarint.js';
import {Multibase} from './Multibase.js';
import {Multihash} from './Multihash.js';
import {Base58BTC} from './bases.js';

const SHA2_256 = 0x12;

export class CID {	
	static from(v) {
		let base; // remember source base (if string)
		if (typeof v === 'string') {
			if (v.length == 46 && v.startsWith('Qm')) { // CIDv0
				v = Base58BTC.decode(v);
			} else { // CIDv1+
				({base, data: v} = Multibase.decode(v));
				if (v[0] == SHA2_256) throw new Error('CIDv0 cannot be multibase');
			}
		}
		try {
			if (v[0] == SHA2_256) {
				if (v[1] !== 32) throw new Error('CIDv0 must be SHA2-256'); // expect 32 byte hash
				return new CIDv0(Multihash.from(v));
			}
			let [version, pos] = read(v);
			switch (version) {
				case 1: {
					let codec;
					[codec, pos] = read(v, pos);
					return new CIDv1(codec, Multihash.from(v.slice(pos)), base);
				}
				default: throw new Error(`unsupported version: ${version}`);
			}
		} catch (err) {
			throw new Error(`Malformed CID: ${err.message}`);
		}
	}
	//get isCID() { return true; }
	upgrade() { return this; }
}

export class CIDv0 extends CID {
	constructor(hash) {
		super();
		this.hash = hash;
	}
	get version() { return 0; }
	get codec() { return 0x70; }
	get bytes() { return this.hash.bytes; }
	upgrade() { return new CIDv1(this.codec, this.hash); }
	toString() { 
		return Base58BTC.encode(this.bytes); // only
	}
}

export class CIDv1 extends CID {
	constructor(codec, hash, base) {
		super();
		this.codec = codec;
		this.hash = hash;
		this.base = base;
	}
	get version() { return 1; }
	get bytes() {
		let v = [];
		this.hash.write(v, write(v, this.codec, write(v, this.version)));
		return Uint8Array.from(v);
	}
	toString(base) {
		return Multibase.for(base || this.base || 'b').encodeWithPrefix(this.bytes);
	}
}
