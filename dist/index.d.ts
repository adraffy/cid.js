type BytesLike = number[]|Uint8Array;

interface Coder {
	decode(s: string): Uint8Array;
	encode(v: BytesLike, pad?: boolean): string,
}

export class CID {
	static from(v: string|BytesLike): CID;
	constructor(codec: number, hash: Uint8Array, base?: Multibase);
	version: number;
	codec: number;
	base?: Multibase;
	get bytes(): Uint8Array;
	upgrade(): CID;
}

export class Multibase implements Coder {
	static decode(s: string): {base: Multibase, data: Uint8Array};
	static for(prefix: string|Multibase): Multibase;
	static [Symbol.iterator](): Iterable<Multibase>;
	prefix: string;
	name: string;
	constructor(prefix: string, name: string);
	decode(s: string): Uint8Array;
	encode(v: BytesLike): string;
	encodeWithPrefix(v: BytesLike): string;
}
export class Multibased extends Multibase {
	constructor(prefix: string, name: string, coder: Coder, options?: {casing?: boolean, padding?: boolean});
	coder: Coder;
	casing?: boolean;
	padding?: boolean;
}

export class Multihash {
	static from(v: string|BytesLike): Multihash;
	constructor(codec: number, data: Uint8Array);
	codec: number;
	data: Uint8Array;
	get bytes(): Uint8Array;
	write(v: Uint8Array, pos?: number): number;
}

export const uvarint: {
	write(v: BytesLike, u: BytesLike|string|number, pos?: number): number;
	      read(v: BytesLike, pos?: number, n?: number): [...number[], pos: number];
	   readHex(v: BytesLike, pos?: number, n?: number): [...string[], pos: number];
	readBigInt(v: BytesLike, pos?: number, n?: number): [...BigInt[], pos: number];
}

export class RFC4648 implements Coder {
	constructor(chars: string);
	decode(s: string): Uint8Array;
	encode(v: BytesLike, pad?: boolean): string;
}

export class Prefix0 implements Coder {
	constructor(chars: string);
	decode(s: string): Uint8Array;
	encode(v: BytesLike): string;
}

export class Bech32 {
	static M: number;
	static decode(s: string): Bech32;
	constructor(hrp: string, v32: number[], type?: number);
	hrp: string;
	v32: number[];
	type: number;
}

export const Base2: RFC4648;
export const Base8: RFC4648;
export const Base10: Prefix0;
export const Base16: RFC4648;
export const Base32: RFC4648;
export const Base32Hex: RFC4648;
export const Base32Z: RFC4648;
export const Base36: Prefix0;
export const Base58BTC: Prefix0;
export const Base58Flickr: Prefix0;
export const Base64URL: RFC4648;
export const Base64: RFC4648;
