const assert = require('assert')

describe('array', () => {
  it('method of range', () => {
    const source = Array.range(1, 6)
    const target = [1, 2, 3, 4, 5, 6]

    assert.deepEqual(source, target, 'ok')
  })

  it('method of toObject', () => {
    const source = [1, 2, 3, 4, 5, 6].
      toObject(['a', 'b', 'c', 'd', 'e', 'f'])
    const target = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6
    }

    assert.deepEqual(source, target, 'ok')
  })
})
