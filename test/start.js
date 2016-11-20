require('../lib/')

const testScripts = [
  './global.js',
  './native/array.js',
  './native/date.js',
  './native/stringbuilder.js',
  './promise.js',
  './conf/conf.js',
  './logger/log.js',
  './promise/aq.js',
  './betch/betch.js',
  './betch/script.js'
]

testScripts.forEach((script) => {
  if (script.startsWith('#')) return

  require(script)
})
