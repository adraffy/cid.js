const MAP = new Map();
const BASES = new Set();

export class Multibase {
	static [Symbol.iterator]() {
		return BASES.values();
	}
	static decode(s) {
		// multibase spec says this is actually a codepoint
		// (see base-emoji) however that seems like bullshit
		// as the whole point of this is to support channels
		// w/o an additional wrapper (eg. Base36 "k" => DNS)
		let cp = s.codePointAt(0);
		let base = this.for(String.fromCodePoint(cp));
		let data = base.decode(s.slice(cp < 0x10000 ? 1 : 2));
		return {base, data};
	}
	static for(prefix) {
		if (prefix instanceof this) return prefix;
		let mb = MAP.get(prefix);
		if (!mb) throw new Error(`unknown multibase: ${prefix}`);
		return mb;
	}
	constructor(prefix, name) {
		if (prefix.length !== 1) throw new Error('invalid prefix');
		this.prefix = prefix;
		this.name = name;
		// register names, allow replacement
		MAP.set(prefix, this); 
		MAP.set(name, this);
		BASES.add(this);
	}
	encodeWithPrefix(v) {
		return this.prefix + this.encode(v);
	}
	// abstract:
	// encode(v): s
	// decode(s): v
}