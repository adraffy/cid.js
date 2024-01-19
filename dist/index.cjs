'use strict';

//https://github.com/multiformats/unsigned-varint

// read n arbitrary-sized uvarints from v at pos and applies fn to them
function _read(v, pos = 0, n = 1, fn) {
	let ret = [];
	for (let i = 0; i < n; i++) {
		let bits = 0, temp = 0, bytes = [];
		const mask = 127;
		while (true) {
			if (pos >= v.length) throw new RangeError('buffer overflow');
			let next = v[pos++];
			temp |= (next & mask) << bits;
			bits += 7;
			if (bits >= 8) {
				bytes.push(temp & 255);
				temp >>= 8;
				bits -= 8;
			}
			if (next <= mask) break;
		}
		if (bits) bytes.push(temp);
		ret.push(fn(bytes.reverse()));
	}
	ret.push(pos);
	return ret;
}

function hex(v) {
	return '0x' + v.map(x => x.toString(16).padStart(2, '0')).join('');
}
function int(v) {
	let i = v.reduce((a, x) => a * 256 + x, 0);
	if (!Number.isSafeInteger(i)) throw new RangeError('unsafe');
	return i;
}

function readBigInt(v, p, n) { return _read(v, p, n, x => BigInt(hex(x))); }
function readHex(v, p, n)    { return _read(v, p, n, hex); }
function read(v, p, n)       { return _read(v, p, n, int); }

// write a uvarint of u into ArrayLike at pos
// returns new position
// accepts number|BigInt|string
function write(v, u, pos = 0) {
	if (typeof u === 'number' && !Number.isSafeInteger(u)) throw new RangeError('unsafe');
	u = BigInt(u);
	if (u < 0) throw new RangeError('negative');
	const mask = 127n;
	while (u > mask) {
		v[pos++] = Number(u & mask) | 128;
		u >>= 7n;
	}
	v[pos++] = Number(u);
	return pos;
}

// this is too trivial
// returns number of bytes to encode the uvarint
// export function sizeof(u) {
// 	return write([], u);
// }

var uvarint = /*#__PURE__*/Object.freeze({
	__proto__: null,
	read: read,
	readBigInt: readBigInt,
	readHex: readHex,
	write: write
});

// simple "abc" <-> 012 mapper

class CharTable {
	constructor(s) {
		let v = this.chars = [...s];
		this.map = new Map(v.map((x, i) => [x, i]));
	}
	get length() {
		return this.map.size;
	}
	indexOf(s) {
		let i = this.map.get(s);
		if (!Number.isInteger(i)) throw new TypeError(`invalid digit "${s}"`);
		return i;
	}
	encode(v) {
		return Array.from(v, i => this.chars[i]).join('');
	}
}

const PAD = '=';

class RFC4648 {
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
		while (pad && (u.length * bits) & 7) u.push(mask + 1);
		return table.encode(u);
	}
}

class Prefix0 {
	constructor(s) {
		this.table = new CharTable(s);
	}
	decode(s) {
		let {table} = this;
		let base = table.length;
		let n = s.length;
		let v = new Uint8Array(n);
		let pos = 0;
		for (let c of s) {
			let carry = table.indexOf(c);
			for (let i = 0; i < pos; i++) {
				carry += v[i] * base;
				v[i] = carry;
				carry >>= 8;
			}
			while (carry) {
				v[pos++] = carry;
				carry >>= 8;
			}
		}
		for (let i = 0; i < n && s[i] === table.chars[0]; i++) pos++;
		return v.subarray(0, pos).reverse();
	}
	encode(v) {
		let {table} = this;
		let base = table.length;
		let u = [];
		for (let x of v) {
			for (let i = 0; i < u.length; ++i) {
				let xx = (u[i] << 8) | x;
				u[i] = xx % base;
				x = (xx / base)|0;
			}
			while (x) {
				u.push(x % base);
				x = (x / base)|0;
			}
		}	
		for (let i = 0; i < v.length && !v[i]; i++) u.push(0);
		return table.encode(u.reverse());
	}
}

// https://en.bitcoin.it/wiki/BIP_0173 bech32
// https://en.bitcoin.it/wiki/BIP_0350 bech32m


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

