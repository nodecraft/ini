'use strict';
const fs = require("fs");
const path = require("path");

const ini = require("../");
const tap = require("tap");
const test = tap.test;

const fixture = path.resolve(__dirname, "./fixtures/foo.ini");
const fixtureInlineArrays = path.resolve(__dirname, "./fixtures/fooInlineArrays.ini");
const fixtureExactValues = path.resolve(__dirname, "./fixtures/fooExactValues.ini");
const data = fs.readFileSync(fixture, "utf8");
const dataInlineArrays = fs.readFileSync(fixtureInlineArrays, "utf8");
const dataExactValues = fs.readFileSync(fixtureExactValues, "utf8");

const eol = require('os').EOL;

const expectE = 'o=p' + eol
            + 'a with spaces=b  c' + eol
            + '" xa  n          p "="\\"\\r\\nyoyoyo\\r\\r\\n"' + eol
            + '"[disturbing]"=hey you never know' + eol
            + 's=something' + eol
            + 's1="something\'' + eol
            + 's2=something else' + eol
            + 'zr[]=deedee' + eol
            + 'ar[]=one' + eol
            + 'ar[]=three' + eol
            + 'ar[]=this is included' + eol
            + 'br=warm' + eol
            + 'eq="eq=eq"' + eol
            + 'nv=' + eol + eol
            + '[a]' + eol
            + 'av=a val' + eol
            + 'e={ o: p, a: '
            + '{ av: a val, b: { c: { e: "this [value]" '
            + '} } } }' + eol
            + 'j="\\"{ o: \\"p\\", a: { av:'
            + ' \\"a val\\", b: { c: { e: \\"this [value]'
            + '\\" } } } }\\""' + eol
            + '"[]"=a square?' + eol
            + 'cr[]=four' + eol
            + 'cr[]=eight' + eol + eol
            + '[a.b.c]' + eol
            + 'e=1' + eol
            + 'j=2' + eol + eol
            + '[x\\.y\\.z]' + eol
            + 'x.y.z=xyz' + eol + eol
            + '[x\\.y\\.z.a\\.b\\.c]' + eol
            + 'a.b.c=abc' + eol
            + 'nocomment=this; this is not a comment' + eol
            + 'noHashComment=this\\# this is not a comment' + eol;
const expectEInlineArrays = 'o=p' + eol
            + 'a with spaces=b  c' + eol
            + '" xa  n          p "="\\"\\r\\nyoyoyo\\r\\r\\n"' + eol
            + '"[disturbing]"=hey you never know' + eol
            + 's=something' + eol
            + 's1="something\'' + eol
            + 's2=something else' + eol
            + 'zr=deedee' + eol
            + 'ar=one' + eol
            + 'ar=three' + eol
            + 'ar=this is included' + eol
            + 'br=warm' + eol
            + 'eq="eq=eq"' + eol
            + 'nv=' + eol + eol
            + '[a]' + eol
            + 'av=a val' + eol
            + 'e={ o: p, a: '
            + '{ av: a val, b: { c: { e: "this [value]" '
            + '} } } }' + eol
            + 'j="\\"{ o: \\"p\\", a: { av:'
            + ' \\"a val\\", b: { c: { e: \\"this [value]'
            + '\\" } } } }\\""' + eol
            + '"[]"=a square?' + eol
            + 'cr=four' + eol
            + 'cr=eight' + eol + eol
            + '[a.b.c]' + eol
            + 'e=1' + eol
            + 'j=2' + eol + eol
            + '[x\\.y\\.z]' + eol
            + 'x.y.z=xyz' + eol + eol
            + '[x\\.y\\.z.a\\.b\\.c]' + eol
            + 'a.b.c=abc' + eol
            + 'nocomment=this; this is not a comment' + eol
            + 'noHashComment=this\\# this is not a comment' + eol;
