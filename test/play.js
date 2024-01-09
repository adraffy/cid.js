import {CID} from '../src/index.js';

let cid = CID.from('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
console.log(cid);
console.log(cid.toString());
console.log(cid.upgrade().toString());


console.log(CID.from('bafybeifigsoqndhucwnlmtqoeyjozdhru734eww46dtzljarlab5p3ma4i'));
console.log(CID.from('k51qzi5uqu5dgccx524mfjv7znyfsa6g013o6v4yvis9dxnrjbwojc62pt0430'));