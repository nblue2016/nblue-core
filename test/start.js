const assert = require('assert')
const nblue = require('../lib/')

// declare types in library
const StringBuilder = nblue.StringBuilder
const UUID = nblue.UUID

const sb = new StringBuilder()

sb.append('test')

assert.ok(sb.toString(), 'string builder')
assert.ok(UUID.generate(), 'uuid')

// declare array of test scripts
const scripts = [
  './iif.js',
  './cache.js',
  './conf/conf.js',
  './logger/log.js',
  './promise/aq.js',
  './betch/betch.js',
  './betch/script.js'
]

scripts.
  forEach((script) => {
    if (script.startsWith('#')) return

    require(script)
  })
