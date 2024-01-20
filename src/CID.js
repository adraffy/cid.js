import {read, write} from './uvarint.js';
import {Multibase} from './Multibase.js';
import {Multihash} from './Multihash.js';
import {Base58BTC} from './bases.js';

// https://github.com/multiformats/cid/blob/master/README.md#cidv0
// * the multibase of the string representation is always base58btc and implicit (not written)
// * the multicodec is always dag-pb and implicit (not written)
// * the cid-version is always cidv0 and implicit (not written)
// * the multihash is written as is but is always a full (length 32) sha256 hash.
const CODEC_SHA2_256 = 0x12;
const CODEC_DAG_PB = 0x70;

export class CID {	
	static from(v) {
		let base; // remember source base (if string)
		if (typeof v === 'string') {
			if (v.length == 46 && v.startsWith('Qm')) { // version = 0
				v = Base58BTC.decode(v);
			} else {
				({base, data: v} = Multibase.decode(v));
				if (v[0] == CODEC_SHA2_256) throw new Error('CIDv0 cannot be multibase');
			}
		}
		try {
			let [version, codec, pos] = read(v, 0, 2);
			if (version == CODEC_SHA2_256) {
				let hash = Multihash.from(v);
				if (hash.data.length != 32) throw new Error('CIDv0 must be 32-bytes'); 
				return new this(0, CODEC_DAG_PB, hash);
			}
			// the spec says: 1 is valid, 2 and 3 are reserved, rest (0 and 3+) are malformed
			//if (!version || version > 3) throw new Error(`invalid version: ${version}`);
			return new this(version, codec, Multihash.from(v.slice(pos)), base);
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
