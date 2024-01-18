//https://github.com/multiformats/unsigned-varint

function hex(v) {
	return '0x' + v.map(x => x.toString(16).padStart(2, '0')).join('');
}

// read arbitrary-sized uvarint from v at pos
// returns number[]
export function readBytes(v, pos = 0) {
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
	return [bytes.reverse(), pos];
}
export function readHex(v, p) {
	[v, p] = readBytes(v, p);
	return [hex(v), p];
}
export function readBigInt(v, p) {
	[v, p] = readBytes(v, p);
	return [BigInt(hex(v)), p];
}
export function read(v, p) {
	[v, p] = readBytes(v, p);
	let u = parseInt(hex(v));
	if (!Number.isSafeInteger(u)) throw new RangeError('unsafe');
	return [u, p];
}

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