const expectforceStringifyKeys = 'o=p' + eol
			+ 'a with spaces=b  c' + eol
			+ '" xa  n          p "="\\"\\r\\nyoyoyo\\r\\r\\n"' + eol
			+ '"[disturbing]"=hey you never know' + eol
			+ 's=something' + eol
			+ 's1="something\'' + eol
			+ 's2=something else' + eol
			+ 'zr[]=deedee' + eol
			+ 'ar[]=one' + eol
			+ 'ar[]=three' + eol
			+ 'ar[]=this is included' + eol
			+ 'br="warm"' + eol
			+ 'eq="eq=eq"' + eol
			+ 'nv=' + eol + eol
			+ '[a]' + eol
			+ 'av="a val"' + eol
			+ 'e={ o: p, a: '
			+ '{ av: a val, b: { c: { e: "this [value]" '
			+ '} } } }' + eol
			+ 'j="\\"{ o: \\"p\\", a: { av:'
			+ ' \\"a val\\", b: { c: { e: \\"this [value]'
			+ '\\" } } } }\\""' + eol
			+ '"[]"=a square?' + eol
			+ 'cr[]=four' + eol
			+ 'cr[]=eight' + eol + eol
			+ '[a.b.c]' + eol
			+ 'e=1' + eol
			+ 'j=2' + eol + eol
			+ '[x\\.y\\.z]' + eol
			+ 'x.y.z=xyz' + eol + eol
			+ '[x\\.y\\.z.a\\.b\\.c]' + eol
			+ 'a.b.c=abc' + eol
			+ 'nocomment=this; this is not a comment' + eol
			+ 'noHashComment=this\\# this is not a comment' + eol;
const expectExactValues = 'o=p' + eol
            + 'a with spaces=b  c' + eol
            + '" xa  n          p "="\\"\\r\\nyoyoyo\\r\\r\\n"' + eol
            + '"[disturbing]"=hey you never know' + eol
            + 's=something' + eol
            + 's1="something\'' + eol
            + 's2=something else' + eol
            + 'zr[]=deedee' + eol
            + 'ar[]=one' + eol
            + 'ar[]=three' + eol
            + 'ar[]=this is included' + eol
            + 'br=warm' + eol
            + 'eq="eq=eq"' + eol
            + 'nv=' + eol + eol
            + '[a]' + eol
            + 'av=a val' + eol
            + 'e={ o: p, a: '
            + '{ av: a val, b: { c: { e: "this [value]" '
            + '} } } }' + eol
            + 'j="\\"{ o: \\"p\\", a: { av:'
            + ' \\"a val\\", b: { c: { e: \\"this [value]'
            + '\\" } } } }\\""' + eol
            + '"[]"=a square?' + eol
            + 'cr[]=four' + eol
            + 'cr[]=eight' + eol + eol
            + '[a.b.c]' + eol
            + 'e=1' + eol
            + 'j=2' + eol + eol
            + '[x\\.y\\.z]' + eol
            + 'x.y.z=xyz' + eol + eol
            + '[x\\.y\\.z.a\\.b\\.c]' + eol
            + 'a.b.c=abc' + eol
            + 'nocomment=this; this is not a comment' + eol
            + 'noHashComment=this# this is not a comment' + eol;
const expectD = {
	o: 'p',
	'a with spaces': 'b  c',
	" xa  n          p ": '"\r\nyoyoyo\r\r\n',
	'[disturbing]': 'hey you never know',
	's': 'something',
	's1': '"something\'',
	's2': 'something else',
	'zr': ['deedee'],
	'ar': ['one', 'three', 'this is included'],
	'br': 'warm',
	'eq': 'eq=eq',
	'nv': '',
	a: {
		av: 'a val',
		e: '{ o: p, a: { av: a val, b: { c: { e: "this [value]" } } } }',
		j: '"{ o: "p", a: { av: "a val", b: { c: { e: "this [value]" } } } }"',
		"[]": "a square?",
		cr: [
			'four', 'eight',
		],
		b: {
			c: {
				e: '1',
				j: '2',
			},
		},
	},
	'x.y.z': {
		'x.y.z': 'xyz',
		'a.b.c': {
			'a.b.c': 'abc',
			'nocomment': 'this; this is not a comment',
			noHashComment: 'this# this is not a comment',
		},
	},
};
const expectDInlineArrays = {
	o: 'p',
	'a with spaces': 'b  c',
	" xa  n          p ": '"\r\nyoyoyo\r\r\n',
	'[disturbing]': 'hey you never know',
	's': 'something',
	's1': '"something\'',
	's2': 'something else',
	'zr': 'deedee',
	'ar': ['one', 'three', 'this is included'],
	'br': ['cold', 'warm'],
	'eq': 'eq=eq',
	'nv': '',
	a: {
		av: 'a val',
		e: '{ o: p, a: { av: a val, b: { c: { e: "this [value]" } } } }',
		j: '"{ o: "p", a: { av: "a val", b: { c: { e: "this [value]" } } } }"',
		"[]": "a square?",
		cr: [
			'four', 'eight',
		],
		b: {
			c: {
				e: '1',
				j: '2',
			},
		},
	},
	'x.y.z': {
		'x.y.z': 'xyz',
		'a.b.c': {
			'a.b.c': 'abc',
			'nocomment': 'this; this is not a comment',
			noHashComment: 'this# this is not a comment',
		},
	},
};
const expectDExactValues = {
	o: 'p',
	'a with spaces': 'b  c',
	" xa  n          p ": '"\r\nyoyoyo\r\r\n',
	'[disturbing]': 'hey you never know',
	's': 'something',
	's1': '"something\'',
	's2': 'something else',
	'zr': ['deedee'],
	'ar': ['one', 'three', 'this is included'],
	'br': 'warm',
	'eq': 'eq=eq',
	'nv': '',
	a: {
		av: 'a val',
		e: '{ o: p, a: { av: a val, b: { c: { e: "this [value]" } } } }',
		j: '"{ o: "p", a: { av: "a val", b: { c: { e: "this [value]" } } } }"',
		"[]": "a square?",
		cr: [
			'four', 'eight',
		],
		b: {
			c: {
				e: '1',
				j: '2',
			},
		},
	},
	'x.y.z': {
		'x.y.z': 'xyz',
		'a.b.c': {
			'a.b.c': 'abc',
			'nocomment': 'this; this is not a comment',
			noHashComment: 'this# this is not a comment',
		},
	},
};
const expectF = '[prefix.log]' + eol
            + 'type=file' + eol + eol
            + '[prefix.log.level]' + eol
            + 'label=debug' + eol
            + 'value=10' + eol;
