import {read, write, sizeof} from './uvarint.js';
import {Multibase} from './Multibase.js';
import {Multihash} from './Multihash.js';
import {Base58BTC} from './bases.js';

const DEFAULT_BASE = Multibase.for('b');
const SHA2_256 = 0x12;

export class CID {	
	static from(v) {
		if (typeof v === 'string') {
			if (v.length == 46 && v.startsWith('Qm')) { // CIDv0
				v = Base58BTC.decode(v);
			} else { // CIDv1
				v = Multibase.decode(v);
				if (v[0] == SHA2_256) throw new Error('CIDv0 cannot be multibase');
			}
		}
		try {
			if (v[0] == SHA2_256) {
				if (v[1] !== 32) throw new Error('CIDv0 must be SHA2-256');
				return new CIDv0(Multihash.from(v));
			}
			let [version, pos] = read(v);
			switch (version) {
				case 1: {
					let codec;
					[codec, pos] = read(v, pos);
					return new CIDv1(codec, Multihash.from(v.slice(pos)));
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
	get length() { return this.hash.bytes.length; }
	get bytes() { return this.hash.bytes; }
	upgrade() { return new CIDv1(this.codec, this.hash); }
	toString() { 
		return Base58BTC.encode(this.bytes); // only
	}
}

export class CIDv1 extends CID {
	constructor(codec, hash) {
		super();
		this.codec = codec;
		this.hash = hash;
	}
	get version() { return 1; }
	get length() { return sizeof(this.version) + sizeof(this.codec) + this.hash.length; }
	get bytes() {
		let v = new Uint8Array(this.length);
		this.hash.write(v, write(v, this.codec, write(v, this.version, 0)));
		return v;
	}
	toString(base) {
		if (!base) { // derive key from codec
			switch (this.codec) {
				case 0x72: base = 'k'; break; // libp2p-key
				default: base = DEFAULT_BASE;
			}
		}
		if (!(base instanceof Multibase)) {
			base = Multibase.for(base);
		}
		return base.encodeWithPrefix(this.bytes);
	}
}
