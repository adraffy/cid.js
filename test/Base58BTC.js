import {test, assert, safe_name} from './utils.js';
import {Base58BTC} from '../src/bases.js';

function check_known(buf, enc) {
	test(`base58btc/${safe_name(buf)}`, () => {
		assert.equal(enc, Base58BTC.encode(buf));
		assert.deepEqual(buf, Buffer.from(Base58BTC.decode(enc)));
	});
}

// https://datatracker.ietf.org/doc/html/draft-msporny-base58-03#section-5
check_known(Buffer.from('Hello World!'), '2NEpo7TZRRrLZSi2U');
check_known(Buffer.from('The quick brown fox jumps over the lazy dog.'), 'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z');
check_known(Buffer.from('0000287fb4cd', 'hex'), '11233QC4');
