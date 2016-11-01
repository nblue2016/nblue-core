const assert = require('assert')
const path = require('path')
const fs = require('fs')

const core = require('../../lib')
const aq = core.aq
const Server = core.fake.http

const port = 1338
const server = new Server(port)

const testFile = path.join(__dirname, 'test.dat')

describe('aq', () => {
  before(() => server.start())

  it('wrap value', (done) => {
    aq.
      then(1).
      then((data) => {
        assert.equal(data, 1, 'test')
        done()
      }).
      catch((err) => done(err))
  })

  it('wrap error', (done) => {
    aq.
      then(null, new Error('test')).
      then((data) => {
        throw new Error('failed')
      }).
      catch((err) => {
        try {
          assert.equal(err.message, 'test', 'catched error')
          done()
        } catch (err2) {
          done(err2)
        }
      })
  })

  it('wrap function', () => {
    const fn = aq.wrap(function *(val) {
      assert.equal(val, 6, 'invaild val')

      const ary = []

      if (val >= 0) {
        for (let i = 0; i < val; i += 1) {
          const ri = yield aq.then(i + 1)

          ary.push(ri)
        }
      }

      assert.deepEqual(
        ary,
        [1, 2, 3, 4, 5, 6],
        'Invaild length of return array.')

      return ary
    })

    return fn(6)
  })

  it('callback', (done) => {
    aq.callback(
      Promise.resolve(1),
      (err, data) => {
        if (err) done(err)
        else {
          assert.equal(data, 1, 'get data')

          aq.callback(
            Promise.reject(1),
            (err2, data2) => {
              if (err2) done()
              else {
                done(new Error('do catched error'))
              }
            }
          )
        }
      })
  })

  it('wrap function(then)', (done) => {
    const fnWrap =
      aq.wrap(function *(val) {
        return yield aq.then(val)
      })

    fnWrap(true).
      then((data) => {
        assert.equal(data, true, 'test faield for wrap')
        done()
      }).
      catch((err) => done(err))
  })

  it('co function', (done) => {
    aq.co(function *() {
      const aq1 = aq.then(1)
      const aq2 = aq.then(2)
      const aq3 = aq.then(3)

      return yield [aq1, aq2, aq3]
    }).
    then((data) => {
      assert.deepEqual(data, [1, 2, 3], 'test failed for co')
      done()
    }).
    catch((err) => done(err))
  })

  it('call method', (done) => {
    fs.readFile(testFile, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        done(err)

        return
      }

      aq.
          call(fs, fs.readFile, testFile, { encoding: 'utf-8' }).
          then((aqData) => {
            assert.equal(aqData, data, 'read file by call methods failed.')
            done()
          }).
          catch((aqErr) => done(aqErr))
    })
  })

  it('apply method', (done) => {
    fs.readFile(testFile, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        done(err)

        return
      }

      aq.
        apply(fs, fs.readFile, [testFile, { encoding: 'utf-8' }]).
        then((aqData) => {
          assert.equal(aqData, data, 'read file by call methods failed.')
          done()
        }).
        catch((aqErr) => done(aqErr))
    })
  })

  it('stat file method', (done) => {
    aq.statFile(testFile).
      then(() => done()).
      catch((err) => done(err))
  })

  it('sate invalid file method', (done) => {
    aq.statFile(`${testFile}2`).
      then(() => done(new Error('unknown'))).
      catch(() => done())
  })

  it('read file method', (done) => {
    fs.readFile(testFile, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        done(err)

        return
      }

      aq.
        readFile(testFile, { encoding: 'utf-8' }).
        then((aqData) => {
          assert.equal(aqData, data, 'invoke aq.readfile methods failed.')
          done()
        }).
        catch((aqErr) => done(aqErr))
    })
  })

  it('read lines method', (done) => {
    aq.
      readLines(testFile, { encoding: 'utf-8' }).
      then((aqData) => {
        assert.equal(aqData.length, 5, 'can\'')
        assert.equal(
          aqData[0],
          'ttt',
          'read the 1st line failed.')
        assert.equal(
          aqData[aqData.length - 1],
          'W#497u3823423df',
          'read the latest line failed.')
        // assert.equal(aqData, data, 'invoke aq.readfile methods failed.')
        done()
      }).
      catch((aqErr) => done(aqErr))
  })

  it('series method', (done) => {
    const ary = []
    const q1 = [aq.then(2), aq.then(4), aq.then(6)]
    const q2 = [1, 2, 3, 4, 5]

    aq.
      series(q1).
      then((data) => {
        assert.equal(data, 6, 'get result.')
      }).
      then(() => aq.series(q2.map((item) => ary.push(item * 2)))).
      then(() => {
        assert.deepEqual(
          ary, [2, 4, 6, 8, 10], 'function without result.'
        )
      }).
      then(() => aq.series(q2.map((item) => () => item * 2))).
      then((data) => {
        assert.equal(data, 10, 'function without arg.')
      }).
      then(() => aq.series(q2.map((item) => (ret) => item * ret), 1)).
      then((data) => {
        assert.equal(data, 120, 'function with arg.')
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('parallel method', (done) => {
    const q1 = [aq.then(2), aq.then(4), aq.then(6)]
    const q2 = [1, 2, 3, 4, 5]

    aq.
      parallel(q1).
      then((data) => {
        assert.deepEqual(data, [2, 4, 6], 'get result.')
      }).
      then(() => aq.parallel([1, 2, aq.then(3)])).
      then((data) => {
        assert.deepEqual(data, [1, 2, 3], 'mix vals')
      }).
      then(() => aq.parallel(q2.map((val) => val * 2))).
      then((data) => {
        assert.deepEqual(data, [2, 4, 6, 8, 10], 'function without arg.')
      }).
      then(() => aq.parallel(q2.map((val) => (data) => val * data), 2)).
      then((data) => {
        assert.deepEqual(data, [2, 4, 6, 8, 10], 'function with arg.')
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('race method', (done) => {
    const q1 = [aq.then(2), aq.then(4), aq.then(6)]
    const q2 = [1, 2, 3, 4, 5]

    aq.
      race(q1).
      then((data) => {
        assert.ok([2, 4, 6].includes(data), 'get result')
      }).
      then(() => aq.race(q2.map((val) => () => val * 3))).
      then((data) => {
        assert.ok([3, 6, 9, 12, 15].includes(data), 'function without arg')
      }).
      then(() => aq.race(q2.map((val) => (data) => val * data), 2)).
      then((data) => {
        assert.ok([2, 4, 6, 8, 10].includes(data), 'function with arg')
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('rest method', (done) => {
    let url = `http://127.0.0.1:${port}/?key1=val1&key2=val2`

    aq.
      rest(url).
      then((data) => {
        const result = {
          key1: 'val1',
          key2: 'val2'
        }

        assert.deepEqual(data, result, 'Get data from http server error!')

        url = `http://127.0.0.1:${port}/?key1=val1&key3=val3`

        return aq.rest(url)
      }).
      then((data) => {
        const result = {
          key1: 'val1',
          key3: 'val3'
        }

        assert.deepEqual(data, result, 'Get data from http server error!')
        done()
      }).
      catch((err) => done(err))
  })

  it('rest failed (response status: 403)', (done) => {
    const url = `http://127.0.0.1:${port}/`

    aq.
      rest(
        url,
        'GET', {
          hasError: true,
          errorCode: 403
        }
      ).
      then((data) => done(new Error('Should be forbidden.'))).
      catch((err) => {
        done(err.status === 403 ? null : err)
      })
  })

  it('rest failed (response status: 404)', (done) => {
    const url = `http://127.0.0.1:${port}/`

    aq.
      rest(
        url,
        'GET', {
          hasError: true,
          errorCode: 404
        }
      ).
      then((data) => done(new Error('Should be not found.'))).
      catch((err) => {
        done(err.status === 404 ? null : err)
      })
  })

  it('rest with error message (response status: 200)', (done) => {
    const url = `http://127.0.0.1:${port}/`

    aq.
      rest(
        url,
        'POST',
        {}, {
          error: {
            code: 10336,
            message: 'error'
          }
        }, {
          strictMode: true
        }
      ).
      then((data) => done()).
      catch((err) => {
        done(err.status === 200 ? null : err)
      })
  })

  it('rest with error message (response status: 500)', (done) => {
    const url = `http://127.0.0.1:${port}/`

    aq.
      rest(
        url,
        'POST', {
          hasError: true,
          errorCode: 500
        }, {
          error: {
            code: 10336,
            message: 'error'
          }
        }).
      then((data) => done(new Error('shoud be json with error node.'))).
      catch((err) => {
        done(err.status === 500 ? null : err)
      })
  })

  after(() => server.stop())
})