class Bech32 {
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
	static decode(s) {
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

const MAP = new Map();
const BASES = new Set();

class Multibase {
	static [Symbol.iterator]() {
		return BASES.values();
	}
	static decode(s) {
		// multibase spec says this is actually a codepoint
		// (see base-emoji) however that seems like bullshit
		// as the whole point of this is to support channels
		// w/o an additional wrapper (eg. Base36 "k" => DNS)
		let cp = s.codePointAt(0);
		let base = this.for(String.fromCodePoint(cp));
		let data = base.decode(s.slice(cp < 0x10000 ? 1 : 2));
		return {base, data};
	}
	static for(prefix) {
		if (prefix instanceof this) return prefix;
		let mb = MAP.get(prefix);
		if (!mb) throw new Error(`unknown multibase: ${prefix}`);
		return mb;
	}
	constructor(prefix, name) {
		if (prefix.length !== 1) throw new Error('invalid prefix');
		this.prefix = prefix;
		this.name = name;
		// register names, allow replacement
		MAP.set(prefix, this); 
		MAP.set(name, this);
		BASES.add(this);
	}
	encodeWithPrefix(v) {
		return this.prefix + this.encode(v);
	}
	// abstract:
	// encode(v): s
	// decode(s): v
}

class Multihash {
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

// https://github.com/Chia-Network/chia-blockchain/blob/af0d6385b238c91bff4fec1a9e9c0f6158fbf896/chia/util/bech32m.py#L85
function convert(v, src, dst, pad, ret = []) {
	let acc = 0;
	let bits = 0;
	let mask = (1 << dst) - 1;
	for (let x of v) {
		if (x < 0 || x >> src) throw new Error('invalid digit');
		acc = ((acc & 0xFFFF) << src) | x;
		bits += src;
		while (bits >= dst) {
			bits -= dst;
			ret.push((acc >> bits) & mask);
		}
	}
	if (pad) {
		if (bits) {
			ret.push((acc << (dst - bits)) & mask);
		}
	} else if (bits >= src || ((acc << (dst - bits)) & mask)) {
		throw new Error('malformed');
	}
	return Uint8Array.from(ret);
}

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const az = AZ.toLowerCase();
const Z9 = '0123456789';

function drop58(s) { return s.replaceAll(/[0OIl]/g, ''); }

// https://www.rfc-editor.org/rfc/rfc4648.html#section-4 
const Base64 = new RFC4648(AZ + az + Z9 + '+/');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-5
const Base64URL = new RFC4648(AZ + az + Z9 + '-_');

// https://tools.ietf.org/id/draft-msporny-base58-03.html 
const Base58BTC = new Prefix0(drop58(Z9 + AZ + az));

// https://www.flickr.com/groups/api/discuss/72157616713786392/
const Base58Flickr = new Prefix0(drop58(Z9 + az + AZ));

// https://github.com/multiformats/multibase/blob/master/rfcs/Base36.md
const Base36 = new Prefix0(Z9 + az);

// https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt
const Base32Z = new RFC4648('ybndrfg8ejkmcpqxot1uwisza345h769');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-7
const Base32Hex = new RFC4648(Z9 + az.slice(0, -4));

// https://www.rfc-editor.org/rfc/rfc4648.html#section-6
const Base32 = new RFC4648('abcdefghijklmnopqrstuvwxyz234567');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-8
const Base16 = new RFC4648(Z9 + 'abcdef');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base10.md
const Base10 = new Prefix0(Z9); 

// https://github.com/multiformats/multibase/blob/master/rfcs/Base8.md
const Base8 = new RFC4648('01234567');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base2.md
const Base2 = new RFC4648('01');

// helper class to wrap a coder
class Multibased extends Multibase {
	constructor(prefix, name, coder, {casing, padding} = {}) {
		super(prefix, name);
		this.coder = coder;
		this.casing = casing;
		this.padding = padding;
	}
	decode(s) {
		if (this.casing !== undefined) s = s.toLowerCase(); // if any casing, make it lower
		return this.coder.decode(s);
	}
	encode(v) {
		let s = this.coder.encode(v, this.padding);
		if (this.casing) s = s.toUpperCase(); // if upper casing, make it upper
		return s;
	}
}

// https://github.com/multiformats/multibase#multibase-table
new Multibased('0', 'base2', Base2);
new Multibased('7', 'base8', Base8);
new Multibased('9', 'base10', Base10);
new Multibased('f', 'base16', Base16, {casing: false});
new Multibased('F', 'base16upper', Base16, {casing: true});
new Multibased('v', 'base32hex', Base32Hex, {casing: false});
new Multibased('V', 'base32hexupper', Base32Hex, {casing: true});
new Multibased('t', 'base32hexpad', Base32Hex, {casing: false, padding: true});
new Multibased('T', 'base32hexpadupper', Base32Hex, {casing: true, padding: true});
new Multibased('b', 'base32', Base32, {casing: false});
new Multibased('B', 'base32upper', Base32, {casing: true});
new Multibased('c', 'base32pad', Base32, {casing: false, padding: true});
new Multibased('C', 'base32padupper', Base32, {casing: true, padding: true});
new Multibased('h', 'base32z', Base32Z);
new Multibased('k', 'base36', Base36, {casing: false});
new Multibased('K', 'base36upper', Base36, {casing: true});
new Multibased('z', 'base58btc', Base58BTC);
new Multibased('Z', 'base58flickr', Base58Flickr);
new Multibased('m', 'base64', Base64);
new Multibased('M', 'base64pad', Base64, {padding: true});
new Multibased('u', 'base64url', Base64URL);
new Multibased('U', 'base64urlpad', Base64URL, {padding: true});
// U+0070,     p,          proquint,           Proquint (https://arxiv.org/html/0901.4016)
// U+1F680,    🚀,         base256emoji,       base256 with custom alphabet using variable-sized-codepoints

// what the fuck does this mean?
// "NOTE: Multibase-prefixes are encoding agnostic. "z" is "z", not 0x7a ("z" encoded as ASCII/UTF-8).
//  In UTF-32, for example, that same "z" would be [0x7a, 0x00, 0x00, 0x00] not [0x7a]."

const SHA2_256 = 0x12;

class CID {	
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

exports.Base10 = Base10;
exports.Base16 = Base16;
exports.Base2 = Base2;
exports.Base32 = Base32;
exports.Base32Hex = Base32Hex;
exports.Base32Z = Base32Z;
exports.Base36 = Base36;
exports.Base58BTC = Base58BTC;
exports.Base58Flickr = Base58Flickr;
exports.Base64 = Base64;
exports.Base64URL = Base64URL;
exports.Base8 = Base8;
exports.Bech32 = Bech32;
exports.CID = CID;
exports.Multibase = Multibase;
exports.Multibased = Multibased;
exports.Multihash = Multihash;
exports.Prefix0 = Prefix0;
exports.RFC4648 = RFC4648;
exports.convert = convert;
exports.uvarint = uvarint;
