const fs = require('fs')

const levelOfError = 1
const levelOfWarning = 2
const levelOfInfo = 3
const levelOfVerbose = 4

class Logger
{

  constructor (outputter, logLevel) {
    this.outputter = outputter ? outputter : Logger.createConsoleOutputter()
    this.logLevel = logLevel ? logLevel : levelOfInfo

    this.appName = 'defaultAppName'
    this.debugMode = false
    this.logLevels = new Map()
    this.logLevels.set(this.appName, this.logLevel)
    this.lineFormat = '[${level}] ${now}: ${message}'
  }

  get DebugMode () {
    return this.debugMode
  }
  set DebugMode (value) {
    this.debugMode = value
  }

  get AppName () {
    return this.appName
  }
  set AppName (name) {
    const level = this.Level

    this.appName = name
    this.Level = level
  }

  get LineFormat () {
    return this.lineFormat
  }
  set LineFormat (value) {
    this.lineFormat = value
  }

  get Level () {
    return this.getLogLevel(this.appName)
  }
  set Level (level) {
    this.setLogLevel(this.appName, level)
  }

  getLogLevel (appName) {
    if (this.logLevels.has(appName)) {
      return this.logLevels.get(appName)
    }

    return this.Level
  }
  setLogLevel (appName, level) {
    this.logLevels.set(appName, level)
  }

  error (message, appName) {
    this.log(levelOfError, message, appName)
  }

  warning (message, appName) {
    this.log(levelOfWarning, message, appName)
  }

  info (message, appName) {
    this.log(levelOfInfo, message, appName)
  }

  verbose (message, appName) {
    this.log(levelOfVerbose, message, appName)
  }

  debug (message, appName) {
    if (this.DebugMode) this.info(message, appName)
  }

  log (level, message, appName) {
    let newApp = appName

    if (!newApp) newApp = this.appName

    // check outputter before write log entry
    if (this.outputter && this.outputter.log) {
      const currentLevel = this.getLogLevel(newApp)

      if (level <= currentLevel) {
        const args = {
          now: this.getTimespanFormat(Date.now()),
          level: this.getLevelText(level),
          message: this.getMessageText(message),
          app: newApp
        }

        // output log to outputter
        this.outputter.log(String.format(this.lineFormat, args))
      }
    }
  }

  getTimespanFormat (timeSpan) {
    return new Date(timeSpan).format('MM/dd/yyyy HH:mm:ss')
    // return timeSpan.toLocaleString()
  }

  getLevelText (level) {
    switch (level) {
    case levelOfError:
      return 'Error'
    case levelOfWarning:
      return 'Warning'
    case levelOfVerbose:
      return 'Verbose'
    case levelOfInfo:
    default:
      return 'Info'
    }
  }

  getMessageText (message) {
    return message
  }

  static createConsoleOutputter () {
    return console
  }

  static createMemoryOutputter () {
    let buffer = []

    const bufferOutputter = function () {
      return {
        log: (line) => buffer.push(line),
        toArray: () => buffer,
        toString: () => buffer.join('\r\n'),
        clear: () => {
          buffer = []
        }
      }
    }

    return bufferOutputter()
  }

  static createFileOutputter (logFile) {
    const fileOutputter = function (file) {
      return {
        log: (line) => {
          setImmediate(() => {
            fs.appendFile(
              file,
              `${line}\r\n`,
              { encoding: 'utf-8' },
              (err) => {
                throw err
              }
            )
          })
        }
      }
    }

    return fileOutputter(logFile)
  }

}

if (!global.Logger) global.Logger = Logger

module.exports = Logger
