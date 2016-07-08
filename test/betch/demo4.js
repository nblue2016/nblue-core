script({
  r1: rest(`${config().urlOfService1}?key1=val1&key2=val2`),
  r2: (ctx, data) => {
    cache().setItem('test1', data.key1, 1)

    return cache().getItem('test1')
  }
})
