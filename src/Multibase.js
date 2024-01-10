export const BASES = new Map();

export class Multibase {
	static [Symbol.iterator]() {
		return BASES.values();
	}
	static decode(s) {
		return this.for(s[0]).decode(s.slice(1));
	}
	static for(prefix) {
		let mb = BASES.get(prefix);
		if (!mb) throw new Error(`unknown multibase: ${prefix}`);
		return mb;
	}
	constructor(prefix, name) {
		if (typeof prefix !== 'string' || prefix.length !== 1) throw new TypeError('invalid prefix');
		this.prefix = prefix;
		this.name = name;
		BASES.set(prefix, this);
	}
	encodeWithPrefix(v) {
		return this.prefix + this.encode(v);
	}
}