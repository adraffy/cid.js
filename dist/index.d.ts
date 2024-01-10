type BytesLike = number[]|Uint8Array;

export abstract class CID {
	static from(v: string|BytesLike): CID;
	upgrade(): CIDv1;
	version: number;
	codec: number;
	length: number;
	bytes: Uint8Array;	
}
export class CIDv0 extends CID {
	constructor(hash: Uint8Array);
}
export class CIDv1 extends CID {
	constructor(codec: number, hash: Uint8Array);
}

export class Multibase {
	static decode(s: string): Uint8Array;
	static for(prefix: string): Multibase;
	static [Symbol.iterator](): Iterable<Multibase>;
	prefix: string;
	name: string;
	constructor(prefix: string, name: string);
	encode(v: BytesLike): string;
	decode(s: string): Uint8Array;
	encodeWithPrefix(v: BytesLike): string;
}

export class Multihash {
	static from(v: string|BytesLike): Multihash;
	code: number;
	hash: Uint8Array;
	constructor(code: number, hash: Uint8Array);
	get length(): number;
	get bytes(): Uint8Array;
	write(buf: Uint8Array, pos?: number): number;
}

export const uvarint: {
	MAX: number;
	sizeof(u: number): number;
	read(v: BytesLike, pos?: number): [u: number, pos: number],
	write(v: BytesLike, u: number, pos?: number): number;
}

export class RFC4648 {
	constructor(chars: string);
	decode(s: string): Uint8Array;
	encode(v: BytesLike, pad?: boolean): string;
}

export class Prefix0 {
	constructor(chars: string);
	decode(s: string): Uint8Array;
	encode(v: BytesLike): string;
}

export const Base2: RFC4648;
export const Base8: RFC4648;
export const Base10: Prefix0;
export const Base16: RFC4648;
export const Base32: RFC4648;
export const Base32Hex: RFC4648;
export const Base36: Prefix0;
export const Base58BTC: Prefix0;
export const Base64URL: RFC4648;
export const Base64: RFC4648;
