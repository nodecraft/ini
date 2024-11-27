'use strict';
/* eslint-disable no-use-before-define */
const {hasOwnProperty} = Object.prototype;

function isConstructorOrProto(obj, key){
	return key === 'constructor' && typeof obj[key] === 'function' || key === '__proto__';
}

const encode = (obj, options) => {
	const children = [];
	let out = '';

	// opt.section is passed in recursively. If passed in on top-level, it'll affect both the top-level ini keys, and any children
	if(typeof options === 'string'){
		options = {
			section: options,
			whitespace: false,
			inlineArrays: false,
			allowEmptySection: false,
			exactValue: false,
		};
	}else{
		options = options || Object.create(null);
		options.whitespace = options.whitespace === true;
	}
	options.platform = options.platform || (typeof process !== 'undefined' && process.platform);
	const eol = options.platform === 'win32' ? '\r\n' : '\n';

	const separator = options.whitespace ? ' = ' : '=';

	for(const [key, val] of Object.entries(obj)){
		if(val && Array.isArray(val)){
			for(const item of val){
				if(options.inlineArrays){
					out += safe(key, null, options) + separator + safe(item, null, options) + eol;
				}else{
					// real code
					out += safe(key + '[]', null, options) + separator + safe(item, null, options) + eol;
				}
			}
		}else if(val && typeof val === 'object'){
			children.push(key);
		}else{
			out += safe(key, null, options) + separator + safe(val, key, options) + eol;
		}
	}

	if((options.section && out.length > 0) || (children.length === 0 && options.allowEmptySection)){
		out = '[' + safe(options.section, null, options) + ']' + eol + out;
	}

	for(const key of children){
		const parsedSection = dotSplit(key).join('\\.');
		const section = (options.section ? options.section + '.' : '') + parsedSection;
		const child = encode(obj[key], {
			section: section,
			whitespace: options.whitespace,
			inlineArrays: options.inlineArrays,
			forceStringifyKeys: options.forceStringifyKeys,
			allowEmptySection: options.allowEmptySection,
			exactValue: options.exactValue,
		});
		if(out.length > 0 && child.length > 0){
			out += eol;
		}
		out += child;
	}

	return out;
};

const dotSplit = str => str.replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
	.replace(/\\\./g, '\u0001')
	.split(/\./)
	.map(part => part.replace(/\1/g, '\\.')
		.replace(/\2LITERAL\\1LITERAL\2/g, '\u0001'));

const decode = (str, options = {}) => {
	const defaultValue = typeof options.defaultValue !== 'undefined' ? options.defaultValue : '';

	const out = Object.create(null);
	let ref = out;
	let section = null;
	//          section       |key        = value
	const re = /^\[([^\]]*)]$|^([^=]+)(?:=(.*))?$/i;
	const lines = str.split(/[\n\r]+/g);
	const commentMatch = /^\s*[#;]/;
	for(const line of lines){
		if(!line || commentMatch.test(line)){ continue; }
		const match = line.match(re);
		if(!match){ continue; }
		if(match[1] !== undefined){
			section = unsafe(match[1]);
			if(isConstructorOrProto(out, section)){
				// not allowed
				// keep parsing the section, but don't attach it.
				ref = Object.create(null);
				continue;
			}
			ref = out[section] = out[section] || Object.create(null);
			continue;
		}
		let key = unsafe(match[2]);
		if(isConstructorOrProto(ref, key)){ continue; }
		let value = null;
		if(options.exactValue){
			value = match[3] ? unsafeExact(match[3]) : defaultValue;
		}else{
			value = match[3] ? unsafe(match[3]) : defaultValue;
		}
		switch(value){
			case 'true':
			case 'True':
			case 'TRUE':
			case 'false':
			case 'False':
			case 'FALSE':
			case 'null': value = JSON.parse(value.toLowerCase());
		}

		// Convert keys with '[]' suffix to an array
		if(key.length > 2 && key.slice(-2) === '[]'){
			key = key.slice(0, Math.max(0, key.length - 2));
			if(isConstructorOrProto(ref, key)){ continue; }
			if(!hasOwnProperty.call(ref, key)){
				ref[key] = [];
			}else if(!Array.isArray(ref[key])){
				ref[key] = [ref[key]];
			}
		}else if(options.inlineArrays && typeof(ref[key]) !== 'undefined' && !Array.isArray(ref[key])){
			ref[key] = [ref[key]];
		}

		// safeguard against resetting a previously defined
		// array by accidentally forgetting the brackets
		if(Array.isArray(ref[key])){
			ref[key].push(value);
		}else{
			ref[key] = value;
		}
	}

	// {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
	// use a filter to return the keys that have to be deleted.
	const remove = [];
	for(const key of Object.keys(out)){
		if(!hasOwnProperty.call(out, key) || typeof out[key] !== 'object' || Array.isArray(out[key])){
			continue;
		}
		// see if the parent section is also an object.
		// if so, add it to that, and mark this one for deletion
		const parts = dotSplit(key);
		let outPart = out;
		const lastKey = parts.pop();
		const unescapedLastKey = lastKey.replace(/\\\./g, '.');
		for(const part of parts){
			if(isConstructorOrProto(outPart, part)){ continue; }
			if(!hasOwnProperty.call(outPart, part) || typeof outPart[part] !== 'object'){
				outPart[part] = Object.create(null);
			}
			outPart = outPart[part];
		}
		if(outPart === out && unescapedLastKey === lastKey){
			continue;
		}
		outPart[unescapedLastKey] = out[key];
		remove.push(key);
	}

	for(const del of remove){
		delete out[del];
	}

	return out;
};

