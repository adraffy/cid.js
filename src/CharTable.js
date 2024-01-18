// simple "abc" <-> 012 mapper

export class CharTable {
	constructor(s) {
		let v = this.chars = [...s];
		this.map = new Map(v.map((x, i) => [x, i]));
	}
	get length() {
		return this.map.size;
	}
	indexOf(s) {
		let i = this.map.get(s);
		if (!Number.isInteger(i)) throw new TypeError(`invalid digit "${s}"`);
		return i;
	}
	encode(v) {
		return Array.from(v, i => this.chars[i]).join('');
	}
}
