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
	assert: assert,
	read: read,
	sizeof: sizeof,
	write: write
});

class CharTable {
	constructor(s) {
		if (typeof s !== 'string') throw new TypeError();
		let v = [...s];
		if (v.length !== s.length) throw new TypeError();
		this.chars = s;
		this.map = new Map(v.map((x, i) => [x, i]));
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
	constructor(chars) {
		this.bits = Math.log2(chars.length);
		if (!Number.isInteger(this.bits)) throw new TypeError();
		this.table = new CharTable(chars);
		this.table.chars += PAD; // haxor
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

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const RADIX = '0123456789' + ALPHA;

// https://www.rfc-editor.org/rfc/rfc4648.html#section-4 
const Base64 = new RFC4648(ALPHA.toUpperCase() + ALPHA + RADIX.slice(0, 10) + '+/');
// https://www.rfc-editor.org/rfc/rfc4648.html#section-5
const Base64URL = new RFC4648(ALPHA.toUpperCase() + ALPHA + RADIX.slice(0, 10) + '-_');
// https://tools.ietf.org/id/draft-msporny-base58-03.html 
const Base58BTC = new Prefix0('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
// https://github.com/multiformats/multibase/blob/master/rfcs/Base36.md
const Base36 = new Prefix0(RADIX);
// https://www.rfc-editor.org/rfc/rfc4648.html#section-7
const Base32Hex = new RFC4648(RADIX.slice(0, 32));
// https://www.rfc-editor.org/rfc/rfc4648.html#section-6
const Base32 = new RFC4648('abcdefghijklmnopqrstuvwxyz234567');
// https://www.rfc-editor.org/rfc/rfc4648.html#section-8
const Base16 = new RFC4648(RADIX.slice(0, 16));
// https://github.com/multiformats/multibase/blob/master/rfcs/Base10.md
const Base10 = new Prefix0(RADIX.slice(0, 10)); 
// https://github.com/multiformats/multibase/blob/master/rfcs/Base8.md
const Base8 = new RFC4648(RADIX.slice(0, 8));
// https://github.com/multiformats/multibase/blob/master/rfcs/Base2.md
const Base2 = new RFC4648(RADIX.slice(0, 2));

function bind(base, ...a) {
	return {
		decode: s => base.decode(s, ...a),
		encode: v => base.encode(v, ...a)
	};
}

const MULTIBASES = {};
function register(prefix, {encode, decode}, args = {}) {
	MULTIBASES[prefix] = {prefix, encode, decode, ...args};
}

// https://github.com/multiformats/multibase#multibase-table  

register('0', bind(Base2), {name: 'base2'});
register('7', bind(Base8), {name: 'base8'});
register('9', bind(Base10), {name: 'base10'});
register('f', bind(Base16), {case: false, name: 'base16'});
register('F', bind(Base16), {case: true, name: 'base16upper'});
register('v', bind(Base32Hex), {case: false, name: 'base32hex'});
register('V', bind(Base32Hex), {case: true, name: 'base32hexupper'});
register('t', bind(Base32Hex, true), {case: false, name: 'base32hexpad'});
register('T', bind(Base32Hex, true), {case: true, name: 'base32hexpadupper'});
register('b', bind(Base32), {case: false, name: 'base32'});
register('B', bind(Base32), {case: true, name: 'base32upper'});
register('c', bind(Base32, true), {case: false, name: 'base32pad'});
register('C', bind(Base32, true), {case: true, name: 'base32padupper'});
// h
register('k', bind(Base36), {case: false,name: 'base36'});
register('K', bind(Base36), {case: true, name: 'base36upper'});
register('z', bind(Base58BTC), {name: 'base58btc'});
// ZBase58BTC
register('m', bind(Base64), {name: 'base64'});
register('M', bind(Base64, true), {name: 'base64pad'});
register('u', bind(Base64URL), {name: 'base64url'});
register('U', bind(Base64URL, true), {name: 'base64urlpad'});
// p
register('1', bind(Base58BTC), {name: 'base58btc-Identity'});
register('Q', bind(Base58BTC), {name: 'base58btc-CIDv0'});

function decode(s, prefix) {
	if (typeof s !== 'string') throw new TypeError('expected string');
	if (!prefix) { 
		prefix = s[0];
		s = s.slice(1);
	}
	let mb = MULTIBASES[prefix];
	if (!mb) throw new Error(`unknown multibase: ${prefix}`);	
	if (mb.casing !== undefined) s = s.toLowerCase();
	return mb.decode(s);
}

function encode(prefix, v, prefixed = true) {
	let mb = MULTIBASES[prefix];
	if (!mb) throw new Error(`unknown multibase: ${prefix}`);
	let s = mb.encode(v);
	if (mb.casing) s = s.toUpperCase();
	if (prefixed) s = mb.prefix + s; 
	return s;
}

var multibase = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Base10: Base10,
	Base16: Base16,
	Base2: Base2,
	Base32: Base32,
	Base32Hex: Base32Hex,
	Base36: Base36,
	Base58BTC: Base58BTC,
	Base64: Base64,
	Base64URL: Base64URL,
	Base8: Base8,
	MULTIBASES: MULTIBASES,
	decode: decode,
	encode: encode,
	register: register
});

class Multihash {
	static from(v) {
		if (typeof v === 'string') v = decode(v);
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
	toJSON() {
		return {...this};
	}
}

class CID {	
	static from(v) {
		if (typeof v === 'string') {
			if (v.length == 46 && v.startsWith('Qm')) {
				v = Base58BTC.decode(v);
			} else {
				v = decode(v);
				if (v[0] == 0x12) throw new Error('CIDv0 cannot be multibase');
			}
		}
		try {
			if (v.length == 34 && v[0] == 0x12 && v[1] == 0x20) {
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
		return encode('Q', this.bytes, false);
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
		if (!base) {
			switch (this.codec) {
				case 0x72: base = 'k'; break; // libp2p-key
				default: base = 'b';
			}
		}
		return encode(base, this.bytes, true);
	}
}

export { CID, CIDv0, CIDv1, Multihash, Prefix0, RFC4648, multibase, uvarint };
