export class CharTable {
	constructor(s) {
		if (typeof s !== 'string') throw new TypeError();
		let v = [...s];
		if (v.length !== s.length) throw new TypeError();
		this.chars = s;
		this.map = new Map(v.map((x, i) => [x, i]));
	}
	get length() {
		return this.map.size;
	}
	parse(s) {
		let i = this.map.get(s);
		if (!Number.isInteger(i)) throw new TypeError(`invalid digit "${s}"`);
		return i;
	}
	format(v) {
		return v.map(i => this.chars[i]).join('');
	}
}
