const nblue = require('../lib')
const aq = nblue.aq
const betch = nblue.betch
const co = aq.co

betch({
  a: 1,
  b: 2,
  _: (ctx) => ctx.a * ctx.b
}).
then((data) => console.log(`a1: ${data}`))

co(function *() {
  const a = yield aq.then(1)
  const b = yield aq.then(2)

  return a * b
}).
then((data) => console.log(`a2: ${data}`))
