import {CID} from '../src/index.js';

dump('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
dump('bafybeifigsoqndhucwnlmtqoeyjozdhru734eww46dtzljarlab5p3ma4i');
dump('k51qzi5uqu5dgccx524mfjv7znyfsa6g013o6v4yvis9dxnrjbwojc62pt0430');

function dump(s) {
	let cid = CID.from(s);
	let {version, codec, length, bytes} = cid;
	console.log();
	console.log(`Input:`, s);
	console.log(cid);
	console.log({version, codec, length, bytes});
	console.log(cid.toString());	
	console.log(cid.upgrade().toString());
	if (cid != s) throw new Error('bug');
}
