import {Prefix0} from './Prefix0.js';
import {RFC4648} from './RFC4648.js';
import {Multibase} from './Multibase.js';

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const az = AZ.toLowerCase();
const Z9 = '0123456789';

function drop58(s) { return s.replaceAll(/[0OIl]/g, ''); }

// https://www.rfc-editor.org/rfc/rfc4648.html#section-4 
export const Base64 = new RFC4648(AZ + az + Z9 + '+/');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-5
export const Base64URL = new RFC4648(AZ + az + Z9 + '-_');

// https://tools.ietf.org/id/draft-msporny-base58-03.html 
export const Base58BTC = new Prefix0(drop58(Z9 + AZ + az));

// https://www.flickr.com/groups/api/discuss/72157616713786392/
export const Base58Flickr = new Prefix0(drop58(Z9 + az + AZ));

// https://github.com/multiformats/multibase/blob/master/rfcs/Base36.md
export const Base36 = new Prefix0(Z9 + az);

// https://philzimmermann.com/docs/human-oriented-base-32-encoding.txt
export const Base32Z = new RFC4648('ybndrfg8ejkmcpqxot1uwisza345h769');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-7
export const Base32Hex = new RFC4648(Z9 + az.slice(0, -4));

// https://www.rfc-editor.org/rfc/rfc4648.html#section-6
export const Base32 = new RFC4648('abcdefghijklmnopqrstuvwxyz234567');

// https://www.rfc-editor.org/rfc/rfc4648.html#section-8
export const Base16 = new RFC4648(Z9 + 'abcdef');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base10.md
export const Base10 = new Prefix0(Z9); 

// https://github.com/multiformats/multibase/blob/master/rfcs/Base8.md
export const Base8 = new RFC4648('01234567');

// https://github.com/multiformats/multibase/blob/master/rfcs/Base2.md
export const Base2 = new RFC4648('01');

// helper class to wrap a coder
export class Multibased extends Multibase {
	constructor(prefix, name, coder, {casing, padding} = {}) {
		super(prefix, name);
		this.coder = coder;
		this.casing = casing;
		this.padding = padding;
	}
	decode(s) {
		if (this.casing !== undefined) s = s.toLowerCase(); // if any casing, make it lower
		return this.coder.decode(s);
	}
	encode(v) {
		let s = this.coder.encode(v, this.padding);
		if (this.casing) s = s.toUpperCase(); // if upper casing, make it upper
		return s;
	}
}

// https://github.com/multiformats/multibase#multibase-table
new Multibased('0', 'base2', Base2);
new Multibased('7', 'base8', Base8);
new Multibased('9', 'base10', Base10);
new Multibased('f', 'base16', Base16, {casing: false});
new Multibased('F', 'base16upper', Base16, {casing: true});
new Multibased('v', 'base32hex', Base32Hex, {casing: false});
new Multibased('V', 'base32hexupper', Base32Hex, {casing: true});
new Multibased('t', 'base32hexpad', Base32Hex, {casing: false, padding: true});
new Multibased('T', 'base32hexpadupper', Base32Hex, {casing: true, padding: true});
new Multibased('b', 'base32', Base32, {casing: false});
new Multibased('B', 'base32upper', Base32, {casing: true});
new Multibased('c', 'base32pad', Base32, {casing: false, padding: true});
new Multibased('C', 'base32padupper', Base32, {casing: true, padding: true});
new Multibased('h', 'base32z', Base32Z);
new Multibased('k', 'base36', Base36, {casing: false});
new Multibased('K', 'base36upper', Base36, {casing: true});
new Multibased('z', 'base58btc', Base58BTC);
new Multibased('Z', 'base58flickr', Base58Flickr);
new Multibased('m', 'base64', Base64);
new Multibased('M', 'base64pad', Base64, {padding: true});
new Multibased('u', 'base64url', Base64URL);
new Multibased('U', 'base64urlpad', Base64URL, {padding: true});
// U+0070,     p,          proquint,           Proquint (https://arxiv.org/html/0901.4016)
// U+1F680,    🚀,         base256emoji,       base256 with custom alphabet using variable-sized-codepoints

// what the fuck does this mean?
// "NOTE: Multibase-prefixes are encoding agnostic. "z" is "z", not 0x7a ("z" encoded as ASCII/UTF-8).
//  In UTF-32, for example, that same "z" would be [0x7a, 0x00, 0x00, 0x00] not [0x7a]."
