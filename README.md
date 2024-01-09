# cid.js
0-dependancy [Multiformat CID](https://github.com/multiformats/cid/blob/master/README.md)

```js
import {CID} from '@adraffy/cid.js';

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
// CIDv0 {
//   hash: Multihash {
//     code: 18,
//     hash: Uint8Array(32) [
//        26,  69, 225,  30, 148,  96, 248, 173,
//       218, 145, 158, 237, 230, 136, 179, 207,
//       161, 198,  77, 214,  36,  58, 171, 204,
//       194, 247,  64, 172,  47,  24,  44, 164
//     ]
//   }
// }
console.log(cid.toString()); 
// "QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5"
console.log(cid.upgrade().toString());
// "bafybeia2ixqr5fda7cw5vem65xtirm6puhde3vrehkv4zqxxicwc6gbmuq"

let cid = CID.from('bafybeifigsoqndhucwnlmtqoeyjozdhru734eww46dtzljarlab5p3ma4i');
// CIDv1 {
//   codec: 112,
//   hash: Multihash {
//     code: 18,
//     hash: Uint8Array(32) [
//       168,  52, 157,  6, 140, 244,  21, 154,
//       182,  78,  14, 38,  18, 236, 140, 241,
//       167, 247, 194, 90, 220, 240, 231, 149,
//       164,  17,  88,  3, 215, 237, 128, 226
//     ]
//   }
// }
```
