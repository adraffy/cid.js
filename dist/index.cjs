'use strict';

//https://github.com/multiformats/unsigned-varint

const B = 128;
const MASK = B-1;
const MAX = (() => {
	let max = 1;
	while (Number.isSafeInteger(max * B)) max *= B;
	return max;
})();

function assert(u) {	
	if (!Number.isSafeInteger(u) || u < 0) {
		throw new TypeError(`invalid uvarint: ${u}`);
	}
}

// returns number of bytes to encode the int
function sizeof(u) {
	assert(u);
	let n = 1;
	for (; u >= B; ++n) u = Math.floor(u / B);
	return n;
}

// reads a uvarint from ArrayLike 
function read(v, pos = 0) {
	let u = 0;
	for (let b = 1; ; b *= B) {
		if (pos >= v.length) throw new RangeError(`buffer overflow`);
		let next = v[pos++];
		u += (next & MASK) * b;
		if (next < B) break;
		if (b == MAX) throw new RangeError('uvarint overflow');
	}
	return [u, pos];
}

// write a uvarint of i into Uint8Array at pos
// returns new position
function write(v, u, pos = 0) {
	assert(u);
	while (true) {
		if (u < B) break;
		v[pos++] = (u & MASK) | B;
		u = Math.floor(u / B);
	}
	v[pos++] = u;
	return pos;
}

var uvarint = /*#__PURE__*/Object.freeze({
	__proto__: null,
	MAX: MAX,
	read: read,
	sizeof: sizeof,
	write: write
});

// simple "abc" <-> 012 mapper
// parse("a") => 0
// format([0,1,2]) => "abc"

class CharTable {
	constructor(s) {
		this.chars = [...s];
		this.map = new Map(this.chars.map((x, i) => [x, i]));
	}
	get length() {
		return this.map.size;
	}
	parse(s) {
		let i = this.map.get(s);
		if (!Number.isInteger(i)) throw new TypeError(`invalid digit "${s}"`);
		return i;
	}
	format(v) {
		return v.map(i => this.chars[i]).join('');
	}
}

const PAD = '=';

class RFC4648 {
	constructor(s) { // must be power of 2
		this.table = new CharTable(s);
		this.bits = Math.log2(this.table.length);
		if (this.table.length < 2 || !Number.isInteger(this.bits)) throw new TypeError();
		this.table.chars.push(PAD); // haxor
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
			carry = (carry << bits) | table.parse(s[i]);
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
		let n = v.length;
		for (let i = 0; i < n; i++) {
			carry = (carry << 8) | v[i];
			width += 8;
			while (width >= bits) {
				u.push((carry >> (width -= bits)) & mask);
			}
		}
		if (width) u.push((carry << (bits - width)) & mask); // left align remainder
		while (pad && (u.length * bits) & 7) u.push(mask + 1);
		return table.format(u);
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
			let carry = table.parse(c);
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
		return table.format(u.reverse());
	}
}

const BASES = new Map();

class Multibase {
	static [Symbol.iterator]() {
		return BASES.values();
	}
	static decode(s) {
		return this.for(s[0]).decode(s.slice(1));
	}
	static for(prefix) {
		let mb = BASES.get(prefix);
		if (!mb) throw new Error(`unknown multibase: ${prefix}`);
		return mb;
	}
	constructor(prefix, name) {
		if (typeof prefix !== 'string' || prefix.length !== 1) throw new TypeError('invalid prefix');
		this.prefix = prefix;
		this.name = name;
		BASES.set(prefix, this);
	}
	encodeWithPrefix(v) {
		return this.prefix + this.encode(v);
	}
}

class Multihash {
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
	get length() { return sizeof(this.code) + sizeof(this.hash.length) + this.hash.length; }
	get bytes() {
		let v = new Uint8Array(this.length);
		this.write(v, 0);
		return v;
	}
	write(v, pos) {
		v.set(this.hash, write(v, this.hash.length, write(v, this.code, pos)));
		return pos;
	}
}

