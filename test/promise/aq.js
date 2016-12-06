const assert = require('assert')
const path = require('path')
const fs = require('fs')
const nblue = require('../../lib')

const aq = nblue.aq

const testFile = path.join(__dirname, 'test.dat')

describe('aq - methods', () => {
  it('wrap value', (done) => {
    aq.
      then(1).
      then((data) => assert.equal(data, 1, 'test')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('wrap error', (done) => {
    aq.
      then(null, new Error('test')).
      then((data) => Promise.reject(new Error('failed'))).
      catch((err) => assert.equal(err.message, 'test', 'catched error')).
      then(() => done())
  })

  it('wrap function', (done) => {
    const result = [1, 2, 3, 4, 5, 6]

    const fn = aq.wrap(function *(val) {
      const ary = []

      if (val >= 0) {
        for (let i = 0; i < val; i += 1) {
          const ri = yield aq.then(i + 1)

          ary.push(ri)
        }
      }

      return aq.then(ary)
    })

    fn(6).
      then((data) => {
        assert.equal(data.length, result.length, 'check length')
        assert.deepEqual(data, result, 'check result.')
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('wrap function(then)', (done) => {
    const wrapFunc =
      aq.wrap(function *(val) {
        return yield aq.then(val)
      })

    wrapFunc(true).
      then((data) => assert.equal(data, true, 'check result')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('co function', (done) => {
    aq.
      co(function *() {
        const aq1 = aq.then(1)
        const aq2 = aq.then(2)
        const aq3 = aq.then(3)

        return yield [aq1, aq2, aq3]
      }).
      then((data) => assert.deepEqual(data, [1, 2, 3], 'check result')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('pcall a callback with resolve', (done) => {
    const callback = (err, data) => {
      if (err) return done(err)

      return done()
    }

    aq.pcall(Promise.resolve(0), callback)
  })

  it('pcall a callback with reject', (done) => {
    const callback = (err, data) => {
      if (err) return done()

      return done(new Error('incorrect result'))
    }

    aq.pcall(Promise.reject(1), callback)
  })

  it('pcall a pending', (done) => {
    aq.
      pcall(Promise.resolve(0)).
      then((data) => aq.pcall(Promise.reject(-1))).
      then(() => done(new Error('do catched error'))).
      catch(() => done())
  })

  it('callback method', (done) => {
    fs.readFile(
      testFile, { encoding: 'utf-8' },
      (err, data) => {
        if (err) return done(err)

        return aq.
          callback((cb) => fs.readFile(testFile, { encoding: 'utf-8' }, cb)).
          then((fd) => assert.equal(fd, data, 'check result.')).
          then(() => done()).
          catch((err2) => done(err2))
      })
  })

  it('invoke method', (done) => {
    const fn = (a, b) => a + b

    aq.
      invoke(fn, 2, 4).
      then((data) => assert.equal(data, 6, 'same as result1')).
      then(() => done()).
      catch((err) => done(err))
  })
})

describe('aq - files', () => {
  it('stat file method', (done) => {
    aq.
      statFile(testFile).
      then(() => done()).
      catch((err) => done(err))
  })

  it('sate invalid file method', (done) => {
    aq.
      statFile(`${testFile}2`).
      then(() => done(new Error('unknown'))).
      catch(() => done())
  })

  it('read file method', (done) => {
    fs.readFile(testFile, { encoding: 'utf-8' }, (err, data) => {
      if (err) return done(err)

      return aq.
        readFile(testFile, { encoding: 'utf-8' }).
        then((aqData) => assert.equal(aqData, data, 'failed.')).
        then(() => done()).
        catch((aqErr) => done(aqErr))
    })
  })

  it('read lines method', (done) => {
    const lines = [
      'ttt',
      'bbb',
      'ccc',
      '33 dd 234',
      'W#497u3823423df'
    ]

    const options = { encoding: 'utf-8' }

    aq.
      readLines(testFile, options).
      then((fdata) => {
        assert.equal(fdata.length, lines.length, 'count of lines')

        Array.
          range(0, fdata.length).
          forEach((index) => {
            assert.equal(fdata[index], lines[index], '${index} line.')
          })

        options.ignoreBlank = false

        return aq.readLines(testFile, options)
      }).
      then((fdata) => {
        assert.equal(fdata.length, lines.length + 1, 'count of lines')
        assert.equal(fdata[3], '', 'blank line')
      }).
      then(() => done()).
      catch((err) => done(err))
  })
})

describe('aq - promises', () => {
  it('series method', (done) => {
    const ary = []
    const q1 = [aq.then(2), aq.then(4), aq.then(6)]
    const q2 = [1, 2, 3, 4, 5]

    aq.
      series(q1).
      then((data) => {
        assert.equal(data, 6, 'get result.')
      }).
      then(() => aq.series(
        q2.map((item) => ary.push(item * 2)))
      ).
      then(() => assert.deepEqual(
          ary, [2, 4, 6, 8, 10], 'function without result.'
        )).
      then(() => aq.series(q2.map((item) => () => item * 2))).
      then((data) => assert.equal(data, 10, 'function without arg.')).
      then(() => aq.series(q2.map((item) => (ret) => item * ret), 1)).
      then((data) => assert.equal(data, 120, 'function with arg.')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('parallel method', (done) => {
    const q1 = [aq.then(2), aq.then(4), aq.then(6)]
    const q2 = [1, 2, 3, 4, 5]

    aq.
      parallel(q1).
      then((data) => assert.deepEqual(data, [2, 4, 6], 'get result.')).
      then(() => aq.parallel([1, 2, aq.then(3)])).
      then((data) => assert.deepEqual(data, [1, 2, 3], 'mix vals')).
      then(() => aq.parallel(q2.map((val) => val * 2))).
      then((data) =>
        assert.deepEqual(data, [2, 4, 6, 8, 10], 'function without arg.')
      ).
      then(() => aq.parallel(q2.map((val) => (data) => val * data), 2)).
      then((data) =>
        assert.deepEqual(data, [2, 4, 6, 8, 10], 'function with arg.')
      ).
      then(() => done()).
      catch((err) => done(err))
  })

  it('race method', (done) => {
    const q1 = [aq.then(2), aq.then(4), aq.then(6)]
    const q2 = [1, 2, 3, 4, 5]

    aq.
      race(q1).
      then((data) => assert.ok([2, 4, 6].includes(data), 'get result')).
      then(() => aq.race(q2.map((val) => () => val * 3))).
      then((data) =>
        assert.ok([3, 6, 9, 12, 15].includes(data), 'function without arg')
      ).
      then(() => aq.race(q2.map((val) => (data) => val * data), 2)).
      then((data) =>
        assert.ok([2, 4, 6, 8, 10].includes(data), 'function with arg')
      ).
      then(() => done()).
      catch((err) => done(err))
  })
})

describe('aq - rest', () => {
  const Server = nblue.fake.http

  const port = 1338
  const server = new Server(port)
  const url = `http://127.0.0.1:${port}/`

  before(() => server.start())

  it('rest method', (done) => {
    const rt1 = {
      key1: 'val1',
      key2: 'val2'
    }

    const rt2 = {
      key1: 'val1',
      key3: 'val3'
    }

    aq.
      then(0).
      then(() => aq.rest(`${url}?key1=val1&key2=val2`)).
      then((data) => assert.deepEqual(data, rt1, 'get data')).
      then(() => aq.rest(`${url}?key1=val1&key3=val3`)).
      then((data) => assert.deepEqual(data, rt2, 'get data again')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('rest failed (response status: 403)', (done) => {
    const params = {
      hasError: true,
      errorCode: 403
    }

    aq.
      then(0).
      then(() => aq.rest(url, 'GET', params)).
      then((data) => done(new Error('Should be forbidden.'))).
      catch((err) => done(err.status === 403 ? null : err))
  })

  it('rest failed (response status: 404)', (done) => {
    const params = {
      hasError: true,
      errorCode: 404
    }

    aq.
      then(0).
      then(() => aq.rest(url, 'GET', params)).
      then((data) => done(new Error('Should be not found.'))).
      catch((err) => done(err.status === 404 ? null : err))
  })

  it('rest with error message (response status: 200)', (done) => {
    const formBody = {
      error: {
        code: 10336,
        message: 'error'
      }
    }
    const options = {
      strictMode: true
    }

    aq.
      then(0).
      then(() => aq.rest(url, 'POST', {}, formBody, options)).
      then((data) => done()).
      catch((err) => done(err.status === 200 ? null : err))
  })

  it('rest with error message (response status: 500)', (done) => {
    const params = {
      hasError: true,
      errorCode: 500
    }
    const formBody = {
      error: {
        code: 10336,
        message: 'error'
      }
    }

    aq.
      then(0).
      then(() => aq.rest(url, 'POST', params, formBody)).
      then((data) => done(new Error('shoud be json with error node.'))).
      catch((err) => done(err.status === 500 ? null : err))
  })

  after(() => server.stop())
})
