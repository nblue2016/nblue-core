script({
  r1: cacheHandler(
    'test1',
    rest(`${config().urlOfService1}?key1=val1`),
    60000)
})
