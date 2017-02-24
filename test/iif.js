const assert = require('assert')
const core = require('../lib')
const IIf = core.IIf

describe('IIf', () => {
  it('value', () => {
    assert.equal(IIf(true, 1, 0), 1, 'ok')
    assert.equal(IIf(false, 1, 0), 0, 'ok')
  })

  it('function', () => {
    assert.equal(IIf(true, () => 1, () => 0), 1, 'ok')
    assert.equal(IIf(false, () => 1, () => 0), 0, 'ok')
  })

  it('express function', () => {
    assert.equal(IIf(() => true, () => 1, () => 0), 1, 'ok')
    assert.equal(IIf(() => false, () => 1, () => 0), 0, 'ok')
  })

  it('promise ok', (done) => {
    const p = IIf(true, () => Promise.resolve(), () => Promise.reject(-1))

    p.
      then(() => done()).
      catch((err) => done(err))
  })

  it('promise failed', (done) => {
    const p = IIf(false, () => Promise.resolve(), () => Promise.reject(-1))

    p.
      then(() => done(new Error('unexpected'))).
      catch(() => done())
  })
})
