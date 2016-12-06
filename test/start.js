require('../lib/')

const testScripts = [
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
