# cid.js
0-dependancy [Multiformat CID](https://github.com/multiformats/cid/blob/master/README.md) that works in the browser.

* [`6KB`](./dist/index.min.js) **Default** — full library

```js
import {CID} from '@adraffy/cid.js'; // or require()
// npm i @adraffy/cid
// browser: https://cdn.jsdelivr.net/npm/@adraffy/cid@latest/dist/index.min.js

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
// CIDv0 {
//   hash: Multihash {
//     code: 18,
//     hash: Uint8Array(32) [ ... ]
//   }
// }
cid.version; // uvarint: 0 or 1
cid.codec;   // uvarint: 112
cid.bytes;   // encoded bytes
cid.length;  // length of encoded bytes
cid.toString(); 
// "QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5"

let cid1 = cid.upgrade(); // noop if CIDv1
// CIDv1 {
//   codec: 112,
//   hash: Multihash {
//     code: 18,
//     hash: Uint8Array(32) [ ... ]
//   }
// }
cid1.toString(); // default base is "b" => base32
// "bafybeia2ixqr5fda7cw5vem65xtirm6puhde3vrehkv4zqxxicwc6gbmuq"
cid1.toString('k'); // base "k" => base36
// "k2jmtxs0omsxbtzexbx41py6k7akdtllisuuumrorlmyo2tixbx59rj8"
```

### Build

* `git clone` this repo, then `npm install` 
* `npm run test`
* `npm run build` — create [/dist/](./dist/)
