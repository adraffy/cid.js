export function rng(n) {
	return Math.random() * n|0;
}

export function random_bytes(length) {
	return Uint8Array.from({length}, () => rng(256));
}

export function random_choice(v) {
	return v[rng(v.length)];
}

export function assert_same(v) {
	for (let i = 1; i < v.length; i++) {
		if (Buffer.compare(v[0], v[i])) {
			console.log({i, u: v[0], v: v[i]})
			throw new Error('same');
		}
	}
}
