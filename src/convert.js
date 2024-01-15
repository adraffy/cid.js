// https://github.com/Chia-Network/chia-blockchain/blob/af0d6385b238c91bff4fec1a9e9c0f6158fbf896/chia/util/bech32m.py#L85
export function convert(v, src, dst, pad, ret = []) {
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