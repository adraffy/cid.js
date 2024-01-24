# cid.js
0-dependancy [Multiformat CID](https://github.com/multiformats/cid/blob/master/README.md) with related bases and coders.

* [`7KB`](./dist/index.min.js) **Default** — full library
* [`1KB`](./dist/uvarint.min.js) — just [uvarint.js](./src/uvarint.js)

```js
import {CID} from '@adraffy/cid'; // or require()
// npm i @adraffy/cid
// browser: https://cdn.jsdelivr.net/npm/@adraffy/cid@latest/dist/index.min.js

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
// CID {
//   version: number,
//   codec: number,
//   hash: Multihash { ... },
//   base?: Multibase { ... }
// }
cid.version; // 0
cid.codec;   // 0x70 (since version = 0)
cid.base;    // remembers source base if possible
cid.hash;
// Multihash {
//   codec: number,
//   data: Uint8Array() [ ... ]
// }
cid.bytes; // encoded bytes => Uint8Array(34) [ ... ]
cid.toString();
// "QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5"

let cid1 = cid.upgrade(); // copy with version >= 1
cid1.toString(); // default base is "k" => base36
// "k2jmtxs0omsxbtzexbx41py6k7akdtllisuuumrorlmyo2tixbx59rj8"
cid1.toString('z'); // use different base, by prefix (base58btc)
// "zdj7WXCTUquTeArWZZbaegbyYuz8mujpBZJkCQsfcvE458QR1" 
cid1.toString(Multibase.for('b')); // provide Multibase, by prefix (base32)
// "bafybeia2ixqr5fda7cw5vem65xtirm6puhde3vrehkv4zqxxicwc6gbmuq" 
cid2.toString(Multibase.for('base32upper')); // by name
// "BAFYBEIA2IXQR5FDA7CW5VEM65XTIRM6PUHDE3VREHKV4ZQXXICWC6GBMUQ" 
```
Available [bases](./src/bases.js#L69):
```js
import {Multibase} from '@adraffy/cid';

// auto-registers during Multibase() constructor
[...Multibase].map(x => `${x.prefix}:${name}`); // Iterable<Multibase>
// [
//   0:base2,             7:base8,             9:base10,           
//   f:base16,            F:base16upper,       v:base32hex,        
//   V:base32hexupper,    t:base32hexpad,      T:base32hexpadupper,
//   b:base32,            B:base32upper,       c:base32pad,        
//   C:base32padupper,    h:base32z,           k:base36,           
//   K:base36upper,       z:base58btc,         Z:base58flickr,     
//   m:base64,            M:base64pad,         u:base64url,        
//   U:base64urlpad,     
// ]
```
Available coders:
```js
import {
  Base2, Base8, Base16, Base32, Base32Hex, Base32Z, Base64, Base64URL, // RFC4648
  Base10, Base36, Base58BTC, Base58Flickr, // Prefix0
  Bech32,
} from '@adraffy/cid';

Base2.encode([0b10000001]); // "10000001"
Base2.decode('10000001');   // 129 (128+1)

Base58BTC.encode([1, 2, 255]); // "LiA"
Base58BTC.decode('LiA');       // [1, 2, 255]

let bech = Bech32.decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
bech.hrp;  // string, human-readable part, eg. "bc"
bech.type; // number: 1, Bech32.M, etc. (note: this is the checksum)
bech.v32;  // array of base32 numbers
```

Arbitrary-precision [uvarint](./src/uvarint.js):
```js
import {uvarint} from '@adraffy/cid'; // also: dist/uvarint.min.js

let v = []; // output buffer (Array or Uint8Array)
let p = 0;  // write position
p = uvarint.write(v, 69, p);       // Number
p = uvarint.write(v, '0x420', p);  // HexString
p = uvarint.write(v, 1337n, p);    // BigInt
let u;
[u, p] = uvarint.readHex(v, 0);    // "0x45" => 69
[u, p] = uvarint.readBigInt(v, p); //  1056n => 0x420
[u, p] = uvarint.read(v, p);       //   1337
let [u0, u1, u2] = uvarint.read(v, 0, 3); // at position 0, read 3x
// [69, 1056, 1337]
```

### Build

* `git clone` this repo, then `npm install` 
* `npm run test`
* `npm run build` — create [/dist/](./dist/)
