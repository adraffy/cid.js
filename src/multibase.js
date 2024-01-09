import {Prefix0} from './Prefix0.js';
import {RFC4648} from './RFC4648.js';

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const RADIX = '0123456789' + ALPHA;

// https://www.rfc-editor.org/rfc/rfc4648.html#section-4 
export const Base64 = new RFC4648(ALPHA.toUpperCase() + ALPHA + RADIX.slice(0, 10) + '+/');
// https://www.rfc-editor.org/rfc/rfc4648.html#section-5
export const Base64URL = new RFC4648(ALPHA.toUpperCase() + ALPHA + RADIX.slice(0, 10) + '-_');
// https://tools.ietf.org/id/draft-msporny-base58-03.html 
export const Base58BTC = new Prefix0('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
// https://github.com/multiformats/multibase/blob/master/rfcs/Base36.md
export const Base36 = new Prefix0(RADIX);
// https://www.rfc-editor.org/rfc/rfc4648.html#section-7
export const Base32Hex = new RFC4648(RADIX.slice(0, 32));
// https://www.rfc-editor.org/rfc/rfc4648.html#section-6
export const Base32 = new RFC4648('abcdefghijklmnopqrstuvwxyz234567');
// https://www.rfc-editor.org/rfc/rfc4648.html#section-8
export const Base16 = new RFC4648(RADIX.slice(0, 16));
// https://github.com/multiformats/multibase/blob/master/rfcs/Base10.md
export const Base10 = new Prefix0(RADIX.slice(0, 10)); 
// https://github.com/multiformats/multibase/blob/master/rfcs/Base8.md
export const Base8 = new RFC4648(RADIX.slice(0, 8));
// https://github.com/multiformats/multibase/blob/master/rfcs/Base2.md
export const Base2 = new RFC4648(RADIX.slice(0, 2));

function bind(base, ...a) {
	return {
		decode: s => base.decode(s, ...a),
		encode: v => base.encode(v, ...a)
	};
}

export const MULTIBASES = {};
export function register(prefix, {encode, decode}, args = {}) {
	MULTIBASES[prefix] = {prefix, encode, decode, ...args};
}

// https://github.com/multiformats/multibase#multibase-table  

register('0', bind(Base2), {name: 'base2'});
register('7', bind(Base8), {name: 'base8'});
register('9', bind(Base10), {name: 'base10'});
register('f', bind(Base16), {case: false, name: 'base16'});
register('F', bind(Base16), {case: true, name: 'base16upper'});
register('v', bind(Base32Hex), {case: false, name: 'base32hex'});
register('V', bind(Base32Hex), {case: true, name: 'base32hexupper'});
register('t', bind(Base32Hex, true), {case: false, name: 'base32hexpad'});
register('T', bind(Base32Hex, true), {case: true, name: 'base32hexpadupper'});
register('b', bind(Base32), {case: false, name: 'base32'});
register('B', bind(Base32), {case: true, name: 'base32upper'});
register('c', bind(Base32, true), {case: false, name: 'base32pad'});
register('C', bind(Base32, true), {case: true, name: 'base32padupper'});
// h
register('k', bind(Base36), {case: false,name: 'base36'});
register('K', bind(Base36), {case: true, name: 'base36upper'});
register('z', bind(Base58BTC), {name: 'base58btc'});
// ZBase58BTC
register('m', bind(Base64), {name: 'base64'});
register('M', bind(Base64, true), {name: 'base64pad'});
register('u', bind(Base64URL), {name: 'base64url'});
register('U', bind(Base64URL, true), {name: 'base64urlpad'});
// p
register('1', bind(Base58BTC), {name: 'base58btc-Identity'});
register('Q', bind(Base58BTC), {name: 'base58btc-CIDv0'});

export function decode(s, prefix) {
	if (typeof s !== 'string') throw new TypeError('expected string');
	if (!prefix) { 
		prefix = s[0];
		s = s.slice(1);
	}
	let mb = MULTIBASES[prefix];
	if (!mb) throw new Error(`unknown multibase: ${prefix}`);	
	if (mb.casing !== undefined) s = s.toLowerCase();
	return mb.decode(s);
}

export function encode(prefix, v, prefixed = true) {
	let mb = MULTIBASES[prefix];
	if (!mb) throw new Error(`unknown multibase: ${prefix}`);
	let s = mb.encode(v);
	if (mb.casing) s = s.toUpperCase();
	if (prefixed) s = mb.prefix + s; 
	return s;
}
