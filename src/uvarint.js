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

export function readBigInt(v, p, n) { return _read(v, p, n, x => BigInt(hex(x))); }
export function readHex(v, p, n)    { return _read(v, p, n, hex); }
export function read(v, p, n)       { return _read(v, p, n, int); }

// write a uvarint of u into ArrayLike at pos
// returns new position
// accepts number|BigInt|string
export function write(v, u, pos = 0) {
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
