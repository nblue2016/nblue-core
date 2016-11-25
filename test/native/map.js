const assert = require('assert')

describe('map', () => {
  const map = new Map()

  map.
    set('key1', 'val1').
    set('key2', 'val2').
    set('key3', 'val3')

  it('method of get2', () => {
    assert.equal(map.get('key1'), 'val1', 'ok')
    assert.equal(map.get('key2'), 'val2', 'ok')
    assert.equal(map.get('key3'), 'val3', 'ok')
    assert.equal(map.get('key4'), null, 'ok')
    assert.equal(map.get2('key4', 'val4'), 'val4', 'ok')
  })

  it('method of toObject', () => {
    const target = {
      key1: 'val1',
      key2: 'val2',
      key3: 'val3'
    }

    assert.deepEqual(map.toObject(), target, 'ok')
  })

  it('method of toJSON', () => {
    const target = {
      key1: 'val1',
      key2: 'val2',
      key3: 'val3'
    }

    assert.deepEqual(map.toJSON(), JSON.stringify(target), 'ok')
  })
})
