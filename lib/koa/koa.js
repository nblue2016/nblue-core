const ConfigMap = require('.././conf/conf')
const Logger = require('.././logger/logger')

class koa {

  static config (options) {
    return function *(next) {
      const ctx = this
      const app = ctx.app

      if (app.config) {
        yield next

        return
      }

      const opts = options || {}

      if (!opts.file) throw new Error('can\'t find config file.')

      app.config = yield ConfigMap.parseConfig(
        opts.file || 'config.yaml', opts.envs
      )

      yield next

      if (opts.release === true) {
        app.config = null
      }
    }
  }

  static logger (options) {
    return function *(next) {
      const ctx = this
      const app = ctx.app

      if (app.logger) {
        yield* next

        return
      }

      const config = app.config
      const opts = options || {}

      const key = opts.configKey || 'logger'

      const outputter = () => {
        if (opts.createOutputter) {
          return opts.createOutputter()
        }

        if (config && config.has(key)) {
          const conf = config.get(key)

          if (conf.has('file')) {
            const logfile = conf.get('logFile')

            return Logger.createFileOutputter(logfile)
          }
        }

        if (opts.logFile) {
          return Logger.createFileOutputter(opts.logFile)
        }

        return Logger.createMemoryOutputter()
      }

      const logger = new Logger(outputter())

      // init properies for logger
      if (opts.lineFormat) logger.LineFormat = opts.lineFormat
      if (opts.level) logger.Level = opts.level
      if (opts.levels) {
        for (const [k, v] of opts.levels) {
          logger.setLogLevel(k, v)
        }
      }

      if (opts.getLevelText) logger.getLevelText = opts.getLevelText
      if (opts.getMessageText) logger.getMessageText = opts.getMessageText

      if (config && config.has(key)) {
        const conf = config.get(key)

        if (conf.has('level')) logger.Level = conf.get('level')
        if (conf.has('lineFormat')) logger.LineFormat = conf.get('lineFormat')
        if (conf.has('levels')) {
          const levels = conf.get('levels')

          for (const [k, v] of levels) {
            logger.setLogLevel(k, v)
          }
        }
      }

      app.logger = logger

      yield next

      // app.logger = null
    }
  }

  static hello () {
    return function *(next) {
      this.body = 'Hello World!'

      yield next
    }
  }

}

module.exports = koa
