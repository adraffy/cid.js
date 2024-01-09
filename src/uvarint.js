//https://github.com/multiformats/unsigned-varint

const B = 128;
const MASK = B-1;
export const MAX = (() => {
	let max = 1;
	while (Number.isSafeInteger(max * B)) max *= B;
	return max;
})();

export function assert(u) {	
	if (!Number.isSafeInteger(u) || u < 0) {
		throw new TypeError(`invalid uvarint: ${u}`);
	}
}

// returns number of bytes to encode the int
export function sizeof(u) {
	assert(u);
	let n = 1;
	for (; u >= B; ++n) u = Math.floor(u / B);
	return n;
}

// reads a uvarint from ArrayLike 
export function read(v, pos = 0) {
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
export function write(v, u, pos = 0) {
	assert(u);
	while (true) {
		if (u < B) break;
		v[pos++] = (u & MASK) | B;
		u = Math.floor(u / B);
	}
	v[pos++] = u;
	return pos;
}