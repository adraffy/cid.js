import {Multibase} from '../src/index.js';
import {test, assert, rng, random_bytes} from './utils.js';

function check_same(name, encoded, raw) {
	test(`multibase/${name}`, () => {
		let v = encoded.map(s => Buffer.from(Multibase.decode(s).data));
		for (let i = 1; i < encoded.length; i++) {
			assert.deepEqual(v[0], v[i]);
		}
		if (raw) {
			assert.deepEqual(v[0], raw);
		}
	});	
}

// https://github.com/multiformats/multibase#multibase-by-example
check_same('example', [
	'F4D756C74696261736520697320617765736F6D6521205C6F2F',
	'BJV2WY5DJMJQXGZJANFZSAYLXMVZW63LFEEQFY3ZP',
	'K3IY8QKL64VUGCX009XWUHKF6GBBTS3TVRXFRA5R',
	'zYAjKoNbau5KiqmHPmSxYCvn66dA1vLmwbt',
	'MTXVsdGliYXNlIGlzIGF3ZXNvbWUhIFxvLw=='
]);

// https://github.com/multiformats/multibase/blob/master/tests/basic.csv
check_same('basic', [
	'001111001011001010111001100100000011011010110000101101110011010010010000000100001',
	'7362625631006654133464440102',
	'9573277761329450583662625',
	'f796573206d616e692021',
	'F796573206D616E692021',
	'bpfsxgidnmfxgsibb',
	'BPFSXGIDNMFXGSIBB',
	'vf5in683dc5n6i811',
	'VF5IN683DC5N6I811',
	'cpfsxgidnmfxgsibb',
	'CPFSXGIDNMFXGSIBB',
	'tf5in683dc5n6i811',
	'TF5IN683DC5N6I811',
	'hxf1zgedpcfzg1ebb',
	'k2lcpzo5yikidynfl',
	'K2LCPZO5YIKIDYNFL',
	'Z7Pznk19XTTzBtx',
	'z7paNL19xttacUY',
	'meWVzIG1hbmkgIQ',
	'MeWVzIG1hbmkgIQ==',
	'ueWVzIG1hbmkgIQ',
	'UeWVzIG1hbmkgIQ=='
], Buffer.from('yes mani !'));


// https://github.com/multiformats/multibase/blob/master/tests/two_leading_zeros.csv
check_same('leading00', [
	'0000000000000000001111001011001010111001100100000011011010110000101101110011010010010000000100001',
	'700000171312714403326055632220041',
	'900573277761329450583662625',
	'f0000796573206d616e692021',
	'F0000796573206D616E692021',
	'baaahszltebwwc3tjeaqq',
	'BAAAHSZLTEBWWC3TJEAQQ',
	'v0007ipbj41mm2rj940gg',
	'V0007IPBJ41MM2RJ940GG',
	'caaahszltebwwc3tjeaqq====',
	'CAAAHSZLTEBWWC3TJEAQQ====',
	't0007ipbj41mm2rj940gg====',
	'T0007IPBJ41MM2RJ940GG====',
	'hyyy813murbssn5ujryoo',
	'k002lcpzo5yikidynfl',
	'K002LCPZO5YIKIDYNFL',
	'Z117Pznk19XTTzBtx',
	'z117paNL19xttacUY',
	'mAAB5ZXMgbWFuaSAh',
	'MAAB5ZXMgbWFuaSAh',
	'uAAB5ZXMgbWFuaSAh', 
	'UAAB5ZXMgbWFuaSAh'
], Buffer.from('\0\0yes mani !'));

// https://github.com/multiformats/multibase/blob/master/tests/case_insensitivity.csv
check_same('case', [
	'f68656c6c6f20776F726C64',
	'F68656c6c6f20776F726C64',
	'bnbswy3dpeB3W64TMMQ',
	'Bnbswy3dpeB3W64TMMQ',
	'vd1imor3f41RMUSJCCG',
	'Vd1imor3f41RMUSJCCG',
	'cnbswy3dpeB3W64TMMQ======',
	'Cnbswy3dpeB3W64TMMQ======',
	'td1imor3f41RMUSJCCG======',
	'Td1imor3f41RMUSJCCG======',
	'kfUvrsIvVnfRbjWaJo',
	'KfUVrSIVVnFRbJWAJo'
], Buffer.from('hello world'));


for (let mb of Multibase) {
	test(`multibase/${mb.name}`, () => {
		for (let i = 0; i < 100; i++) {
			let v0 = random_bytes(rng(1024));
			let enc = mb.encode(v0);
			let v1 = mb.decode(enc);
			assert.deepEqual(v0, v1);
		}
	});
}