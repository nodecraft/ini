An ini format parser and serializer for node.

[![Build Status](https://github.com/nodecraft/ini/workflows/Test/badge.svg)](https://github.com/nodecraft/ini/actions?workflow=Test)
[![Coverage Status](https://coveralls.io/repos/github/nodecraft/ini/badge.svg?branch=master)](https://coveralls.io/github/nodecraft/ini?branch=master)


Sections are treated as nested objects.  Items before the first
heading are saved on the object directly.

## Differences from https://github.com/npm/ini
### Code Improvements
- Tests fixed for EOL on different systems
- Readability fixes
- Modernised code

### New `inlineArrays` option
An `inlineArrays` option to parse the following. This is common in Unreal Engine games.
```ini
    sServerAdmins=12345
    sServerAdmins=54321
    sServerAdmins=09876
```
Previously, only the last `sServerAdmins` would be retained and the previous ones would be stripped. Now, when this option is passed, this is parsed into an array:
`[12345, 54321, 09876]`

### New `defaultValue` option
An `defaultValue` option when decoding to use when encountering a key without a value.
```ini
    key=
    secondkey
```
Previously both keys would contain the value `true`, now both keys would contain whatever this option is set to, or an empty string if this option is not set. This is a breaking change, and will decode some inputs differently.

## New `forceStringifyKeys` optoin
Sometimes you need to write strings into an `ini` file with quotes around them, such as:
```ini
    key="some string"
```
By passing an array of `forceStringifyKeys`, you can specify which keys are forced stringified with `JSON.stringify` and therefore maintain their quotes.
Note: This is pretty limited currently in that it doesn't account for the same key being in different sections, but covers our current use-case.

## New `allowEmptySection` option
If you want to allow empty sections, you can set this option to `true`.
```ini
    [section]
```
Previously, this would omit the section entirely on encode. Now, it will be included in the output.

## Usage

Consider an ini-file `config.ini` that looks like this:

    ; this comment is being ignored
    scope = global

    [database]
    user = dbuser
    password = dbpassword
    database = use_this_database

    [paths.default]
    datadir = /var/lib/data
    array[] = first value
    array[] = second value
    array[] = third value

You can read, manipulate and write the ini-file like so:

    var fs = require('fs')
      , ini = require('ini')

    var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'))

    config.scope = 'local'
    config.database.database = 'use_another_database'
    config.paths.default.tmpdir = '/tmp'
    delete config.paths.default.datadir
    config.paths.default.array.push('fourth value')

    fs.writeFileSync('./config_modified.ini', ini.stringify(config, { section: 'section' }))

This will result in a file called `config_modified.ini` being written
to the filesystem with the following content:

    [section]
    scope=local
    [section.database]
    user=dbuser
    password=dbpassword
    database=use_another_database
    [section.paths.default]
    tmpdir=/tmp
    array[]=first value
    array[]=second value
    array[]=third value
    array[]=fourth value


## API

### decode(inistring, [options])

Decode the ini-style formatted `inistring` into a nested object.

The `options` object may contain the following:

* `inlineArrays` Whether to parse duplicate key values as an array.
  See usage above for more info.

### parse(inistring, [options])

Alias for `decode(inistring)`

### encode(object, [options])

Encode the object `object` into an ini-style formatted string. If the
optional parameter `section` is given, then all top-level properties
of the object are put into this section and the `section`-string is
prepended to all sub-sections, see the usage example above.

The `options` object may contain the following:

* `section` A string which will be the first `section` in the encoded
  ini data.  Defaults to none.
* `inlineArrays` Whether to parse duplicate key values as an array.
  See usage above for more info.
* `whitespace` Boolean to specify whether to put whitespace around the
  `=` character.  By default, whitespace is omitted, to be friendly to
  some persnickety old parsers that don't tolerate it well.  But some
  find that it's more human-readable and pretty with the whitespace.
* `allowEmptySection` Whether to allow empty sections. Defaults to `false`.

For backwards compatibility reasons, if a `string` options is passed
in, then it is assumed to be the `section` value.

### stringify(object, [options])

Alias for `encode(object, [options])`

### safe(val)

Escapes the string `val` such that it is safe to be used as a key or
value in an ini-file. Basically escapes quotes. For example

    ini.safe('"unsafe string"')

would result in

    "\"unsafe string\""

### unsafe(val)

Unescapes the string `val`
