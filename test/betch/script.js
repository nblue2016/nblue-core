const assert = require('assert')
const nblue = require('../../lib')

const aq = nblue.aq
const co = aq.co
const betch$ = nblue.betch$

const Server = require('../../').fake.http
const port = 1339
const server = new Server(port)
const baseUrl = `http://127.0.0.1:${port}`

const scriptFile = `${__dirname}/demo.js`
const scriptFile2 = `${__dirname}/demo2.js`
const scriptFile3 = `${__dirname}/demo3.js`
const scriptFile4 = `${__dirname}/demo4.js`
const scriptFile5 = `${__dirname}/demo5.js`
const scriptFile6 = `${__dirname}/demo6.js`

const errorScriptFile = `${__dirname}/demo_error.js`

describe('betch - script', () => {
  before(() => server.start())

  it('simple script', (done) => {
    betch$(scriptFile).
      then((data) => assert.deepEqual(data, 5, 'arg is 5')).
      then(() => betch$(scriptFile, { a1: 20 })).
      then((data) => assert.deepEqual(data, 20, 'arg is 20')).
      then(() => betch$(scriptFile, { a1: 10 })).
      then((data) => assert.deepEqual(data, 10, 'arg is 10')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('complex script', function (done) {
    this.timeout(2000)

    nblue.Betch.config = {
      urlOfService1: baseUrl
    }

    const targetKeys = ['r0', 'r1', 'r2', 'e1', 'r3', 'r4']
    const fullErrorKeys = ['r0', 'e1']

    const ctx = {
      $throwError: false,
      $ignoreError: false,
      $fullReturn: true
    }

    aq.
      betch$(scriptFile3, ctx).
      then((data) => {
        const keys = data ? Object.keys(data) : []
        const errorKeys = ctx && ctx.$errors
          ? Object.keys(ctx.$errors)
          : []

        assert.deepEqual(keys, targetKeys, 'check keys')
        assert.deepEqual(errorKeys, fullErrorKeys, 'check error keys')

        // change context
        ctx.$ignoreError = true
        ctx.$fullReturn = false
      }).
      then(() => betch$(scriptFile3, ctx)).
      then((data) => {
        assert.equal(data, 5, 'checked result when $fullReturn is false.')

        ctx.$throwError = true
        ctx.$ignoreError = false
      }).
      then(() => betch$(scriptFile3, ctx)).
      then(() => Promise.reject(-1)).
      catch((err) => assert.notEqual(err, -1, 'found error')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('define args in metas', (done) => {
    const target = { r1: [6, 'test', 3] }
    const target2 = { r1: [1, 'test', 3] }
    const target3 = { r1: [1, 'good', 3] }

    const arg1 = {
      a1: 1,
      a2: 'good'
    }

    const arg2 = {
      a1: 'good',
      a2: 'better'
    }

    const arg3 = {
      a1: 101,
      a2: 'better',
      a3: 'good'
    }

    co(function *() {
      let rt = null

      rt = yield betch$(scriptFile2)
      assert.deepEqual(rt, target.r1, 'target')

      rt = yield betch$(scriptFile2, { $args: { a1: 1 } })
      assert.deepEqual(rt, target2.r1, 'target2')

      rt = yield betch$(scriptFile2, arg1)
      assert.deepEqual(rt, target3.r1, 'target3')

      betch$(scriptFile2, arg2).
        then(() => Promise.reject(-1)).
        catch((err) => {
          assert.ok(err, 'found error')
          assert.notEqual(err, -1, 'catched error')
        })

      betch$(scriptFile2, arg3).
        then(() => Promise.reject(-1)).
        catch((err) => {
          assert.ok(err, 'found error')
          assert.notEqual(err, -1, 'catched error')
        })
    }).
    then(() => done()).
    catch((err) => done(err))
  })

  it('catch error', (done) => {
    aq.
      betch$('unknown', {}).
      then(() => done(new Error('uncatched invalid file name'))).
      catch(() => betch$('test', {})).
      then(() => done(new Error('uncatched dir'))).
      catch(() => betch$(errorScriptFile, {})).
      then(() => done(new Error('uncatched invalid file data'))).
      catch(() => done())
  })

  it('run script with cache feature', (done) => {
    aq.
      betch$(scriptFile4).
      then((data) => {
        assert.equal(data, 'val1', 'get value from cache')

        setTimeout(() => {
          betch$(scriptFile5).
            then((data2) => {
              assert.equal(data2, null, 'it was expired')
            }).
            then(() => done()).
            catch((err) => done(err))
        }, 1050)
      }).
      catch((err) => done(err))
  })

  it('run script with cache handle', (done) => {
    aq.
      betch$(scriptFile6).
      then(() => betch$(scriptFile6)).
      then((data) => {
        assert.deepEqual({ key1: 'val1' }, data, 'equal')
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