// determines if string is encased in quotes
const isQuoted = val => (val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"));

// escapes the string val such that it is safe to be used as a key or value in an ini-file. Basically escapes quotes
const safe = (val, key, options = {}) => {
	// all kinds of values and keys
	if(typeof val !== 'string' || /[\n\r=]/.test(val) || /^\[/.test(val) || (val.length > 1 && isQuoted(val)) || val !== val.trim()){
		return JSON.stringify(val);
	}
	// force stringify certain keys
	if(key && options.forceStringifyKeys && options.forceStringifyKeys.includes(key)){
		return JSON.stringify(val);
	}
	if(options.exactValue){
		// Don't try to escape a comment in a value
		return val;
	}
	// comments
	return val.replace(/;/g, '\\;').replace(/#/g, '\\#');
};

// unescapes the string val
const unsafe = (val) => {
	const escapableChars = '\\;#';
	const commentChars = ';#';

	val = (val || '').trim();
	if(isQuoted(val)){
		// remove the single quotes before calling JSON.parse
		if(val.charAt(0) === "'"){
			val = val.substr(1, val.length - 2); // eslint-disable-line unicorn/prefer-string-slice
		}
		try{
			val = JSON.parse(val);
		}catch{
			// we tried :(
		}
		return val;
	}
	// walk the val to find the first not-escaped ; character
	let isEscaping = false;
	let escapedVal = '';
	for(let i = 0, len = val.length; i < len; i++){
		const char = val.charAt(i);
		if(isEscaping){
			// check if this character is an escapable character like \ or ; or #
			if(escapableChars.includes(char)){
				escapedVal += char;
			}else{
				escapedVal += '\\' + char;
			}
			isEscaping = false;
		}else if(commentChars.includes(char)){
			// Check if there's spaces around this comment character
			// If there is, then we're done parsing at the character before this one
			if(val.charAt(i - 1) === ' ' && val.charAt(i + 1) === ' '){
				break;
			}
		}else if(char === '\\'){
			isEscaping = true;
		}else{
			escapedVal += char;
		}
	}
	// we're still escaping - something isn't right. Close out with an escaped escape char
	if(isEscaping){
		escapedVal += '\\';
	}
	return escapedVal.trim();
};

const unsafeExact = (val) => {
	val = (val || '').trim();
	if(isQuoted(val)){
		// remove the single quotes before calling JSON.parse
		if(val.charAt(0) === "'"){
			val = val.substr(1, val.length - 2); // eslint-disable-line unicorn/prefer-string-slice
		}
		try{
			val = JSON.parse(val);
		}catch{
			// we tried :(
		}
		return val;
	}
	return val.trim();
};

module.exports = {
	parse: decode,
	decode,
	stringify: encode,
	encode,
	safe,
	unsafe,
};
