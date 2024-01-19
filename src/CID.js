import {read, write} from './uvarint.js';
import {Multibase} from './Multibase.js';
import {Multihash} from './Multihash.js';
import {Base58BTC} from './bases.js';

const SHA2_256 = 0x12;

export class CID {	
	static from(v) {
		let base; // remember source base (if string)
		if (typeof v === 'string') {
			if (v.length == 46 && v.startsWith('Qm')) { // version = 0
				v = Base58BTC.decode(v);
			} else {
				({base, data: v} = Multibase.decode(v));
				if (v[0] == SHA2_256) throw new Error('CIDv0 cannot be multibase');
			}
		}
		try {
			let [version, codec, pos] = read(v, 0, 2);
			if (version == SHA2_256) {
				let hash = Multihash.from(v);
				if (hash.data.length != 32) throw new Error('CIDv0 must be 32-bytes'); 
				return new CID(0, 0x70, hash);
			}
			return new CID(version, codec, Multihash.from(v.slice(pos)), base);
		} catch (err) {
			throw new Error(`malformed CID: ${err.message}`);
		}
	}
	constructor(version, codec, hash, base) {
		this.version = version;
		this.codec = codec;
		this.hash = hash;
		this.base = base;
	}
	get bytes() {
		let {version, codec, hash} = this;
		if (version) {
			let v = [];
			hash.write(v, write(v, codec, write(v, version)));
			return Uint8Array.from(v);
		} else {
			return hash.bytes;
		}
	}
	upgrade() {
		let {version, codec, hash, base} = this;
		return new CID(version || 1, codec, hash, base);
	}
	toString(alt_base) {
		let {version, base, bytes} = this;
		if (version) {
			return Multibase.for(alt_base || base || 'k').encodeWithPrefix(bytes);
		} else {
			return Base58BTC.encode(bytes); // alt_base ignored
		}
	}
}
