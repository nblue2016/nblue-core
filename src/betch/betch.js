// use libraries
const co = require('co')
const aq = require('.././promise/aq')
const Script = require('./script')
const Cache = require('../cache')

// get internal classes
const script = Script.parse
const fetch = aq.fetch

// define constrants
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

// the flag of throw error when the first issue occurs
const flagOfThrowError = '$throwError'

// the flag of ignore errors, it will not trigger .catch to handle the error
// when it is true, other correct results will save to context and result,
// also we can find errors in context with $errors key
const flagOfIgnoreError = '$ignoreError'

// the returns value of error result,
// it will return when ignore error in runtime
const resultOfError = null

// define system event name, starts with '$'
const keyOfBeforeAll = '$before'
const keyOfBeforeEach = '$beforeEach'
const keyOfAfterAll = '$after'
const keyOfAfterEach = '$afterEach'


class Betch {

  constructor (ctx) {
    // initialize context with
    this._ctx = this._initContext(ctx || {})
  }

  // the static method to betch an object or value
  static run (val, ctx, data) {
    // create new instance of betch with context
    const bc = new Betch(ctx || {})

    // invoke
    return bc._betch(val, data).
      then((result) => {
        // get errors from context
        const errs = ctx && ctx[flagOfErrors]

        // check errors in context and catched error in runtime
        if (errs &&
            Object.keys(errs).length > 0 &&
            ctx[flagOfThrowError]) {
          // create new instance of runtime error
          const runError = new Error()

          // set message to runtime error
          runError.message = 'runtime error of betch'

          // append all errors to runtime error
          runError.items = errs

          // rejct error
          return Promise.reject(runError)
        }

        // return result
        return result
      })
  }

