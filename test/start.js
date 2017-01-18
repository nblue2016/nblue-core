require('../lib/')

const scripts = [
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
