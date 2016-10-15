const aq = global.aq
const co = require('co')
const Script = require('./script')
const Cache = require('./cache')
const script = Script.parse

const prefixOfSystem = '$'
const prefixOfComment = '_'

// the flag of arguments in options
const flagOfArgs = '$args'

// boolean value in options, the result includes all values in every step.
// otherwise it only includes the value in the latest step
const flagOfFullReturn = '$fullReturn'

// the key include all errors when execute a script
const flagOfErrors = '$errors'

// the flag of catch error when the first issue occurs
const flagOfCatchError = '$catchError'

// the flag of ignore errors, it will not trigger .catch to handle the error
// but still can find these from $errors in context or options
const flagOfIgnoreError = '$ignoreError'

// the flag of key for runtime error, it was catched by try...catch blocks
const flagOfRuntimeErrors = '$runtime'

// the flag of key for Unhandle error, it was catched
// on process unhandledRejection event
const flagOfUnhandledErrors = '$unhandled'

const eventOfBefore = '$before'
const eventOfBeforeEach = '$beforeEach'
const eventOfAfter = '$after'
const eventOfAfterEach = '$afterEach'


class Betch
{

  static run (val, ctx, data) {
    const callback = (err, reject) => {
      if (ctx && ctx[flagOfErrors]) {
        const errors = ctx[flagOfErrors]

        if (!errors[flagOfUnhandledErrors]) {
          errors[flagOfUnhandledErrors] = []
        }

        errors[flagOfUnhandledErrors].push(err)
      }
    }

    process.on('unhandledRejection', callback)

    return Betch.
      execute(val, ctx, data).
      then((result) => {
        // get errors from options
        const errors = ctx && ctx[flagOfErrors] || {}

        if (errors && Object.keys(errors).length > 0) {
          // not ignore error, reject with new Error that
          // includes all errors occur in every step
          if (!ctx[flagOfIgnoreError]) {
            const error = new Error()

            error.items = errors

            return Promise.reject(error)
          }
        }

        return Promise.resolve(result)
      }).
      finally(() => {
        process.removeListener('unhandledRejection', callback)
      })
  }