// https://www.rfc-editor.org/rfc/rfc4648.html#section-4 
const Base64 = new RFC4648('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-5
const Base64URL = new RFC4648('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_');

// https://tools.ietf.org/id/draft-msporny-base58-03.html 
const Base58BTC = new Prefix0('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');

// https://www.flickr.com/groups/api/discuss/72157616713786392/
const Base58Flickr = new Prefix0('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base36.md
const Base36 = new Prefix0('0123456789abcdefghijklmnopqrstuvwxyz');

// https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt
const Base32Z = new RFC4648('ybndrfg8ejkmcpqxot1uwisza345h769');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-7
const Base32Hex = new RFC4648('0123456789abcdefghijklmnopqrstuv');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-6
const Base32 = new RFC4648('abcdefghijklmnopqrstuvwxyz234567');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-8
const Base16 = new RFC4648('0123456789abcdef');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base10.md
const Base10 = new Prefix0('0123456789'); 

// https://github.com/multiformats/multibase/blob/master/rfcs/Base8.md
const Base8 = new RFC4648('01234567');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base2.md
const Base2 = new RFC4648('01');

// helper class to wrap a Multibase
class MultibaseWrapper extends Multibase {
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
new MultibaseWrapper('0', 'base2', Base2);
new MultibaseWrapper('7', 'base8', Base8);
new MultibaseWrapper('9', 'base10', Base10);
new MultibaseWrapper('f', 'base16', Base16, {casing: false});
new MultibaseWrapper('F', 'base16upper', Base16, {casing: true});
new MultibaseWrapper('v', 'base32hex', Base32Hex, {casing: false});
new MultibaseWrapper('V', 'base32hexupper', Base32Hex, {casing: true});
new MultibaseWrapper('t', 'base32hexpad', Base32Hex, {casing: false, padding: true});
new MultibaseWrapper('T', 'base32hexpadupper', Base32Hex, {casing: true, padding: true});
new MultibaseWrapper('b', 'base32', Base32, {casing: false});
new MultibaseWrapper('B', 'base32upper', Base32, {casing: true});
new MultibaseWrapper('c', 'base32pad', Base32, {casing: false, padding: true});
new MultibaseWrapper('C', 'base32padupper', Base32, {casing: true, padding: true});
new MultibaseWrapper('h', 'base32z', Base32Z);
new MultibaseWrapper('k', 'base36', Base36, {casing: false});
new MultibaseWrapper('K', 'base36upper', Base36, {casing: true});
new MultibaseWrapper('z', 'base58btc', Base58BTC);
new MultibaseWrapper('Z', 'base58flickr', Base58Flickr);
new MultibaseWrapper('m', 'base64', Base64);
new MultibaseWrapper('M', 'base64pad', Base64, {padding: true});
new MultibaseWrapper('u', 'base64url', Base64URL);
new MultibaseWrapper('U', 'base64urlpad', Base64URL, {padding: true});
// U+0070,     p,          proquint,           Proquint (https://arxiv.org/html/0901.4016)
// U+1F680,    🚀,         base256emoji,       base256 with custom alphabet using variable-sized-codepoints

// what the fuck does this mean?
// "NOTE: Multibase-prefixes are encoding agnostic. "z" is "z", not 0x7a ("z" encoded as ASCII/UTF-8).
//  In UTF-32, for example, that same "z" would be [0x7a, 0x00, 0x00, 0x00] not [0x7a]."

const DEFAULT_BASE = Multibase.for('b');
const SHA2_256 = 0x12;

class CID {	
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

class CIDv0 extends CID {
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

class CIDv1 extends CID {
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
exports.CID = CID;
exports.CIDv0 = CIDv0;
exports.CIDv1 = CIDv1;
exports.Multibase = Multibase;
exports.MultibaseWrapper = MultibaseWrapper;
exports.Multihash = Multihash;
exports.Prefix0 = Prefix0;
exports.RFC4648 = RFC4648;
exports.uvarint = uvarint;
