const co = require('co')
const Script = require('./script')
const Cache = require('./cache')
const aq = require('.././promise/aq')

const script = Script.parse
const fetch = aq.fetch

const prefixOfSystem = '$'
const prefixOfComment = '_'
const suffixOfBetchKey = '$'

// the key include all errors when execute a script
const flagOfErrors = '$errors'

// the flag of arguments in options
const flagOfArgs = '$args'

// boolean value in options, the result includes all values in every step.
// otherwise it only includes the value in the latest step
const flagOfFullReturn = '$fullReturn'

// the flag of catch error when the first issue occurs
const flagOfThrowError = '$throwError'

// the flag of ignore errors, it will not trigger .catch to handle the error
// but still can find these from $errors in context or options
const flagOfIgnoreError = '$ignoreError'

// the flag of key for runtime error, it was catched by try...catch blocks
const flagOfRuntimeErrors = '$runtime'

// the flag of key for Unhandle error, it was catched
// on process unhandledRejection event
const flagOfUnhandledErrors = '$unhandled'

const returnOfError = null

// define system event name, starts with '$'
const eventOfBefore = '$before'
const eventOfBeforeEach = '$beforeEach'
const eventOfAfter = '$after'
const eventOfAfterEach = '$afterEach'


class Betch
{

  constructor (ctx) {
    // create context and initialize it
    this._ctx = ctx ? ctx : {}
    this._initContext(this._ctx)
  }

  static run (val, ctx, data) {
      // define callback function to process unhandled rejection
    const callback =
        (err, reject) => {
          const key = flagOfUnhandledErrors
          const errs = ctx[flagOfErrors] || {}

          if (!errs[key]) errs[key] = []
          errs[key].push(err)
        }

      // handle the error event
    process.on('unhandledRejection', callback)

    const bc = new Betch(ctx)

    return bc.
        _run(val, data).
        then((result) => {
          // get errors from context
          const errs = ctx && ctx[flagOfErrors] || {}
          const hasError = errs && Object.keys(errs).length > 0

          if (hasError) {
            const catchError = ctx[flagOfThrowError]

            if (!catchError) return result

            const runError = new Error()

            runError.message = 'runtime error of betch'
            runError.items = errs

            return Promise.reject(runError)
          }

          return result
        }).
        finally(() => {
          process.removeListener('unhandledRejection', callback)
        })
  }

  static runScript (file, options, data) {
    const createContext = (opts) => {
        // declare
      const ctx = {}

        // if the key of options doesn't start with '$', we see it as argument
        // the value will append to %args object automatically
      if (opts) {
        Object.
            keys(opts).
            forEach((key) => {
              if (key.startsWith('$')) {
                ctx[key] = opts[key]
              } else {
                if (!ctx[flagOfArgs]) ctx[flagOfArgs] = {}
                ctx[flagOfArgs][key] = opts[key]
              }
            })
      }

        // run as script,
        // the default flag of catch error is true
      if (opts &&
            opts[flagOfThrowError] !== false) {
        ctx[flagOfThrowError] = true
      }

        // the default flag of ignore error is true
      if (opts &&
            opts[flagOfIgnoreError] !== false) {
        ctx[flagOfIgnoreError] = true
      }

      return ctx
    }

    const readScript = (scriptFile) => {
      let fs = null

      return co(function *() {
        fs = yield aq.statFile(scriptFile)

        return aq.readFile(scriptFile, { encoding: 'utf-8' })
      }).
        catch(() => {
          if (fs === null || !fs.isFile()) {
            throw new new Error(`invalid script file: ${scriptFile}`)
          }

          throw new new Error(`read script file: ${scriptFile} failed`)
        })
    }

    const parseScript = (fdata, ctx) => {
        // parse script content
      const $$ = (() => {
        try {
          return eval(fdata)
        } catch (err) {
          throw new Error('parse script failed')
        }
      })()

        // call init function if it is defined in script
      if ($$.init &&
          typeof $$.init === 'function') {
        $$.init(ctx)
      }

      return $$.Body
    }

    const procError = (ctx, rt) => {
        // assign errors to options from context
      const errs = ctx[flagOfErrors]

      if (errs && Object.keys(errs).length > 0) {
        options[flagOfErrors] = {}

        Object.assign(
            options[flagOfErrors], ctx[flagOfErrors]
          )
      }

      return rt
    }

    return co(function *() {
        // create runtime context
      const ctx = createContext(options)

        // read data by script file name
      const rs = yield readScript(file)

        // parse data to a script
      const ps = parseScript(rs, ctx)

        // execute script
      return Betch.run(ps, ctx, data).
          then((rt) => procError(ctx, rt))
    })
  }

