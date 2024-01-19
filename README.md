# cid.js
0-dependancy [Multiformat CID](https://github.com/multiformats/cid/blob/master/README.md) with related bases and coders.

* [`7KB`](./dist/index.min.js) **Default** — full library
* [`800B`](./dist/uvarint.min.js) — just [uvarint.js](./src/uvarint.js)

```js
import {CID, Multibase} from '@adraffy/cid'; // or require()
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

let cid1 = cid.upgrade(); // noop if version > 0
cid1.toString(); // default base is "k" => base36
// "k2jmtxs0omsxbtzexbx41py6k7akdtllisuuumrorlmyo2tixbx59rj8"
cid1.toString('b'); // use different base, by prefix (base32)
// "bafybeia2ixqr5fda7cw5vem65xtirm6puhde3vrehkv4zqxxicwc6gbmuq" 
cid1.toString(Multibase.for('z')); // provide Multibase, by prefix (base58btc)
// "zdj7WXCTUquTeArWZZbaegbyYuz8mujpBZJkCQsfcvE458QR1" 
cid2.toString(Multibase.for('base36upper')); // by name
// "K2JMTXS0OMSXBTZEXBX41PY6K7AKDTLLISUUUMRORLMYO2TIXBX59RJ8" 

// list of registered multibases
[...Multibase]; // Iterable<Multibase>
```

Available [bases](./src/bases.js#L60) / coders:
```js
import {
  Base2, Base8, Base16, Base32, Base32Hex, Base32Z, Base64, Base64URL, // RFC4648
  Base10, Base36, Base58BTC, Base58Flickr, // Prefix0
  Bech32,
} from '@adraffy/cid';

// all raw bases have encode/decode API
Base58BTC.encode([1, 2, 255]); // "LiA"
Base58BTC.decode('LiA'); // [1, 2, 255]

let bech = Bech32.decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
bech.hrp;  // string, human-readable part, eg. "bc"
bech.type; // number: 1, Bech32.M, etc. (note: this is the checksum)
bech.v32;  // array of base32 numbers
```

Arbitrary-precision [uvarint](./src/uvarint.js):
```js
import {uvarint} from '@adraffy/cid'; // also: dist/uvarint.min.js

let v = []; // output buffer (Array or Uint8Array)
let p = 0; // write position
p = uvarint.write(v, 69, p);      // Number
p = uvarint.write(v, '0x420', p); // HexString
p = uvarint.write(v, 1337n, p);   // BigInt
let u;
[u, p] = uvarint.readHex(v, 0);    // "0x45" => 69
[u, p] = uvarint.readBigInt(v, p); //  1056n => 0x420
[u, p] = uvarint.read(v, p);       //   1337
let [u0, u1, u2] = uvarint.read(v, 0, 3); // read 3 uvarints at 0
// [69, 1056, 1337]
```

### Build

* `git clone` this repo, then `npm install` 
* `npm run test`
* `npm run build` — create [/dist/](./dist/)
