const assert = require('assert')

describe('Promise extend', () => {
  it('promise error', (done) => {
    Promise.
      reject('error#0').
      catch(() => done())
  })

  it('without done', (done) => {
    process.once('unhandledRejection', (reason, p) => {
      done()
    })

    Promise.
      reject('error#3')
  })

  it('with done', () => {
    let catched = false

    process.once('uncaughtException', () => {
      catched = true
    })

    Promise.
      reject('error#4').
      done()

    setTimeout(() => {
      assert.equal(catched, true, 'catched error')
    }, 10)
  })

  it('finally function', (done) => {
    let
      a = 1,
      b = 2

    Promise.
      resolve(0).
      then((data) => {
        a = data

        return a
      }).
      then(() => {
        throw new Error('error#5')
      }).
      catch(() => {
        b = 5
      }).
      finally(() => {
        assert.equal(a, 0, 'a should be 0')
        assert.equal(b, 5, 'b should be 5')

        done()
      })
  })

  it('map function', (done) => {
    Promise.
      resolve([1, 2, 3]).
      map((a) => a * 2).
      then((data) => {
        assert.deepEqual(data, [2, 4, 6], 'mapped array')

        return Promise.resolve(4)
      }).
      map((a) => a * 2).
      then((data) => {
        assert.equal(data, 4, 'mapped value')

        done()
      })
  })

  it('filter function', (done) => {
    Promise.
      resolve([1, 2, 3, 4, 5]).
      filter((a) => a > 2).
      then((data) => {
        assert.deepEqual(data, [3, 4, 5], 'filtered array')

        return Promise.resolve(4)
      }).
      filter((a) => a > 2).
      then(() => done(new Error('doesn\'t support'))).
      catch(() => done())
  })
})
