const assert = require('assert')
const core = require('../../lib')

const aq = core.aq
const betch = core.betch
const rest = aq.rest

const Server = require('../../').fake.http
const port = 1338
const server = new Server(port)
const baseUrl = `http://127.0.0.1:${port}`
const scriptFile = `${__dirname}/demo.js`
const scriptFile2 = `${__dirname}/demo2.js`
const scriptFile3 = `${__dirname}/demo3.js`
const scriptFile4 = `${__dirname}/demo4.js`
const scriptFile5 = `${__dirname}/demo5.js`
const scriptFile6 = `${__dirname}/demo6.js`
const errorScriptFile = `${__dirname}/demo_error.js`


describe('betch', () => {
  before(() => server.start())

  it('parallel promise', (done) => {
    aq.
      betch([
        1,
        Promise.resolve(2),
        Promise.resolve(3)
      ]).
      then((data) => {
        assert.deepEqual(data, [1, 2, 3], 'test simply parallel with array')

        done()
      }).
      catch((err) => done(err))
  })

  it('series promise', (done) => {
    const source = {
      r1: 1,
      r2: Promise.resolve(2),
      r3: '$Promise.resolve(3)'
    }

    const target = {
      r1: 1,
      r2: 2,
      r3: 3
    }

    betch(source).
      then((data) => {
        assert.deepEqual(data, 3, 'test that full return is true')

        return betch(source, { $fullReturn: true })
      }).
      then((data) => {
        assert.deepEqual(data, target, 'test that full return is false')

        done()
      }).
      catch((err) => done(err))
  })

  it('complex promise', (done) => {
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

    aq.
      betch(source, {}).
      then((data) => {
        assert.deepEqual(data, target.r4$, 'test that full return is true')

        return betch(source, { $fullReturn: true })
      }).
      then((data) => {
        assert.deepEqual(data, target, 'test that full return is false')

        done()
      }).
      catch((err) => done(err))
  })

  it('merge rest promise', (done) => {
    const source = [
      () => rest(`${baseUrl}?key1=val1&key2=val2`),
      () => rest(`${baseUrl}?key1=val1&key3=val3`),
      () => rest(`${baseUrl}?key2=val2&key3=val3`)
    ]
    const target = [{
      key1: 'val1',
      key2: 'val2'
    }, {
      key1: 'val1',
      key3: 'val3'
    }, {
      key2: 'val2',
      key3: 'val3'
    }]

    aq.
      betch(source).
      then((data) => {
        assert.deepEqual(data, target, 'test merged rest')

        done()
      }).
      catch((err) => done(err))
  })

  it('string value', (done) => {
    let testString = 'test'

    aq.
      betch(testString).
      then((data) => {
        assert.deepEqual(data, testString, 'test string value for dir name')

        testString = 'abc'

        return betch(testString)
      }).
      then((data) => {
        assert.deepEqual(
          data,
          testString,
          'test string value that it is not a file or dir name'
        )

        done()
      }).
      catch((err) => done(err))
  })

  it('run script', (done) => {
    aq.
      betch(scriptFile).
      then((data) => {
        assert.deepEqual(data, 5, 'test simply script')

        return aq.run(scriptFile, { a1: 20 })
      }).
      then((data) => {
        assert.deepEqual(data, 20, 'test simply script called by run')

        return aq.run(scriptFile, { a1: 10 })
      }).
      then((data) => {
        assert.deepEqual(data, 10, 'test simply script called by run')

        done()
      }).
      catch((err) => done(err))
  })

  it('run script with metas', (done) => {
    const target = { r1: [6, 'test', 3] }

    aq.
      betch(scriptFile2).
      then((data) => {
        assert.deepEqual(data, target.r1, 'test script without arg')

        return aq.run(scriptFile2, { $args: { a1: 1 } })
      }).
      then((data) => {
        target.r1[0] = 1

        assert.deepEqual(data, target.r1, 'test script with arg')

        return aq.run(
          scriptFile2, {
            a1: 1,
            a2: 'good'
          })
      }).
      then((data) => {
        target.r1[0] = 1
        target.r1[1] = 'good'

        assert.deepEqual(data, target.r1, 'change arg has default value')

        // type of a2 is invalid, it should be string.
        // following code should catch it and return null
        return aq.run(
          scriptFile2, {
            a1: 1,
            a2: 5
          }).
          then(() => Promise.reject(0)).
          catch(() => null)
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('workflow promise', (done) => {
    const source = {
      r1: 2,
      _h1: (ctx, data) => data + 2,
      r2: (ctx, data) => rest(`${baseUrl}?key1=1&key2=${data}`),
      r3: (ctx, data) => Promise.resolve(data.key2)
    }

    const target = {
      r1: 2,
      r2: {
        key1: 1,
        key2: 4
      },
      r3: 4
    }

    aq.
      betch(source).
      then((data) => {
        assert.equal(data, target.r3, 'check result')

        return betch(source, { $fullReturn: true })
      }).
      then((data) => {
        assert.equal(data.r1, target.r1, 'check r1 in result')
        assert.equal(data._h1, null, 'check _h1 in result')
        assert.deepEqual(data.r2, target.r2, 'check r2 in result')
        assert.equal(data.r3, target.r3, 'check r3 in result')

        done()
      }).
      catch((err) => done(err))
  })

  it('call run method to execute script', (done) => {
    aq.
      run('unknown', {}).
      then(() => done(new Error('uncatched invalid file name'))).
      catch(() => aq.run('test', {})).
      then(() => done(new Error('uncatched dir'))).
      catch(() => aq.run(errorScriptFile, {})).
      then(() => done(new Error('uncatched invalid file data'))).
      catch(() => done())
  })

  it('run complex script', (done) => {
    core.Betch.config = {
      urlOfService1: baseUrl
    }

    let options = {
      $ignoreError: true,
      $fullReturn: true
    }

    aq.
      run(scriptFile3, options).
      then((data) => {
        const keys = Object.keys(data)
        const errorKeys = Object.keys(options.$errors)

        assert.deepEqual(keys,
          ['r0', 'r1', 'r2', 'r3', 'e1', 'r4'], 'same keys')
        assert.deepEqual(errorKeys, ['r0', 'e1'], 'same keys')

        options = {
          $ignoreError: true,
          $fullReturn: false
        }

        return aq.
          run(scriptFile3, options)
      }).
      then((data) => {
        assert.equal(data, 5, 'checked result when $fullReturn is false.')

        options = {
          $ignoreError: false
        }

        return aq.
          run(scriptFile3, options).
          then(() => done(new Error('Should not get result'))).
          catch((err) => {
            assert.equal(err.message, 'the first error', 'check error')

            done()
          })
      }).
      catch((err) => {
        done(err)
      })
  })

  it('run script with cache feature', (done) => {
    aq.
      run(scriptFile4).
      then((data) => {
        assert.equal(data, 'val1', 'get value from cache')

        setTimeout(() => {
          aq.
            run(scriptFile5).
            then((data2) => {
              assert.equal(
                data2,
                null,
                'get value from cache when it was expired'
              )

              done()
            }).
            catch((err) => done(err))
        }, 1050)
      }).
      catch((err) => done(err))
  })

  it('run script with cache handle', (done) => {
    aq.
      run(scriptFile6).
      then((data) => aq.run(scriptFile6)).
      then((data) => {
        assert.deepEqual({ key1: 'val1' }, data, 'equal')

        done()
      }).
      catch((err) => done(err))
  })

  after(() => server.stop())
})
