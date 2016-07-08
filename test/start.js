require('../lib/')

const testScripts = [
  './global.js',
  './promise.js',
  './stringbuilder.js',
  './conf/conf.js',
  './logger/log.js',
  './promise/aq.js',
  './betch/betch.js'
]

testScripts.forEach((script) => {
  if (script.startsWith('#')) return

  require(script)
})
