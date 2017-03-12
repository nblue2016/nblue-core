const extend = require('nblue-extend')
const yaml = require('./yaml')
const IIf = extend.IIf

if (!global.IIf) global.IIf = IIf

const output = {}

const libs = [
  './conf/conf.js',
  './fake/index.js',
  './logger/logger.js',
  './promise/aq.js',
  './betch/betch.js'
]

libs.
  forEach((lib) => {
    if (lib.startsWith('#')) return

    const pack = require(lib)

    if (pack && pack.name) {
      output[pack.name] = pack
    }
  })

output.betch = output.Betch.run
output.betch$ = output.Betch.runScript
output.co = output.aq.co
output.fetch = output.aq.fetch
output.yaml = yaml

output.IIf = IIf
output.Cache = require('./cache')
output.StringBuilder = extend.StringBuilder
output.UUID = extend.UUID

module.exports = output
