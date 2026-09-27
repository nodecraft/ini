'use strict';
const tap = require('tap');

const ini = require('../');

const nullProto = fields => Object.assign(Object.create(null), fields);

tap.test('a section named after an existing value keeps the value', (test) => {
	test.same(ini.decode('k=v\n[k]\na=1\nb=2\n'), nullProto({ k: 'v' }));
	test.same(ini.decode('k=true\n[k]\na=1\n'), nullProto({ k: true }));
	test.end();
});

tap.test('parsing continues normally after the colliding section', (test) => {
	test.same(ini.decode('k=v\n[k]\na=1\n[other]\nb=2\n'), nullProto({
		k: 'v',
		other: nullProto({ b: '2' }),
	}));
	test.end();
});

tap.test('an empty or false value is replaced by the section', (test) => {
	test.same(ini.decode('k=\n[k]\na=1\n'), nullProto({ k: nullProto({ a: '1' }) }));
	test.same(ini.decode('k=false\n[k]\na=1\n'), nullProto({ k: nullProto({ a: '1' }) }));
	test.end();
});
