const assert = require('assert')
const core = require('../lib')
const Cache = core.Cache

const DefaultExpired = 1000

describe('Cache', () => {
  const now = Date.now()
  const expired = new Date(now.valueOf() + DefaultExpired)

  // declare
  let cache = null

  before(() => {
    cache = new Cache()
  })

  it('clear and size', () => {
    cache.setItem('key1', 1, expired)
    cache.setItem('key2', 2, expired)
    cache.setItem('key3', 3, expired)

    assert.equal(cache.Size, 3, 'size')
    assert.equal(cache.getItem('key1'), 1, 'get key1')
    assert.equal(cache.getItem('key2'), 2, 'get key2')
    assert.equal(cache.getItem('key3'), 3, 'get key3')

    cache.clear()

    assert.equal(cache.Size, 0, 'size')
    assert.ok(!cache.getItem('key1'), 'get key1 again')
    assert.ok(!cache.getItem('key2'), 'get key2 again')
    assert.ok(!cache.getItem('key3'), 'get key3 again')
  })

  it('check expired', function (done) {
    this.timeout(5000)

    cache.clear()
    cache.setItem('test', 'test value', expired)
    assert.ok(cache.getItem('test'), 'get test')

    setTimeout(() => {
      assert.ok(!cache.getItem('test'), 'get test again')
      done()
    }, DefaultExpired + 10)
  })

  it('remove key', () => {
    cache.clear()
    cache.setItem('key1', 1, expired)
    cache.setItem('key2', 2, expired)
    cache.setItem('key3', 3, expired)
    assert.equal(cache.Size, 3, 'size')

    cache.remove('key1')
    assert.equal(cache.Size, 2, 'size')
    assert.ok(!cache.getItem('key1'), 'remove key1')

    cache.remove('key2')
    assert.equal(cache.Size, 1, 'size')
    assert.ok(!cache.getItem('key2'), 'remove key2')
  })

  it('remove expired', function (done) {
    this.timeout(5000)

    cache.clear()
    cache.setItem('key1', 1, expired)
    cache.setItem('key2', 2, expired)
    cache.setItem('key3', 3, expired)
    assert.equal(cache.Size, 3, 'size')

    setTimeout(() => {
      assert.equal(cache.Size, 3, 'size')
      cache.removeExpried()
      assert.equal(cache.Size, 0, 'size')
      done()
    }, DefaultExpired + 10)
  })

  after(() => cache.clear())
})
