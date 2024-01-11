// simple "abc" <-> 012 mapper
// parse("a") => 0
// format([0,1,2]) => "abc"

export class CharTable {
	constructor(s) {
		this.chars = [...s];
		this.map = new Map(this.chars.map((x, i) => [x, i]));
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
