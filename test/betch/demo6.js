script({
  r1: cacheHandler(
    'test1',
    60000,
    rest(`${config().urlOfService1}?key1=val1`))
})
