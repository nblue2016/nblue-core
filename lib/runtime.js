require('./native/array')
require('./native/date')
require('./native/map')
require('./native/object')
require('./native/promise')
require('./native/string')
require('./native/stringbuilder')
require('./native/yaml')

const fetch = require('node-fetch')

if (!global.IIf) {
  global.IIf = (express, r1, r2) => {
    if (express) return r1

    return r2
  }
}

if (!global.fetch) {
  global.fetch = fetch
}