import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export {test, assert};

export function rng(n) {
	return Math.floor(Math.random() * n);
}

export function random_bytes(length) {
	return Uint8Array.from({length}, () => rng(256));
}

export function random_choice(v) {
	return v[rng(v.length)];
}

export function sha256(x) {
	return createHash('sha256').update(x).digest();
}

export function hex(x) {
	let s = x.toString(16);
	return s.toUpperCase().padStart((s.length+1)&~1, '0');
}

export function safe_name(x, n = 24) {
	let buf = Buffer.from(x);
	let name = Array.from(buf.subarray(0, n), x => {
		let ch = String.fromCodePoint(x);
		return /[0-9a-z-_]/i.test(ch) ? ch : `{${hex(x)}}`;
	}).join('').replaceAll('}{', '');
	if (buf.length > n) name += '...';
	return name;
}
