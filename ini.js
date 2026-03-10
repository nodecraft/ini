'use strict';
/* eslint-disable no-use-before-define */
const { hasOwnProperty } = Object.prototype;

function isConstructorOrProto(obj, key) {
	return (key === 'constructor' && typeof obj[key] === 'function') || key === '__proto__';
}

const encode = (obj, options) => {
	let out = '';

	// opt.section is passed in recursively. If passed in on top-level, it'll affect both the top-level ini keys, and any children
	if (typeof options === 'string') {
		options = {
			section: options,
			whitespace: false,
			inlineArrays: false,
			allowEmptySection: false,
			exactValue: false,
		};
	} else {
		options = options || Object.create(null);
		options.align = options.align === true;
		options.newline = options.newline === true;
		options.sort = options.sort === true;
		options.whitespace = options.whitespace === true || options.align === true;
	}
	options.platform = options.platform || (typeof process !== 'undefined' && process.platform);
	options.bracketedArray = options.bracketedArray !== false;
	const eol = options.platform === 'win32' ? '\r\n' : '\n';

	const separator = options.whitespace ? ' = ' : '=';
	const children = [];
	const keys = options.sort ? Object.keys(obj).sort() : Object.keys(obj);

	const useArraySuffix = options.bracketedArray && !options.inlineArrays;

	let padToChars = 0;
	if (options.align) {
		padToChars = safe(
			[...(
				keys
					.filter(key => obj[key] === null || Array.isArray(obj[key]) || typeof obj[key] !== 'object')
					.map(key => (Array.isArray(obj[key]) && useArraySuffix ? `${key}[]` : key))
			), '']
				.reduce((prev, cur) => (safe(prev, null, options).length >= safe(cur, null, options).length ? prev : cur)),
			null,
			options,
		).length;
	}

	for (const key of keys) {
		const val = obj[key];
		if (val && Array.isArray(val)) {
			for (const item of val) {
				if (useArraySuffix) {
					out += safe(key + '[]', null, options).padEnd(padToChars, ' ') + separator + safe(item, null, options) + eol;
				} else {
					out += safe(key, null, options).padEnd(padToChars, ' ') + separator + safe(item, null, options) + eol;
				}
			}
		} else if (val && typeof val === 'object') {
			children.push(key);
		} else {
			out += safe(key, null, options).padEnd(padToChars, ' ') + separator + safe(val, key, options) + eol;
		}
	}

	if ((options.section && out.length > 0) || (children.length === 0 && options.allowEmptySection)) {
		out = '[' + safe(options.section, null, options) + ']' + (options.newline ? eol + eol : eol) + out;
	}

	for (const key of children) {
		const parsedSection = splitSections(key, '.').join('\\.');
		const section = (options.section ? options.section + '.' : '') + parsedSection;
		const child = encode(obj[key], {
			...options,
			section,
		});
		if (out.length > 0 && child.length > 0) {
			out += eol;
		}
		out += child;
	}

	return out;
};

function splitSections(str, separator) {
	let lastMatchIndex = 0;
	let lastSeparatorIndex = 0;
	let nextIndex = 0;
	const sections = [];

	do {
		nextIndex = str.indexOf(separator, lastMatchIndex);

		if (nextIndex !== -1) {
			lastMatchIndex = nextIndex + separator.length;

			if (nextIndex > 0 && str[nextIndex - 1] === '\\') {
				continue;
			}

			sections.push(str.slice(lastSeparatorIndex, nextIndex));
			lastSeparatorIndex = nextIndex + separator.length;
		}
	} while (nextIndex !== -1);

	sections.push(str.slice(lastSeparatorIndex));

	return sections;
}

