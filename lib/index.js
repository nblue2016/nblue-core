require('./runtime')

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
output.StringBuilder = require('./native/stringbuilder')

module.exports = output
