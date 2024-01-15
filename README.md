# cid.js
0-dependancy [Multiformat CID](https://github.com/multiformats/cid/blob/master/README.md).

* [`6KB`](./dist/index.min.js) **Default** — full library

```js
import {CID, Multibase} from '@adraffy/cid.js'; // or require()
// npm i @adraffy/cid
// browser: https://cdn.jsdelivr.net/npm/@adraffy/cid@latest/dist/index.min.js

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
// CIDv0 {
//   hash: Multihash { ... }
// }
cid.version; // uvarint => 0
cid.base;    // remembers source base (if CIDv1) => undefined
cid.codec;   // uvarint => 112
cid.hash;
// Multihash {
//   code: number,
//   hash: Uint8Array() [ ... ]
// }
cid.bytes; // encoded bytes => Uint8Array(34) [ ... ]
cid.length; // length of encoded bytes => 34
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

Available coders:
```js
import {
	Base2, Base8, Base16, Base32, Base32Hex, Base32Z, Base64, Base64URL, // RFC4648
	Base10, Base36, Base58BTC, Base58Flickr, // Prefix0
	Bech32,
} from '@adraffy/cid.js';
```


### Build

* `git clone` this repo, then `npm install` 
* `npm run test`
* `npm run build` — create [/dist/](./dist/)
