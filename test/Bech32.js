import {Bech32} from '../src/index.js';
import {test, assert, rng, safe_name} from './utils.js';

function random_hrp(n = 10) {
	return Array.from({length: 1+rng(n)}, () => 33+rng(1+126-33)).join('');
}

function check_type(type) {
	test(`bech32/type=${type}`, () => {
		for (let i = 0; i < 1000; i++) {
			let v0 = Uint8Array.from({length: rng(1000)}, () => rng(32));
			let hrp = random_hrp();
			let enc = new Bech32(hrp, v0, type).toString();
			let v1 = Bech32.decode(enc, type).v32;
			assert.deepEqual(v0, v1);
		}
	});
}

function check_known(s, type) {
	test(`bech32/${safe_name(s)}`, () => {
		let bech;
		try {
			bech = Bech32.decode(s);
		} catch (err) {
			if (type) assert.fail(s);
		}
		if (bech) {
			if (!type) assert.fail(s);
			assert.equal(bech.type, type);
		}
	});	
}

check_type(1);
check_type(69420);
check_type(Bech32.M);

// https://en.bitcoin.it/wiki/BIP_0173#Examples
check_known('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 1);
check_known('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', 1);
check_known('bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3', 1);
check_known('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', 1);

// https://en.bitcoin.it/wiki/BIP_0350#Test_vectors
check_known('A1LQFN3A', Bech32.M);
check_known('a1lqfn3a', Bech32.M);
check_known('an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11sg7hg6', Bech32.M);
check_known('abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx', Bech32.M);
check_known('11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8', Bech32.M);
check_known('split1checkupstagehandshakeupstreamerranterredcaperredlc445v', Bech32.M);
check_known('?1v759aa', Bech32.M);

// fails
check_known('\x201xj0phk'); // bad hrp
check_known('qyrz8wqd2c9m'); // no sep
check_known('16plkw9'); // empty hrp
check_known('in1muywd'); // short checksum
check_known('mm1crxm3i'); // bad checksum char
