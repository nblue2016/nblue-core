const assert = require('assert')
const nblue = require('../../lib')
const aq = nblue.aq
const co = nblue.co
const nkoa = nblue.koa

describe('koa - middleware', () => {
  it('config middleware', (done) => {
    const next = aq.then(0)

    const opts = { file: `${__dirname}\/config.yml` }
    const ctx$ = { app: {} }
    const mw = nkoa.config(opts).bind(ctx$)

    co(mw(next)).
      then(() => assert.ok(ctx$.app.config, 'ok')).
      then(() => done()).
      catch((err) => done(err))
  })

  it('logger middleware', (done) => {
    const next = aq.then(0)

    const opts = { logFile: `${__dirname}\/app.log` }
    const ctx$ = { app: {} }
    const mw = nkoa.logger(opts).bind(ctx$)

    co(mw(next)).
      then(() => assert.ok(ctx$.app.logger, 'ok')).
      then(() => {
        const logger = ctx$.app.logger

        logger.info('test')
        logger.warning('test2')
      }).
      then(() => done()).
      catch((err) => done(err))
  })

  it('hello middleware', (done) => {
    const next = aq.then(0)

    const ctx$ = { app: {} }
    const mw = nkoa.hello().bind(ctx$)

    co(mw(next)).
      then(() => assert.ok(ctx$.body, 'ok')).
      then(() => assert.equal(ctx$.body, 'Hello World!', 'body')).
      then(() => done()).
      catch((err) => done(err))
  })
})
