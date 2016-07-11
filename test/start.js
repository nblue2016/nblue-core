require('../lib/')

const testScripts = [
  '#./global.js',
  './native/date.js',
  './native/stringbuilder.js',
  '#./promise.js',
  '#./conf/conf.js',
  '#./logger/log.js',
  '#./promise/aq.js',
  '#./betch/betch.js'
]

testScripts.forEach((script) => {
  if (script.startsWith('#')) return

  require(script)
})
