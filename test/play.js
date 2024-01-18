import {CID, Bech32} from '../src/index.js';

dump_cid('QmQ7D7QqcAhFdrFfquiz7B5RWZiJ6e9Ast1LzpXZEdZWF5');
dump_cid('bafybeifigsoqndhucwnlmtqoeyjozdhru734eww46dtzljarlab5p3ma4i');
dump_cid('k51qzi5uqu5dgccx524mfjv7znyfsa6g013o6v4yvis9dxnrjbwojc62pt0430');

dump_bech('bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3');

function dump_cid(s) {
	console.log();
	console.log(s);
	let cid = CID.from(s);
	let {version, codec, length, bytes} = cid;
	console.log(cid.toString());
	console.log(cid);
	console.log({version, codec, length, bytes});
	console.log(cid.upgrade().toString());
}

function dump_bech(s) {
	console.log();
	console.log(s);
	let bech = Bech32.decode(s);
	console.log(bech.toString())
	console.log(bech);
}
