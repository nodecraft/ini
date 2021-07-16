'use strict';
const ini = require('../');
const test = require('tap').test;

const data = {
	'number': {count: 10},
	'string': {drink: 'white russian'},
	'boolean': {isTrue: true},
	'nested boolean': {theDude: {abides: true, rugCount: 1}},
};

/*eslint-disable id-length */
test('parse(stringify(x)) same x', function(t){
	for(const k in data){
		const s = ini.stringify(data[k]);
		t.comment(s, data[k]);
		t.same(ini.parse(s), data[k]);
	}

	t.end();
});
