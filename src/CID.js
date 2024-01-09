import * as uvarint from './uvarint.js';
import * as multibase from './multibase.js';
import {Multihash} from './Multihash.js';

export class CID {	
	static from(v) {
		if (typeof v === 'string') {
			if (v.length == 46 && v.startsWith('Qm')) {
				v = multibase.Base58BTC.decode(v);
			} else {
				v = multibase.decode(v);
				if (v[0] == 0x12) throw new Error('CIDv0 cannot be multibase');
			}
		}
		try {
			if (v.length == 34 && v[0] == 0x12 && v[1] == 0x20) {
				return new CIDv0(Multihash.from(v));
			}
			let [version, pos] = uvarint.read(v);
			switch (version) {
				case 1: {
					let codec;
					[codec, pos] = uvarint.read(v, pos);
					return new CIDv1(codec, Multihash.from(v.slice(pos)));
				}
				default: throw new Error(`unsupported version: ${version}`);
			}
		} catch (err) {
			console.log(err);
			throw new Error(`Malformed CID: ${err.message}`);
		}
	}
	upgrade() { return this; }
	toJSON() {
		let {version, codec, hash} = this;
		return {version, codec, hash};
	}
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
		return multibase.encode('Q', this.bytes, false);
	}
}

export class CIDv1 extends CID {
	constructor(codec, hash) {
		super();
		this.codec = codec;
		this.hash = hash;
	}
	get version() { return 1; }
	get length() { return uvarint.sizeof(this.version) + uvarint.sizeof(this.codec) + this.hash.length; }
	get bytes() {
		let v = new Uint8Array(this.length);
		this.hash.write(v, uvarint.write(v, this.codec, uvarint.write(v, this.version, 0)));
		return v;
	}
	toString(base) {
		if (!base) {
			switch (this.codec) {
				case 0x72: base = 'k'; break; // libp2p-key
				default: base = 'b';
			}
		}
		return multibase.encode(base, this.bytes, true);
	}
}