  static execute (val, ctx, data) {
    if (!val) return Promise.resolve(null)

    const newCtx = ctx || {}

    Betch.initContext(newCtx)

    const errors = newCtx[flagOfErrors]
    const keys = val ? Object.keys(val) : []

    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return aq.parallel(
          val.map((item, index) =>
            Betch.getVal(`_${index}$`, item, newCtx, data))
        )
      } else if (val instanceof Promise) {
        return val
      } else if (keys.length > 0) {
        const gen = function *() {
          let current = data ? data : null

          // process before node
          if (keys.indexOf(eventOfBefore) >= 0) {
            current = yield Betch.
              getVal(eventOfBefore, val[eventOfBefore], newCtx, current)
          }

          const result = {}

          for (const key of keys) {
            // ignore system key
            if (key.startsWith(prefixOfSystem)) continue

            // declare full return flag for children nodes
            const returnChild =
              typeof val[key] === 'object' && !newCtx[flagOfFullReturn]

            if (returnChild) newCtx[flagOfFullReturn] = true

            try {
              if (keys.indexOf(eventOfBeforeEach) >= 0) {
                current = yield Betch.
                  getVal(
                    `${key}_${eventOfBeforeEach}`,
                    val[eventOfBeforeEach],
                    newCtx,
                    current
                  )
              }

              // get result from parse val
              current = yield Betch.getVal(key, val[key], newCtx, current)

              if (keys.indexOf(eventOfAfterEach) >= 0) {
                current = yield Betch.
                  getVal(
                    `${key}_${eventOfAfterEach}`,
                    val[eventOfAfterEach],
                    newCtx,
                    current
                  )
              }

              // cache the value to context
              // but if the key stats with '-', it will be ignored
              if (!key.startsWith(prefixOfComment)) {
                newCtx[key] = current

                // save current value to result
                if (newCtx[flagOfFullReturn]) {
                  result[key] = current
                }
              }
            } catch (err) {
              Betch.catchRuntimeError(newCtx, err)

              if (newCtx && newCtx[flagOfCatchError] === true) {
                return Promise.reject(err)
              }
            } finally {
              if (returnChild) newCtx[flagOfFullReturn] = false
            }
          }

        // process after node
          if (keys.indexOf(eventOfAfter) >= 0) {
            current = yield Betch.
              getVal(eventOfAfter, val[eventOfAfter], newCtx, current)
          }

          return newCtx[flagOfFullReturn] ? result : current
        }

        try {
          return co(gen)
        } catch (err) {
          Betch.catchRuntimeError(newCtx, err)

          return Promise.reject(err)
        }
      }
    } else if (typeof val === 'string') {
      const gen = function *() {
        const fstat = yield aq.
          statFile(val).
          catch(() => Promise.resolve(null))

        return !(fstat === null) && fstat.isFile()
          ? Betch.runScript(val, newCtx, data)
          : val
      }

      try {
        return co(gen)
      } catch (err) {
        Betch.catchRuntimeError(newCtx, err)

        return Promise.reject(err)
      }
    } else {
      return Promise.resolve(val)
    }

    return Promise.resolve(val)
  }

  static getVal (key, val, ctx, data) {
    const errors = ctx[flagOfErrors]

    try {
      const result = Betch.parseVal(key, val, ctx, data)

      if (typeof result === 'object' &&
          result instanceof Promise) {
        return result.catch((err2) => {
          errors[key] = err2

          if (ctx[flagOfCatchError] === true) {
            return Promise.reject(err2)
          }

          return Promise.resolve(null)
        })
      }

      return Promise.resolve(result)
    } catch (err) {
      errors[key] = err

      if (ctx[flagOfCatchError] === true) {
        return Promise.reject(err)
      }

      return Promise.resolve(null)
    }
  }

  static parseVal (key, val, ctx, data) {
    if (val === null) return Promise.resolve(null)

    let result = val

    switch (typeof val) {
    case 'string':
      // execute expression if it starts with '$'
      if (result.startsWith('$')) {
        result = result.substr(1, result.length - 1)
        result = eval(result)
      }
      break
    case 'object':
      if (Array.isArray(val)) {
        // parse every item in array
        result = aq.
          parallel(
            val.map(
              (item) => Betch.getVal(key, item, ctx, data)
            )
          )
      } else {
        result = key.endsWith('$') ? Betch.run(val, ctx, data) : val
      }
      break
    case 'function':
      result = result(ctx, data)
      if (key.endsWith('$')) result = Betch.run(result)
      break
    default:
      // keep orignal format for other values
      break
    }

    return result
  }

  static createContext (options) {
    // declare
    const ctx = {}

    // if the key of options doesn't start with '$', we see it as argument
    // the value will append to %args object automatically
    if (options) {
      Object.
        keys(options).
        forEach((key) => {
          if (key.startsWith('$')) {
            ctx[key] = options[key]
          } else {
            if (!ctx[flagOfArgs]) ctx[flagOfArgs] = {}
            ctx[flagOfArgs][key] = options[key]
          }
        })
    }

    // run as script,
    // the default flag of catch error is true
    if (options &&
        options[flagOfCatchError] !== false) {
      ctx[flagOfCatchError] = true
    }

    // the default flag of ignore error is true
    if (options &&
        options[flagOfIgnoreError] !== false) {
      ctx[flagOfIgnoreError] = true
    }

    return ctx
  }

  static initContext (ctx) {
    // set flag of full return
    if (ctx[flagOfFullReturn] !== true) {
      ctx[flagOfFullReturn] = false
    }

    // set flag of errors
    if (!ctx[flagOfErrors]) {
      ctx[flagOfErrors] = {}
    }

    // set flag of catch error
    if (!ctx[flagOfCatchError]) {
      ctx[flagOfCatchError] = false
    }
  }

  static catchRuntimeError (ctx, err) {
    if (ctx && ctx[flagOfErrors]) {
      const errors = ctx[flagOfErrors]

      if (!errors[flagOfRuntimeErrors]) {
        errors[flagOfRuntimeErrors] = []
      }

      errors[flagOfRuntimeErrors].push(err)
    }
  }

  static runScript (file, options, data) {
    const gen = function *() {
      // parse script file by file name
      const fstat = yield aq.
          statFile(file).
          catch(() => aq.done(null))

      if (fstat === null || !fstat.isFile()) {
        return Promise.reject(new Error(`invalid script file: ${file}`))
      }

      // read file data
      const fdata =
        yield aq.
          readFile(file, { encoding: 'utf-8' }).
          catch(() => aq.done(null))

      if (fdata === null) {
        // read script file failed
        return Promise.reject(new Error(`read script file: ${file} failed`))
      }

      // parse script text
      const $$ = (() => {
        try {
          return eval(fdata)
        } catch (err) {
          return null
        }
      })()

      // parse script failed, reject
      if (!$$) {
        return Promise.reject(new Error('parse script failed'))
      }

      // create runtime context
      const ctx = Betch.createContext(options)

      // call init function if it is defined in script
      if ($$.init &&
          typeof $$.init === 'function') {
        try {
          $$.init(ctx)
        } catch (err) {
          return Promise.reject(err)
        }
      }

      // execute script
      return Betch.
        run($$.Body, ctx, data).
        then((result) => {
          const errors = ctx[flagOfErrors]

          if (errors && Object.keys(errors).length > 0) {
            options[flagOfErrors] = {}
            Object.assign(options[flagOfErrors], ctx[flagOfErrors])
          }

          return Promise.resolve(result)
        })
    }

    try {
      return co(gen)
    } catch (err) {
      Betch.catchRuntimeError(options, err)

      return Promise.reject(err)
    }
  }

}

// define some functons to use in script quickly
const betch = Betch.run

const config = () => Betch.config || (global.config || {})

const cache = () => {
  if (!Betch.cache) {
    Betch.cache = new Cache()
  }

  return Betch.cache
}

const cacheHandler = (key, expired, promise) => {
  const caches = cache()
  const item = caches.getItem(key)

  let result = null

  if (item === null) {
    result = Betch.run(promise)

    caches.setItem(key, result, expired)
  } else {
    result = item
  }

  return result
}

const rest = aq.rest
const getRest = aq.get
const postRest = aq.post
const putRest = aq.put
const delRest = aq.delete
const postForm = aq.postForm

global.betch = betch
aq.betch = Betch.run
aq.run = Betch.runScript

module.exports = Betch
