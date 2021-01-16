'use strict';
/* eslint-disable no-use-before-define */
const {hasOwnProperty} = Object.prototype;

const eol = require('os').EOL;

const encode = (obj, opt) => {
	const children = [];
	let out = '';

	// opt.section is passed in recursively. If passed in on top-level, it'll affect both the top-level ini keys, and any children
	if(typeof opt === 'string'){
		opt = {
			section: opt,
			whitespace: false,
			inlineArrays: false
		};
	}else{
		opt = opt || Object.create(null);
		opt.whitespace = opt.whitespace === true;
	}
	const separator = opt.whitespace ? ' = ' : '=';

	for(const [key, val] of Object.entries(obj)){
		if(val && Array.isArray(val)){
			for(const item of val){
				if(opt.inlineArrays){
					out += safe(key) + separator + safe(item) + eol;
				}else{
					// real code
					out += safe(key + '[]') + separator + safe(item) + eol;
				}
			}
		}else if(val && typeof val === 'object'){
			children.push(key);
		}else{
			out += safe(key) + separator + safe(val) + eol;
		}
	}

	if(opt.section && out.length > 0){
		out = '[' + safe(opt.section) + ']' + eol + out;
	}

	for(const key of children){
		const parsedSection = dotSplit(key).join('\\.');
		const section = (opt.section ? opt.section + '.' : '') + parsedSection;
		const child = encode(obj[key], {
			section: section,
			whitespace: opt.whitespace,
			inlineArrays: opt.inlineArrays
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

const decode = (str, opt = {}) => {
	const defaultValue = typeof opt.defaultValue !== 'undefined' ? opt.defaultValue : '';

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
			if(section === '__proto__'){
				// not allowed
				// keep parsing the section, but don't attach it.
				ref = Object.create(null);
				continue;
			}
			ref = out[section] = out[section] || Object.create(null);
			continue;
		}
		let key = unsafe(match[2]);
		if(key === '__proto__'){ continue; }
		let value = match[3] ? unsafe(match[3]) : defaultValue;
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
			if(key === '__proto__'){ continue; }
			if(!hasOwnProperty.call(ref, key)){
				ref[key] = [];
			}else if(!Array.isArray(ref[key])){
				ref[key] = [ref[key]];
			}
		}else if(opt.inlineArrays && typeof(ref[key]) !== 'undefined' && !Array.isArray(ref[key])){
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
		console.log('parts', parts);
		const lastKey = parts.pop();
		const unescapedLastKey = lastKey.replace(/\\\./g, '.');
		for(const part of parts){
			if(part === '__proto__'){ continue; }
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
const safe = (val) => {
	// all kinds of values and keys
	if(typeof val !== 'string' || /[\n\r=]/.test(val) || /^\[/.test(val) || (val.length > 1 && isQuoted(val)) || val !== val.trim()){
		return JSON.stringify(val);
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
			break;
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

module.exports = {
	parse: decode,
	decode,
	stringify: encode,
	encode,
	safe,
	unsafe
};