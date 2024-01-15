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

class CharTable {
	constructor(s) {
		this.chars = [...s];
		this.map = new Map(this.chars.map((x, i) => [x, i]));
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
		this.table = new CharTable(s);
		let n = this.table.chars.length;
		this.bits = Math.log2(n);
		if (n < 2 || !Number.isInteger(this.bits)) throw new TypeError();
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
		return table.encode(u);
	}
}

class Prefix0 {
	constructor(s) {
		this.table = new CharTable(s);
	}
	decode(s) {
		let {table} = this;
		let base = table.chars.length;
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
		let base = table.chars.length;
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

const TABLE = new CharTable('qpzry9x8gf2tvdw0s3jn54khce6mua7l');
const SEP = '1';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

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

// This part MUST contain 1 to 83 US-ASCII characters, with each character having a value in the range [33-126]. 
// HRP validity may be further restricted by specific applications.
function hrp_expand(s) {
	let v = Array.from(s, x => {
		let cp = x.codePointAt(0);
		if (cp < 33 || cp > 126) throw new Error(`invalid hrp: ${s}`);
		return cp;
	});
	return [...v.map(x => x >> 5), 0, ...v.map(x => x & 31)];
}

class Bech32 {
	constructor(hrp, v32, type = 1) {
		this.hrp = hrp;
		this.v32 = v32;
		this.type = type;
	}
	toString() {
		return this.hrp + SEP + TABLE.encode(this.v32) + TABLE.encode(checksum(this.type, this.hrp, this.v32));
	}
	static decode(s) {
		let lower = s.toLowerCase();
		if (s !== lower && s !== s.toUpperCase()) throw new Error('mixed case');
		let pos = lower.lastIndexOf(SEP);
		if (pos < 0) throw new Error('no hrp');
		if (lower.length - pos < 7) throw new Error('no check');
		let hrp = lower.slice(0, pos);
		let v32 = Uint8Array.from(lower.slice(pos + 1), x => TABLE.indexOf(x));
		return new this(hrp, v32.subarray(0, -6), polymod([...hrp_expand(hrp), ...v32]));
	}
}
Object.defineProperty(Bech32, 'M', {
	value: 0x2BC830A3,
	writable: false,
	configurable: false,
});

const BASES = new Map();

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
		let mb = BASES.get(prefix);
		if (!mb) throw new Error(`unknown multibase: ${prefix}`);
		return mb;
	}
	constructor(prefix, name) {
		if (typeof prefix !== 'string' || prefix.length !== 1) throw new TypeError('invalid prefix');
		this.prefix = prefix;
		this.name = name;
		BASES.set(prefix, this); // allow replacement
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
	get length() { 
		return sizeof(this.code) + sizeof(this.hash.length) + this.hash.length; 
	}
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
	constructor(codec, hash, base) {
		super();
		this.codec = codec;
		this.hash = hash;
		this.base = base;
	}
	get version() { return 1; }
	get length() { return sizeof(this.version) + sizeof(this.codec) + this.hash.length; }
	get bytes() {
		let v = new Uint8Array(this.length);
		this.hash.write(v, write(v, this.codec, write(v, this.version, 0)));
		return v;
	}
	toString(base) {
		return Multibase.for(base || this.base || 'b').encodeWithPrefix(this.bytes);
	}
}

export { Base10, Base16, Base2, Base32, Base32Hex, Base32Z, Base36, Base58BTC, Base58Flickr, Base64, Base64URL, Base8, Bech32, CID, CIDv0, CIDv1, Multibase, Multibased, Multihash, Prefix0, RFC4648, convert, uvarint };
