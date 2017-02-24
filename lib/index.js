const extend = require('nblue-extend')
const yaml = require('./yaml')

const IIf = (express, r1, r2) => {
  const wrap = function (rt) {
    return rt && typeof rt === 'function' ? rt() : rt
  }

  return wrap(express) ? wrap(r1) : wrap(r2)
}

if (!global.IIf) global.IIf = IIf

const output = {}

const folders = [
  './conf/conf.js',
  './fake/index.js',
  './logger/logger.js',
  './promise/aq.js',
  './betch/betch.js'
]

folders.
  forEach((folder) => {
    if (folder.startsWith('#')) return

    const lib = require(folder)

    if (lib && lib.name) {
      output[lib.name] = lib
    }
  })

output.betch = output.Betch.run
output.betch$ = output.Betch.runScript
output.co = output.aq.co
output.fetch = output.aq.fetch
output.yaml = yaml

output.IIf = IIf
output.StringBuilder = extend.StringBuilder
output.UUID = extend.UUID

module.exports = output