const expectG = '[log]' + eol
            + 'type = file' + eol + eol
            + '[log.level]' + eol
            + 'label = debug' + eol
            + 'value = 10' + eol;

/*eslint-disable id-length */
test("decode from file", function(t){
	const d = ini.decode(data);
	t.same(d, expectD);
	t.end();
});

test("decode from file inlineArrays=true", function(t){
	const d = ini.decode(dataInlineArrays, {inlineArrays: true});
	t.same(d, expectDInlineArrays);
	t.end();
});

test("decode from file exactValue=true", function(t){
	const d = ini.decode(dataExactValues, {exactValue: true});
	t.same(d, expectDExactValues);
	t.end();
});

test("encode from data, inlineArrays=false", function(t){
	let e = ini.encode(expectD, {inlineArrays: false});
	t.same(e, expectE);

	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	e = ini.encode(obj);
	t.not(e.slice(0, 1), eol, 'Never a blank first line');
	t.not(e.slice(-2), eol + eol, 'Never a blank final line');

	t.end();
});

test("encode from data, inlineArrays=true", function(t){
	let e = ini.encode(expectD, {inlineArrays: true});
	t.same(e, expectEInlineArrays);

	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	e = ini.encode(obj);
	t.not(e.slice(0, 1), eol, 'Never a blank first line');
	t.not(e.slice(-2), eol + eol, 'Never a blank final line');

	t.end();
});

test("encode from data exactValue=true", function(t){
	let e = ini.encode(expectDExactValues, {exactValue: true});
	t.same(e, expectExactValues);

	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	e = ini.encode(obj);
	t.not(e.slice(0, 1), eol, 'Never a blank first line');
	t.not(e.slice(-2), eol + eol, 'Never a blank final line');

	t.end();
});

test("encode with option", function(t){
	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	const e = ini.encode(obj, {section: 'prefix'});
	t.equal(e, expectF);
	t.end();
});

test("encode with string", function(t){
	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	const e = ini.encode(obj, 'prefix');
	t.equal(e, expectF);
	t.end();
});

test("encode with whitespace", function(t){
	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	const e = ini.encode(obj, {whitespace: true});

	t.equal(e, expectG);
	t.end();
});

test("encode from data with `forceStringifyKeys`", function(t){
	let e = ini.encode(expectD, {forceStringifyKeys: [
		'av',
		'br',
	]});
	t.same(e, expectforceStringifyKeys);

	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	e = ini.encode(obj);
	t.not(e.slice(0, 1), eol, 'Never a blank first line');
	t.not(e.slice(-2), eol + eol, 'Never a blank final line');

	t.end();
});

test('array destructing', function(t){
	t.same(ini.decode('[x]' + eol + 'y=1' + eol + 'y[]=2' + eol), {
		x: {
			y: [1, 2],
		},
	});
	t.end();
});

test('defaulting unset value to an empty string', function(t){
	t.same(ini.decode('foo' + eol + 'bar=false' + eol), {
		foo: '',
		bar: false,
	});
	t.end();
});

test('defaulting unset value to specified value', function(t){
	t.same(ini.decode('foo' + eol + 'bar=false' + eol, {defaultValue: true}), {
		foo: true,
		bar: false,
	});
	t.end();
});

test('ignores invalid line (=)', function(t){
	t.same(ini.decode('foo=true' + eol + '=' + eol + 'bar=false' + eol), {
		foo: true,
		bar: false,
	});
	t.end();
});

