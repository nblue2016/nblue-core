const assert = require('assert')

describe('promise extend', () => {
  it('promise error', (done) => {
    Promise.
      reject('error#0').
      catch(() => done())
  })

  it('without done', (done) => {
    process.once('unhandledRejection', (reason, p) => {
      done()
    })

    Promise.reject('error#3')
  })

  it('with done', () => {
    let handle = false

    process.once('uncaughtException', () => {
      handle = true
    })

    Promise.
      reject('error#4').
      done()

    setTimeout(
      () => assert.ok(handle, 'catched error'),
      10
    )
  })

  it('finally function', (done) => {
    let
      a = 1,
      b = 2

    const fna = (val) => {
      a = val
    }
    const fnb = (val) => {
      b = val
    }

    Promise.
      resolve(0).
      then(() => fna(0)).
      then(() => Promise.reject(new Error('error#5'))).
      catch(() => fnb(5)).
      finally(() => {
        assert.equal(a, 0, 'a should be 0')
        assert.equal(b, 5, 'b should be 5')
      }).
      then(() => done())
  })

  it('map method', (done) => {
    Promise.
      resolve([1, 2, 3]).
      map((a) => a * 2).
      then((data) => assert.deepEqual(data, [2, 4, 6], 'mapped array')).
      then(() => Promise.resolve(4)).
      map((a) => a * 2).
      then((data) => assert.equal(data, 4, 'mapped value')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('filter method', (done) => {
    Promise.
      resolve([1, 2, 3, 4, 5]).
      filter((a) => a > 2).
      then((data) => assert.deepEqual(data, [3, 4, 5], 'filtered array')).
      then(() => Promise.resolve(4)).
      filter((a) => a > 2).
      then(() => done(new Error('doesn\'t support'))).
      catch(() => done())
  })
})
