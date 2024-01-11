import {CID, Multibase} from '../src/index.js';

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