test("unsafe escape values", function(t){
	t.equal(ini.unsafe(''), '');
	t.equal(ini.unsafe('x;y'), 'x;y');
	t.equal(ini.unsafe('x  # y'), 'x');
	t.equal(ini.unsafe('x "\\'), 'x "\\');
	t.end();
});

test("safe escape tests", function(t){
	t.equal(ini.safe('abc'), 'abc');
	t.equal(ini.safe('abc', 'someKey', {forceStringifyKeys: ['someKey']}), '"abc"');
	t.equal(ini.safe('x;y'), 'x;y');
	t.end();
});

test("encode with newline", function(t){
	const obj = {log: {type: 'file', level: {label: 'debug', value: 10}}};
	const e = ini.encode(obj, {newline: true});
	const expected = '[log]' + eol + eol
		+ 'type=file' + eol + eol
		+ '[log.level]' + eol + eol
		+ 'label=debug' + eol
		+ 'value=10' + eol;
	t.equal(e, expected);
	t.end();
});

test("encode with sort", function(t){
	const obj = {z: 1, a: 2, m: 3};
	const e = ini.encode(obj);
	t.equal(e, 'z=1' + eol + 'a=2' + eol + 'm=3' + eol);
	const eSorted = ini.encode(obj, {sort: true});
	t.equal(eSorted, 'a=2' + eol + 'm=3' + eol + 'z=1' + eol);
	t.end();
});

test("encode with align", function(t){
	const obj = {short: 1, longerKey: 2, x: 3};
	const e = ini.encode(obj, {align: true});
	// align implies whitespace, padded to longest key
	t.ok(e.includes('short     = 1'));
	t.ok(e.includes('longerKey = 2'));
	t.ok(e.includes('x         = 3'));
	t.end();
});

test("encode with bracketedArray=false", function(t){
	const obj = {ar: ['one', 'two', 'three']};
	const e = ini.encode(obj, {bracketedArray: false});
	// Should use duplicate keys, not key[]
	t.equal(e, 'ar=one' + eol + 'ar=two' + eol + 'ar=three' + eol);
	t.end();
});

test("encode with bracketedArray=true (default)", function(t){
	const obj = {ar: ['one', 'two', 'three']};
	const e = ini.encode(obj);
	// Should use key[]
	t.equal(e, 'ar[]=one' + eol + 'ar[]=two' + eol + 'ar[]=three' + eol);
	t.end();
});

test("decode with bracketedArray=false", function(t){
	const input = 'ar=one' + eol + 'ar=two' + eol + 'ar=three' + eol + 'single=val' + eol;
	const d = ini.decode(input, {bracketedArray: false});
	t.same(d.ar, ['one', 'two', 'three']);
	t.equal(d.single, 'val');
	t.end();
});

test("decode bracketedArray=false strips [] from keys", function(t){
	const input = 'ar[]=one' + eol + 'ar[]=two' + eol;
	const d = ini.decode(input, {bracketedArray: false});
	t.same(d, {'ar': ['one', 'two']});
	t.end();
});

test("decode section with trailing whitespace", function(t){
	const input = '[section]  ' + eol + 'key=value' + eol;
	const d = ini.decode(input);
	t.same(d, {section: {key: 'value'}});
	t.end();
});

test("decode ignores // comments", function(t){
	const input = '// this is a comment' + eol + 'key=value' + eol + '  // indented comment' + eol + 'key2=value2' + eol;
	const d = ini.decode(input);
	t.same(d, {key: 'value', key2: 'value2'});
	t.end();
});

test("encode with align and arrays", function(t){
	const obj = {short: 1, ar: ['one', 'two']};
	const e = ini.encode(obj, {align: true});
	// array keys get [] suffix, align pads to longest key
	t.ok(e.includes('ar[]  = one'));
	t.ok(e.includes('short = 1'));
	t.end();
});

test("decode exactValue with key without value", function(t){
	const input = 'novalue' + eol + 'hasvalue=test' + eol;
	const d = ini.decode(input, {exactValue: true});
	t.equal(d.novalue, '');
	t.equal(d.hasvalue, 'test');
	t.end();
});

test("decode bracketedArray=false with proto[] key", function(t){
	const input = '__proto__[]=bad' + eol + 'safe=ok' + eol;
	const d = ini.decode(input, {bracketedArray: false});
	t.equal(d.__proto__, undefined);
	t.equal(d.safe, 'ok');
	t.end();
});

test("encode with platform=win32", function(t){
	const obj = {key: 'value'};
	const e = ini.encode(obj, {platform: 'win32'});
	t.ok(e.includes('\r\n'));
	t.end();
});