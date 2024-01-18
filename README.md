# cid.js
0-dependancy [Multiformat CID](https://github.com/multiformats/cid/blob/master/README.md) and related coders.

* [`7KB`](./dist/index.min.js) **Default** — full library

```js
import {CID, Multibase} from '@adraffy/cid'; // or require()
// npm i @adraffy/cid
// browser: https://cdn.jsdelivr.net/npm/@adraffy/cid@latest/dist/index.min.js

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
// CIDv0 {
//   hash: Multihash { ... }
// }
cid.version; // uvarint: 0, 1
cid.base;    // remembers source base (if CIDv1) => undefined
cid.codec;   // uvarint, eg. always 0x70 for CIDv0
cid.hash;
// Multihash {
//   code: number,
//   hash: Uint8Array() [ ... ]
// }
cid.bytes; // encoded bytes => Uint8Array(34) [ ... ]
cid.toString(); // provided base is ignored
// "QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5"


let cid1 = cid.upgrade(); // noop if CIDv1
// CIDv1 {
//   codec: number,
//   hash: Multihash { ... },
//   base?: Multibase { ... }
// }
cid1.toString(); // default base is "b" => base32
// "bafybeia2ixqr5fda7cw5vem65xtirm6puhde3vrehkv4zqxxicwc6gbmuq"
cid1.toString('k'); // use different base by prefix ("k" => base36)
// "k2jmtxs0omsxbtzexbx41py6k7akdtllisuuumrorlmyo2tixbx59rj8"
cid1.toString(Multibase.for('z')); // use different base ("z" => base58btc)
// zdj7WXCTUquTeArWZZbaegbyYuz8mujpBZJkCQsfcvE458QR1
```

Available [bases](./src/bases.js#L60) / coders:
```js
import {
  Base2, Base8, Base16, Base32, Base32Hex, Base32Z, Base64, Base64URL, // RFC4648
  Base10, Base36, Base58BTC, Base58Flickr, // Prefix0
  Bech32,
} from '@adraffy/cid';

let bech = Bech32.from('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
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
p = 0; // reset position
let u; // read written values:
[u, p] = uvarint.readHex(v, p); // "0x45" == 69
[u, p] = uvarint.read(v, p);    //   1056 == 0x420
[u] = uvarint.readBigInt(v, p); // 1337n
[u] = uvarint.readBytes(v, p);  // [5, 57] = 5*256+57 = 1337
```

### Build

* `git clone` this repo, then `npm install` 
* `npm run test`
* `npm run build` — create [/dist/](./dist/)
