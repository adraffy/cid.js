import {CID, Multibase, Bech32, uvarint} from '../src/index.js';

console.log('==== CID ====');

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');

console.log(cid);
let {version, codec, bytes} = cid;
console.log({version, codec, bytes});
console.log(cid.toString());

let cid1 = cid.upgrade();
console.log(cid1);
console.log(cid1.toString());
console.log(cid1.toString('k'));
console.log(cid1.toString(Multibase.for('z')));

console.log('=== Bech32 ====');

let bech = Bech32.from('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
let {hrp, type, v32} = bech;
console.log({hrp, type, v32});

console.log('=== uvarint ====');

let v = [], p = 0;
p = uvarint.write(v, 69, p);
p = uvarint.write(v, '0x420', p);
p = uvarint.write(v, 1337n, p);
p = 0;
let u;
[u, p] = uvarint.readHex(v, p); // "0x45" == 69
console.log(u);
[u, p] = uvarint.read(v, p); // 1056 === 0x420
console.log(u);
[u] = uvarint.readBigInt(v, p); // 1337n
console.log(u);
[u] = uvarint.readBytes(v, p); // [5, 57] = 5*256+57 = 1337
console.log(u);
