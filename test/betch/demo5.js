script({
  r1: rest(`${config().urlOfService1}?key1=val1&key2=val2`),
  r2: cache().getItem('test1')
})