  _initContext (ctx) {
    // set flag of full return
    if (ctx[flagOfFullReturn] !== true) {
      ctx[flagOfFullReturn] = false
    }

    // set flag of errors
    if (!ctx[flagOfErrors]) {
      ctx[flagOfErrors] = {}
    }

    // the default flag of catch error is true
    if (ctx[flagOfThrowError] !== false) {
      ctx[flagOfThrowError] = true
    }

    // the default flag of ignore error is false
    if (ctx[flagOfIgnoreError] !== true) {
      ctx[flagOfIgnoreError] = false
    }
  }

  _run (val, data) {
    if (!val) return Promise.resolve(null)

    const that = this
    const runFunc = that._runAsObject.bind(that)

    if (typeof val === 'object') {
      return val instanceof Promise ? val : runFunc(val, data)
    }

    return Promise.resolve(val)
  }

  _runAsObject (val, data) {
    const that = this
    const ctx = that._ctx
    const getFunc = that._getVal.bind(that)

    // return with parallel values by array object
    if (Array.isArray(val)) {
      return aq.
        parallel(
          val.map((item, index) => getFunc(data, `_${index}`, item))
        )
    }

    const keys = Object.keys(val)
    const valFunc = function (current, key, prefix) {
      if (keys.indexOf(key) < 0) {
        return Promise.resolve(current)
      }

      return getFunc(current, prefix ? `${prefix}_${key}` : key, val[key])
    }

    // create genrator functions
    return co(function *() {
      let current = data ? data : null

      // process before node
      current = yield valFunc(current, eventOfBefore)

      const rt = {}

      for (const key of keys) {
        // ignore system key
        if (key.startsWith(prefixOfSystem)) continue

        // declare full return flag for children nodes
        const isNested = typeof val[key] === 'object' && !ctx[flagOfFullReturn]

        if (isNested) ctx[flagOfFullReturn] = true

        try {
          // process event beforeEach
          current = yield valFunc(current, eventOfBeforeEach, key)

          // get result from parse val
          current = yield valFunc(current, key)

          // process event afterEach
          current = yield valFunc(current, eventOfAfterEach, key)

          // cache the value to context, but if the key stats with '_',
          // it will be ignored and not save to result
          if (!key.startsWith(prefixOfComment)) {
            ctx[key] = current

            // save current value to result
            if (ctx[flagOfFullReturn]) {
              rt[key] = current
            }
          }
        } finally {
          if (isNested) ctx[flagOfFullReturn] = false
        }
      }

      // process after node
      current = yield valFunc(current, eventOfAfter)

      return ctx[flagOfFullReturn] ? rt : current
    })
  }

  _getVal (current, key, val) {
    const that = this
    const ctx = that._ctx

    const runFunc = that._run.bind(that)
    const getValFunc = that._getVal.bind(that)

    const catchErrorFunc = (err) => {
      const errs = ctx[flagOfErrors]
      const catchError = ctx[flagOfThrowError]
      const ignoreError = ctx[flagOfIgnoreError]

      if (!ignoreError) errs[key] = err

      return catchError
        ? Promise.reject(err)
        : Promise.resolve(returnOfError)
    }

    try {
      // const result = parseValFunc(key, val, data)
      const result = (() => {
        if (!val) return null

        let rt = null

        switch (typeof val) {
        case 'string':
          // execute expression if it starts with '$'
          rt = val.startsWith('$')
            ? eval(val.substr(1, val.length - 1))
            : val
          break
        case 'function':
          rt = val(ctx, current)
          break
        case 'object':
          // parse every item in array
          rt = Array.isArray(val)
            ? aq.parallel(
                val.map((item) => getValFunc(current, key, item))
              )
            : val
          break
        default:
          // keep orignal format for other values
          rt = val
          break
        }

        if (key.endsWith(suffixOfBetchKey)) {
          rt = runFunc(rt, current)
        }

        return rt
      })()

      if (typeof result === 'object' &&
          result instanceof Promise) {
        return result.catch(
          (perr) => catchErrorFunc(perr)
        )
      }

      return Promise.resolve(result)
    } catch (err) {
      return catchErrorFunc(err)
    }
  }

}

// define some functons to use in script quickly
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

global.betch = Betch.run
aq.betch = Betch.run
// aq.betch$ = Betch.runScript
aq.run = Betch.runScript

module.exports = Betch
