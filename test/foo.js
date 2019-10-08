'use strict';
const fs = require("fs"),
	path = require("path");

const ini = require("../");
const tap = require("tap");
const test = tap.test;

const fixture = path.resolve(__dirname, "./fixtures/foo.ini"),
	fixtureInlineArrays = path.resolve(__dirname, "./fixtures/fooInlineArrays.ini"),
	data = fs.readFileSync(fixture, "utf8"),
	dataInlineArrays = fs.readFileSync(fixtureInlineArrays, "utf8");

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
            + 'eq="eq=eq"' + eol + eol
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
            + 'nocomment=this\\; this is not a comment' + eol
            + 'noHashComment=this\\# this is not a comment' + eol,
	expectEInlineArrays = 'o=p' + eol
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
            + 'eq="eq=eq"' + eol + eol
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
            + 'nocomment=this\\; this is not a comment' + eol
            + 'noHashComment=this\\# this is not a comment' + eol,
	expectD = {
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
		a: {
			av: 'a val',
			e: '{ o: p, a: { av: a val, b: { c: { e: "this [value]" } } } }',
			j: '"{ o: "p", a: { av: "a val", b: { c: { e: "this [value]" } } } }"',
			"[]": "a square?",
			cr: [
				'four', 'eight'
			],
			b: {
				c: {
					e: '1',
					j: '2'
				}
			}
		},
		'x.y.z': {
			'x.y.z': 'xyz',
			'a.b.c': {
				'a.b.c': 'abc',
				'nocomment': 'this; this is not a comment',
				noHashComment: 'this# this is not a comment'
			}
		}
	},
	expectDInlineArrays = {
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
		a: {
			av: 'a val',
			e: '{ o: p, a: { av: a val, b: { c: { e: "this [value]" } } } }',
			j: '"{ o: "p", a: { av: "a val", b: { c: { e: "this [value]" } } } }"',
			"[]": "a square?",
			cr: [
				'four', 'eight'
			],
			b: {
				c: {
					e: '1',
					j: '2'
				}
			}
		},
		'x.y.z': {
			'x.y.z': 'xyz',
			'a.b.c': {
				'a.b.c': 'abc',
				'nocomment': 'this; this is not a comment',
				noHashComment: 'this# this is not a comment'
			}
		}
	},
	expectF = '[prefix.log]' + eol
            + 'type=file' + eol + eol
            + '[prefix.log.level]' + eol
            + 'label=debug' + eol
            + 'value=10' + eol,
	expectG = '[log]' + eol
            + 'type = file' + eol + eol
            + '[log.level]' + eol
            + 'label = debug' + eol
            + 'value = 10' + eol;

test("decode from file", function(t){
	const d = ini.decode(data);
	t.deepEqual(d, expectD);
	t.end();
});

test("decode from file inlineArrays=true", function(t){
	const d = ini.decode(dataInlineArrays, {inlineArrays: true});
	t.deepEqual(d, expectDInlineArrays);
	t.end();
});

test("encode from data, inlineArrays=false", function(t){
	let e = ini.encode(expectD, {inlineArrays: false});
	t.deepEqual(e, expectE);

	const obj = {log: { type: 'file', level: {label: 'debug', value: 10} } };
	e = ini.encode(obj);
	t.notEqual(e.slice(0, 1), eol, 'Never a blank first line');
	t.notEqual(e.slice(-2), eol + eol, 'Never a blank final line');

	t.end();
});

test("encode from data, inlineArrays=true", function(t){
	let e = ini.encode(expectD, {inlineArrays: true});
	t.deepEqual(e, expectEInlineArrays);

	const obj = {log: { type: 'file', level: {label: 'debug', value: 10} } };
	e = ini.encode(obj);
	t.notEqual(e.slice(0, 1), eol, 'Never a blank first line');
	t.notEqual(e.slice(-2), eol + eol, 'Never a blank final line');

	t.end();
});

test("encode with option", function(t){
	const obj = {log: { type: 'file', level: {label: 'debug', value: 10} } };
	const e = ini.encode(obj, {section: 'prefix'});
	t.equal(e, expectF);
	t.end();
});

test("encode with string", function(t){
	const obj = {log: { type: 'file', level: {label: 'debug', value: 10} } };
	const e = ini.encode(obj, 'prefix');
	t.equal(e, expectF);
	t.end();
});

test("encode with whitespace", function(t){
	var obj = {log: { type: 'file', level: {label: 'debug', value: 10} } };
	const e = ini.encode(obj, {whitespace: true});

	t.equal(e, expectG);
	t.end();
});

test('array destructing', function(t){
	t.same(ini.decode('[x]' + eol + 'y=1' + eol + 'y[]=2' + eol), {
		x: {
			y: [1, 2]
		}
	});
	t.end();
});

test('defaulting unset value to true', function(t){
	t.same(ini.decode('foo' + eol + 'bar=false' + eol), {
		foo: true,
		bar: false
	});
	t.end();
});

test('ignores invalid line (=)', function(t){
	t.same(ini.decode('foo=true' + eol + '=' + eol + 'bar=false' + eol), {
		foo: true,
		bar: false
	});
	t.end();
});

test("unsafe escape values", function(t){
	t.equal(ini.unsafe(''), '');
	t.equal(ini.unsafe('x;y'), 'x');
	t.equal(ini.unsafe('x  # y'), 'x');
	t.equal(ini.unsafe('x "\\'), 'x "\\');
	t.end();
});