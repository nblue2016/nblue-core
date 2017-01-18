require('./runtime')

const extend = require('nblue-extend')

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
output.StringBuilder = extend.StringBuilder
output.UUID = extend.UUID

module.exports = output
