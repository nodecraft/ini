'use strict';
const ini = require('../');
const test = require('tap').test;

const data = {
	'number': {count: 10},
	'string': {drink: 'white russian'},
	'boolean': {isTrue: true},
	'nested boolean': {theDude: {abides: true, rugCount: 1}}
};


test('parse(stringify(x)) deepEqual x', function(t){
	for(const k in data){
		const s = ini.stringify(data[k]);
		t.comment(s, data[k]);
		t.deepEqual(ini.parse(s), data[k]);
	}

	t.end();
});
