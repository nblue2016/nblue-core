const assert = require('assert')
const nblue = require('../../lib')

const aq = nblue.aq
const betch = nblue.betch
const rest = aq.rest

const Server = require('../../').fake.http
const port = 1338
const server = new Server(port)
const baseUrl = `http://127.0.0.1:${port}`

describe('betch - value/array/object', () => {
  before(() => server.start())

  it('betch a value', (done) => {
    const strVal = 'abc'
    const intVal = 17

    betch(strVal).
      then((data) => assert.equal(data, strVal, 'string value')).
      then(() => betch(intVal)).
      then((data) => assert.equal(data, intVal, 'integer value')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('betch an array', (done) => {
    const source = [
      1,
      Promise.resolve(2),
      Promise.resolve(3)
    ]
    const target = [1, 2, 3]

    const restSource = [
      () => rest(`${baseUrl}?key1=val1`),
      () => rest(`${baseUrl}?key2=val2`),
      () => rest(`${baseUrl}?key3=val3`)
    ]
    const restTarget = [
      { key1: 'val1' },
      { key2: 'val2' },
      { key3: 'val3' }
    ]

    betch(source).
      then((data) => assert.deepEqual(data, target, 'simply array')).
      then(() => betch(restSource)).
      then((data) => assert.deepEqual(data, restTarget, 'rest functions')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('betch an object', (done) => {
    const source = {
      r1: 1,
      r2: Promise.resolve(2),
      r3: '$Promise.resolve(3)'
    }

    const target = 3
    const fullTarget = {
      r1: 1,
      r2: 2,
      r3: 3
    }

    betch(source).
      then((data) => assert.equal(data, target, 'the latest return')).
      then(() => betch(source, { $fullReturn: true })).
      then((data) => assert.deepEqual(data, fullTarget, 'full return')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('betch array and object', (done) => {
    const source = {
      r1: () => rest(`${baseUrl}?key1=val1`),
      r2: [
        () => rest(`${baseUrl}?key1=val1`),
        () => rest(`${baseUrl}?key2=val2`)
      ]
    }

    const target = {
      r1: { key1: 'val1' },
      r2: [
          { key1: 'val1' },
          { key2: 'val2' }
      ]
    }

    betch(source, { $fullReturn: true }).
      then((data) => assert.deepEqual(data, target, 'test merged rest')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('betch with options', (done) => {
    const source = {
      r1: 1,
      r2: Promise.resolve(2),
      r3: Promise.resolve(3),
      r4$: {
        rr1$: [
          Promise.resolve(4),
          Promise.resolve(5)
        ],
        rr2: (ctx) => Promise.resolve(ctx.r2 + ctx.r3),
        rr3: (ctx) => rest(`${baseUrl}?key1=val1&key3=val3`)
      }
    }

    const target = {
      r1: 1,
      r2: 2,
      r3: 3,
      r4$: {
        rr1$: [4, 5],
        rr2: 5,
        rr3: {
          key1: 'val1',
          key3: 'val3'
        }
      }
    }

    betch(source, {}).
      then((data) => assert.deepEqual(data, target.r4$, 'the latest return')).
      then(() => betch(source, { $fullReturn: true })).
      then((data) => assert.deepEqual(data, target, 'full return')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('hide value with underscore key', (done) => {
    const source = {
      r1: 2,
      _h1: (ctx, data) => data + 2,
      r2: (ctx, data) => rest(`${baseUrl}?key=${data}`),
      r3: (ctx, data) => Promise.resolve(data.key)
    }

    const target = {
      r1: 2,
      r2: { key: 4 },
      r3: 4
    }

    const targetKeys = ['r1', 'r2', 'r3']

    betch(source).
      then((data) => assert.equal(data, target.r3, 'the latest result')).
      then(() => betch(source, { $fullReturn: true })).
      then((data) => {
        assert.deepEqual(data, target, 'full result')

        return Object.keys(data)
      }).
      then((data) => assert.deepEqual(data, targetKeys, `hide _ result`)).
      then(() => done()).
      catch((err) => done(err))
  })

  it('with init data', (done) => {
    const initData = 4
    const source = {
      r1: (ctx, data) => data * 2
    }
    const target = initData * 2

    betch(source, {}, initData).
      then((data) => assert.equal(data, target, 'double value')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('check error', (done) => {
    const errMessage = 'an error'
    const promiseError = 'a promise error'

    const source = {
      r1: () => 1,
      r2: () => {
        throw new Error(errMessage)
      },
      r3: () => 3,
      r4: () => Promise.reject(new Error(promiseError)),
      r5: () => 5
    }

    const target = 5
    const fullTarget = {
      r1: 1,
      r2: null,
      r3: 3,
      r4: null,
      r5: 5
    }

    betch(source).
      catch((err) => assert.equal(err.message, errMessage, 'catched error')).
      then(() =>
        betch(source, {
          $throwError: false,
          $fullReturn: false
        })).
      then((data) => assert.equal(data, target, 'the latest return')).
      then(() =>
        betch(source, {
          $throwError: false,
          $fullReturn: true
        })).
      then((data) => assert.deepEqual(data, fullTarget, 'not catch error')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('get errors', (done) => {
    const errMessage = 'an error'
    const promiseError = 'a promise error'

    const source = {
      r1: () => 1,
      r2: () => {
        throw new Error(errMessage)
      },
      r3: () => 3,
      r4: () => Promise.reject(new Error(promiseError)),
      r5: () => 5
    }

    const target = 5
    const fullTarget = {
      r1: 1,
      r2: null,
      r3: 3,
      r4: null,
      r5: 5
    }

    aq.
      then(0).
      then(() => {
        const ctx = {}

        ctx.$throwError = false
        ctx.$fullReturn = true

        betch(source, ctx).
          then((data) => {
            const errs = ctx.$errors
            const errKeys = Object.keys(errs)

            assert.deepEqual(data, fullTarget, 'full result')
            assert.deepEqual(errKeys, ['r2', 'r4'], 'all error')
          })
      }).
      then(() => {
        const ctx = {}

        ctx.$throwError = false
        ctx.$fullReturn = false

        betch(source, ctx).
          then((data) => {
            const errs = ctx.$errors
            const errKeys = Object.keys(errs)

            assert.deepEqual(data, target, 'the latest result')
            assert.deepEqual(errKeys, ['r2', 'r4'], 'all error too')
          })
      }).
      then(() => {
        const ctx = {}

        ctx.$throwError = true
        ctx.$fullReturn = true

        betch(source, ctx).
          catch((err) => {
            const errs = ctx.$errors
            const errKeys = Object.keys(errs)

            assert.equal(err.message, errMessage, 'catched error')
            assert.deepEqual(errKeys, ['r2'], 'the 1st error key')
          })
      }).
      then(() => {
        const ctx = {}

        ctx.$throwError = true
        ctx.$ignoreError = true
        ctx.$fullReturn = true

        betch(source, ctx).
          catch((err) => {
            const errs = ctx.$errors
            const errKeys = Object.keys(errs)

            assert.equal(err.message, errMessage, 'catched error too')
            assert.deepEqual(errKeys, [], 'no error key')

            ctx.$throwError = false
            ctx.$ignoreError = true

            return betch(source, ctx)
          }).
          then((data) => {
            const errs = ctx.$errors
            const errKeys = Object.keys(errs)

            assert.deepEqual(data, fullTarget, '')
            assert.deepEqual(errKeys, [], 'no error key too')
          })
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  after(() => {
    if (server) {
      setTimeout(() => server.stop(), 100)
    }
  })
})
