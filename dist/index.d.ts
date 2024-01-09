declare class CID {
	static from(v: string|number[]|Uint8Array): CID;
	upgrade(): CIDv1;
	version: number;
	codec: number;
	length: number;
	bytes: Uint8Array;
}
declare class CIDv0 extends CID {
	constructor(hash: Uint8Array);
}
declare class CIDv1 extends CID {
	constructor(codec: number, hash: Uint8Array);
}