const decode = (str, options = {}) => {
	const defaultValue = options.defaultValue !== undefined ? options.defaultValue : '';
	options.bracketedArray = options.bracketedArray !== false;

	const out = Object.create(null);
	let ref = out;
	let section = null;
	//          section            |key        = value
	const re = /^\[([^\]]*)]\s*$|^([^=]+)(=(.*))?$/i;
	const lines = str.split(/[\n\r]+/g);
	const commentMatch = /^\s*[#;]|^\s*\/\//;
	const duplicates = {};
	for (const line of lines) {
		if (!line || commentMatch.test(line) || /^\s*$/.test(line)) { continue; }
		const match = line.match(re);
		if (!match) { continue; }
		if (match[1] !== undefined) {
			section = unsafe(match[1]);
			if (isConstructorOrProto(out, section)) {
				// not allowed
				// keep parsing the section, but don't attach it.
				ref = Object.create(null);
				continue;
			}
			ref = out[section] = out[section] || Object.create(null);
			continue;
		}
		let key = unsafe(match[2]);
		if (isConstructorOrProto(ref, key)) { continue; }
		let value = null;
		if (options.exactValue) {
			value = match[3] ? unsafeExact(match[4]) : defaultValue;
		} else {
			value = match[3] ? unsafe(match[4]) : defaultValue;
		}
		switch (value) {
			case 'true':
			case 'True':
			case 'TRUE':
			case 'false':
			case 'False':
			case 'FALSE':
			case 'null': { value = JSON.parse(value.toLowerCase());
			}
		}

		let isArray;
		if (options.bracketedArray) {
			// Convert keys with '[]' suffix to an array
			isArray = key.length > 2 && key.slice(-2) === '[]';
			if (isArray) {
				key = key.slice(0, Math.max(0, key.length - 2));
				if (isConstructorOrProto(ref, key)) { continue; }
			} else if (options.inlineArrays && (ref[key]) !== undefined && !Array.isArray(ref[key])) {
				isArray = true;
			}
		} else {
			duplicates[key] = (duplicates[key] || 0) + 1;
			isArray = duplicates[key] > 1;
			// Still strip [] from key name if present
			if (key.endsWith('[]')) {
				key = key.slice(0, -2);
				if (isConstructorOrProto(ref, key)) { continue; }
			}
		}

		if (isArray) {
			if (!hasOwnProperty.call(ref, key)) {
				ref[key] = [];
			} else if (!Array.isArray(ref[key])) {
				ref[key] = [ref[key]];
			}
		}

		// safeguard against resetting a previously defined
		// array by accidentally forgetting the brackets
		if (Array.isArray(ref[key])) {
			ref[key].push(value);
		} else {
			ref[key] = value;
		}
	}

	// {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
	// use a filter to return the keys that have to be deleted.
	const remove = [];
	for (const key of Object.keys(out)) {
		if (!hasOwnProperty.call(out, key) || typeof out[key] !== 'object' || Array.isArray(out[key])) {
			continue;
		}
		// see if the parent section is also an object.
		// if so, add it to that, and mark this one for deletion
		const parts = splitSections(key, '.');
		let outPart = out;
		const lastKey = parts.pop();
		const unescapedLastKey = lastKey.replaceAll('\\.', '.');
		for (const part of parts) {
			if (isConstructorOrProto(outPart, part)) { continue; }
			if (!hasOwnProperty.call(outPart, part) || typeof outPart[part] !== 'object') {
				outPart[part] = Object.create(null);
			}
			outPart = outPart[part];
		}
		if (outPart === out && unescapedLastKey === lastKey) {
			continue;
		}
		outPart[unescapedLastKey] = out[key];
		remove.push(key);
	}

	for (const del of remove) {
		delete out[del];
	}

	return out;
};

// determines if string is encased in quotes
const isQuoted = val => (val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''));

// escapes the string val such that it is safe to be used as a key or value in an ini-file. Basically escapes quotes
const safe = (val, key, options = {}) => {
	// all kinds of values and keys
	if (typeof val !== 'string' || /[\n\r=]/.test(val) || /^\[/.test(val) || (val.length > 1 && isQuoted(val)) || val !== val.trim()) {
		return JSON.stringify(val);
	}
	// force stringify certain keys
	if (key && options.forceStringifyKeys && options.forceStringifyKeys.includes(key)) {
		return JSON.stringify(val);
	}
	if (options.exactValue) {
		// Don't try to escape a comment in a value
		return val;
	}
	// comments
	return val.replaceAll(/\s;\s/g, '\\;').replaceAll('#', '\\#');
};

// unescapes the string val
const unsafe = (val) => {
	const escapableChars = '\\;#';
	const commentChars = ';#';

	val = (val || '').trim();
	if (isQuoted(val)) {
		// remove the single quotes before calling JSON.parse
		if (val.charAt(0) === '\'') {
			val = val.slice(1, -1);
		}
		try {
			val = JSON.parse(val);
		} catch {
			// we tried :(
		}
		return val;
	}
	// walk the val to find the first not-escaped ; character
	let isEscaping = false;
	let escapedVal = '';
	for (let i = 0, len = val.length; i < len; i++) {
		const char = val.charAt(i);
		if (isEscaping) {
			// check if this character is an escapable character like \ or ; or #
			if (escapableChars.includes(char)) {
				escapedVal += char;
			} else {
				escapedVal += '\\' + char;
			}
			isEscaping = false;
		} else if (commentChars.includes(char)) {
			// Check if there's spaces around this comment character
			// If there is, then we're done parsing at the character before this one
			if (val.charAt(i - 1) === ' ' && val.charAt(i + 1) === ' ') {
				break;
			}
			escapedVal += char;
		} else if (char === '\\') {
			isEscaping = true;
		} else {
			escapedVal += char;
		}
	}
	// we're still escaping - something isn't right. Close out with an escaped escape char
	if (isEscaping) {
		escapedVal += '\\';
	}
	return escapedVal.trim();
};

const unsafeExact = (val) => {
	val = (val || '').trim();
	if (isQuoted(val)) {
		// remove the single quotes before calling JSON.parse
		if (val.charAt(0) === '\'') {
			val = val.slice(1, -1);
		}
		try {
			val = JSON.parse(val);
		} catch {
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
