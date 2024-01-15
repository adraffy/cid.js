// simple "abc" <-> 012 mapper

export class CharTable {
	constructor(s) {
		this.chars = [...s];
		this.map = new Map(this.chars.map((x, i) => [x, i]));
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
