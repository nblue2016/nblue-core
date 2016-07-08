script({
  r0: aq.then(null, new Error('the first error')),
  r1: rest(`${config().urlOfService1}?key1=val1&key2=val2`),
  r2: (ctx, data) => betch([
    aq.then(1),
    rest(`${config().urlOfService1}?key3=val3`),
    data.key1
  ]),
  r3: {
    r3a: (ctx) => ctx.r2,
    r3b: 'aa',
    r3c: Promise.resolve(6)
  },
  e1: Promise.reject(1),
  r4: 5
})
