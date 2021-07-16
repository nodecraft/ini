/* eslint no-proto: "off" */
'use strict';
const ini = require('../');
const tap = require('tap');

const data = `
__proto__ = quux
constructor.prototype.foo = asdfasdf
foo = baz
[__proto__]
foo = bar
[other]
foo = asdf
[kid.__proto__.foo]
foo = kid
[arrproto]
hello = snyk
__proto__[] = you did a good job
__proto__[] = so you deserve arrays
thanks = true
[ctor.constructor.prototype]
foo = asdfasdf
`;

const res = ini.parse(data);

tap.same(res, Object.assign(Object.create(null), {
	'constructor.prototype.foo': 'asdfasdf',
	foo: 'baz',
	other: Object.assign(Object.create(null), {
		foo: 'asdf',
	}),
	kid: Object.assign(Object.create(null), {
		foo: Object.assign(Object.create(null), {
			foo: 'kid',
		}),
	}),
	arrproto: Object.assign(Object.create(null), {
		hello: 'snyk',
		thanks: true,
	}),
	ctor: Object.assign(Object.create(null), {
		constructor: Object.assign(Object.create(null), {
			prototype: Object.assign(Object.create(null), {
				foo: 'asdfasdf',
			}),
		}),
	}),
}));
tap.equal(res.__proto__, undefined);
tap.equal(res.kid.__proto__, undefined);
tap.equal(res.kid.foo.__proto__, undefined);
tap.equal(res.arrproto.__proto__, undefined);
tap.equal(Object.prototype.foo, undefined);
tap.equal(Object.prototype[0], undefined);
tap.equal(Object.prototype['0'], undefined);
tap.equal(Object.prototype[1], undefined);
tap.equal(Object.prototype['1'], undefined);
tap.equal(Array.prototype[0], undefined);
tap.equal(Array.prototype[1], undefined);