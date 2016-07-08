require('../../')

const aq = global.aq
// const betch = global.betch

const options = {}

options.r0 = 10

aq.
  betch({
    _: { o: 35 },
    r1: 5,
    r2: (ctx) => Promise.resolve(ctx.r1 + 1),
    r3: (ctx) => ctx.r0,
    r4: aq.rest('http://dev.ap.mkwap.cn/client'),
    r5: '$ctx.r2',
    r6: (ctx) => aq.betch({
      sr1: 8,
      sr2: () => Promise.resolve(0),
      sr3: [
        Promise.resolve(1),
        Promise.resolve(3),
        Promise.resolve(5)
      ]
    }, ctx),
    r7: [
      Promise.resolve(0),
      Promise.resolve(2),
      Promise.resolve(4)
    ],
    r8: (ctx, data) => data.o - 20
  }, options).
  then((data) => {
    console.log(`a1: ${JSON.stringify(data, true, 2)}`)
  }).
  catch((err) => {
    console.log(`err, details: ${err.message}`)
  })

aq.
  run(`${__dirname}//demo.js`, {
    args: {
      a1: 10
    } }).
  then((data) => {
    console.log(`b1: ${JSON.stringify(data, true, 2)}`)
  }).
  catch((err) => {
    console.log(`err, details: ${err.message}`)
  })

/*
betch([
  () => Promise.resolve(1),
  (ctx) => ctx.r0,
  rest('http://dev.ap.mkwap.cn/client')
], options).
then((data) => {
  console.log('a2')
  console.log(JSON.stringify(data, true, 2))
})

betch([
  () => Promise.resolve(1),
  (ctx) => betch({
    r1: 1,
    r2: Promise.resolve(2)
  }, ctx),
  rest('http://dev.ap.mkwap.cn/client')
], options).
then((data) => {
  console.log('a3')
  console.log(JSON.stringify(data, true, 2))
})
*/

/*
co(function *() {
  const result = {}

  const r1 = yield Promise.resolve(1)

  result.r1 = r1

  const r2 = yield Promise.resolve(r1)

  result.r2 = r2

  return result
}).
then((data) => {
  console.log('a2')
  console.log(data)
})
*/
