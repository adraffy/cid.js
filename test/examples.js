import {CID, Multibase, Bech32, Base58BTC, uvarint} from '../src/index.js';

console.log('==== CID ====');

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');

console.log(cid);
let {version, codec, bytes} = cid;
console.log({version, codec, bytes});
console.log(cid.toString());

let cid1 = cid.upgrade();
console.log(cid1);
console.log(cid1.toString());
console.log(cid1.toString('z'));
console.log(cid1.toString(Multibase.for('b')));
console.log(cid1.toString(Multibase.for('base32upper')));

dump_cols([...Multibase].map(x => `${x.prefix}:${x.name}`), 4);

console.log('=== Bases === ');

let enc = Base58BTC.encode([1, 2, 255]).toString();
console.log(enc);
console.log(Base58BTC.decode(enc));

console.log('=== Bech32 ====');

let bech = Bech32.decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
let {hrp, type, v32} = bech;
console.log({hrp, type, v32});

console.log('=== uvarint ====');

let v = [], p = 0;
p = uvarint.write(v, 69, p);
p = uvarint.write(v, '0x420', p);
p = uvarint.write(v, 1337n, p);
let u;
[u, p] = uvarint.readHex(v, 0); 
console.log(u);
[u, p] = uvarint.readBigInt(v, p); 
console.log(u);
[u, p] = uvarint.read(v, p); 
console.log(u);
let us = uvarint.read(v, 0, 3);
console.log(us);

function dump_cols(v, cols) {
	v = v.map(x => x + ',');
	let w = v.reduce((a, x) => Math.max(a, x.length), 0);
	console.log('[');
	for (let i = 0; i < v.length; ) {
		console.log('  ' + v.slice(i, i += cols).map(x => x.padEnd(w)).join(' '));
	}
	console.log(']');
}