  // the static method to betch a script file
  static runScript (file, options, data) {
    // define function to create context to run script
    const createContext = (opts) => {
      // declare
      const ctx = {}

      // if the key of options doesn't start with '$', we see it as argument
      // the value will append to %args object automatically
      if (opts) {
        const keys = Object.keys(opts)

        // initialize a variant
        let hasArgs = true

        // parse system items
        keys.
          filter((key) => key.startsWith('$')).
          forEach((key) => {
            ctx[key] = opts[key]
          })

        // check arguments were assigned or not
        if (!ctx[flagOfArgs]) {
          ctx[flagOfArgs] = {}
          hasArgs = false
        }

        // parse argument items
        keys.
          filter((key) => !key.startsWith('$')).
          forEach((key) => {
            (hasArgs ? ctx : ctx[flagOfArgs])[key] = opts[key]
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

      // return context
      return ctx
    }

    // define a function to read script from file
    const readScript = (scriptFile) => {
      // declare file stream
      let fs = null

      // co a generator function
      return co(function *() {
        // try to check file name does exists or not
        fs = yield aq.statFile(scriptFile)

        // read content from file by name
        return aq.readFile(scriptFile, { encoding: 'utf-8' })
      }).
      catch(() => {
        // throw error if the script has incorrect file name
        if (fs === null || !fs.isFile()) {
          throw new Error(`invalid script file: ${scriptFile}`)
        }

        // throw error read file stream failed
        throw new Error(`read script file: ${scriptFile} failed`)
      })
    }

    // define function to parse script
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

      // return body of script
      return $$.Body
    }

    // define a function to process error in context
    const procError = (ctx, rt) => {
      // assign errors to options from context
      const errs = ctx[flagOfErrors]

      // found error in context errors
      if (errs && Object.keys(errs).length > 0) {
        // create error object in options
        options[flagOfErrors] = {}

        // assign errors from context to options
        Object.assign(
            options[flagOfErrors], ctx[flagOfErrors]
          )
      }

      // return result
      return rt
    }

    // co a generator function
    return co(function *() {
      // create runtime context
      const ctx = createContext(options)

      // read data from file stream by script file name
      const rs = yield readScript(file)

      // parse data to a script
      const ps = parseScript(rs, ctx)

      // execute script
      return Betch.run(ps, ctx, data).
          then((rt) => procError(ctx, rt))
    })
  }

  // the method initialize context for betch
  // the context includes every item result with key
  // and some system variant starts with '$'
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

    // return result
    return ctx
  }

  // the private method to betch an object or value
  _betch (val, data) {
    // return null if betch value is null
    if (val === null) return Promise.resolve(null)

    // if value is object run function
    if (typeof val === 'object') {
      // return value directly if value is a Promise
      if (val instanceof Promise) return val

      // get betch function and bind this
      const objFunc = this._betchObject.bind(this)

      // invoke betch function
      return objFunc(val, data)
    }

    // return a Promise with value
    return Promise.resolve(val)
  }

  // the private method to betch an object
  _betchObject (obj, data) {
    // get context from instance
    const ctx = this._ctx

    // define get value function and bind this
    const valFunc = this._betchValue.bind(this)

    // return with parallel values by array object
    if (Array.isArray(obj)) {
      return aq.
        parallel(
          obj.map(
            (item, index) => valFunc(data, `_${index}`, item)
          )
        )
    }

    // get keys of object
    const keys = Object.keys(obj)

    // define a function for get value by key
    const getValFunc = function (current, key, prefix) {
      // if the key wasn't defiend in target object
      // ignore process current value
      if (keys.indexOf(key) < 0) {
        // only return current value with Promise
        return aq.then(current)
      }

      // get full key name with prefix and key
      const fullKey = prefix ? `${prefix}_${key}` : key

      // invoke function to get result by current value
      return valFunc(current, fullKey, obj[key])
    }

    // create genrator functions
    const gen = function *() {
      // get current value from data or null
      let current = data ? data : null

      // process value before invoke values for keys
      current = yield getValFunc(current, keyOfBeforeAll)

      // declare result of current betch
      const rt = {}

      for (const key of keys) {
        // ignore system key
        if (key.startsWith(prefixOfSystem)) continue

        // declare a flag of call sub-object in betch
        const flagOfSubBetch =
          typeof obj[key] === 'object' && !ctx[flagOfFullReturn]

        // set flag of full return to ture if child is a complex object
        if (flagOfSubBetch) ctx[flagOfFullReturn] = true

        try {
          // define prefix of process key
          const prefix = key

          // process value before invoke evary value
          current = yield getValFunc(current, keyOfBeforeEach, prefix)

          // process current value
          current = yield getValFunc(current, key)

          // process value after invoke evary value
          current = yield getValFunc(current, keyOfAfterEach, prefix)

          // cache the value to context, but if the key stats with '_',
          // it will be ignored and not save to result
          if (!key.startsWith(prefixOfComment)) {
            ctx[key] = current

            // save current value to full result if the flag is true
            if (ctx[flagOfFullReturn]) rt[key] = current
          }
        } finally {
          // reset flag of full return to false if child is a complex object
          if (flagOfSubBetch) ctx[flagOfFullReturn] = false
        }
      }

      // process value after invoke values for keys
      current = yield getValFunc(current, keyOfAfterAll)

      // return result for current scope or full betch
      return ctx[flagOfFullReturn] ? rt : current
    }

    // invoke generator function and return result
    return co(gen.bind(this))
  }

  // the private method to betch a value
  _betchValue (current, key, val) {
    // get context from instance
    const ctx = this._ctx

    // define run betch object function and bind this
    const betchFunc = this._betch.bind(this)

    // define get value function and bind this
    const valFunc = this._betchValue.bind(this)

    // define function to catch error in runtime
    const catchErrorFunc = (err) => {
      // get errors from context
      const errs = ctx[flagOfErrors]

      // get flag of ignore error in runtime
      const ignoreError = ctx[flagOfIgnoreError]

      // return error result if flag of ingore error is true
      if (ignoreError === true) {
        return Promise.resolve(resultOfError)
      }

      // append error to array by key
      errs[key] = err

      // get flag of throw error from context
      const catchError = ctx[flagOfThrowError]

      // reject error or return error result
      return catchError === true
        ? Promise.reject(err)
        : Promise.resolve(resultOfError)
    }

    try {
      // get result from invoking a function
      const result = (() => {
        // return null if val is null
        if (val === null) return null

        // declare result
        let rt = null

        switch (typeof val) {
        case 'string':
          // execute expression if it starts with '$'
          // otherwiase return value directly
          rt = val.startsWith('$')
            ? eval(val.substr(1, val.length - 1))
            : val
          break
        case 'function':
          // invoke value as a function
          rt = val(ctx, current)
          break
        case 'object':
          // parse every item in array
          if (Array.isArray(val)) {
            rt = aq.parallel(
              val.map((item) => valFunc(current, key, item))
            )
          } else {
            rt = val
          }
          break
        default:
          // keep orignal format for other values
          rt = val
          break
        }

        // if ends with key is $, it will call betch again by itself
        if (key.endsWith(suffixOfBetchKey)) {
          rt = betchFunc(rt, current)
        }

        // return result
        return rt
      })()

      // check type of result
      if (typeof result === 'object' &&
          result instanceof Promise) {
        // return result and catched error
        return result.catch((perr) => catchErrorFunc(perr))
      }

      // only return result for a value
      return Promise.resolve(result)
    } catch (err) {
      // process error if the error was found
      return catchErrorFunc(err)
    }
  }

}

// define some functons and variant, these can be used in betch runtime
// define config in betch runtime
const config = () => Betch.config || (global.config || {})

// define cache in betch runtime
const cache = () => {
  // create new instance of cache if can't find cache in Betch
  if (!Betch.cache) {
    Betch.cache = new Cache()
  }

  // return betch's cache
  return Betch.cache
}

// define cache handler in runtime, it will easy to
// process key-value pair in cache with expired time.
const cacheHandler = (key, obj, expired) => {
  // check for arguments
  if (!key) throw new ReferenceError('key')
  if (!obj) return Promise.resolve()

  // get caches in betch runtime
  const caches = cache()

  // get item from cache by key
  const val = caches.getItem(key)

  // return the result if it found in cache
  if (val !== null) return aq.then(obj)

  // get result after betch a value and save to cache with expired time
  return Betch.
    run(obj).
    tap((data) => caches.setItem(key, data, expired)).
    then((data) => data)
}

// declear rest functions from aq that can used in betch script
const rest = aq.rest
const getRest = aq.get
const postRest = aq.post
const putRest = aq.put
const delRest = aq.delete
const postForm = aq.postForm

if (!aq.betch) aq.betch = Betch.run
if (!aq.betch$) aq.betch$ = Betch.runScript

module.exports = Betch
