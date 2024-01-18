import {CID, Multibase, uvarint} from '../src/index.js';

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');

console.log(cid);

let {version, codec, length, bytes} = cid;
console.log({version, codec, length, bytes});

console.log(cid.toString());

let cid1 = cid.upgrade();

console.log(cid1);

console.log(cid1.toString());
console.log(cid1.toString('k'));
console.log(cid1.toString(Multibase.for('z')));

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