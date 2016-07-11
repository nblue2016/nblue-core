const aq = global.aq
const Script = require('./script')
const Cache = require('./cache')
const script = Script.parse

const prefixOfSystem = '$'
const prefixOfComment = '_'

const flagOfErrors = '$errors'
const flagOfCatchError = '$catchError'
const flagOfIgnoreError = '$ignoreError'

class Betch
{

  static run (val, options, data) {
    if (!val) return Promise.resolve(null)

    const ctx = options || {}
    const keys = val ? Object.keys(val) : []

    Betch.initContext(ctx)

    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return aq.parallel(
          val.map((item, index) =>
            Betch.parseVal(`_${index}$`, item, ctx, data))
        )
      } else if (val instanceof Promise) {
        return val
      } else if (keys.length > 0) {
        return aq.
          co(function *() {
            let current = data ? data : null

            // process before node
            if (keys.indexOf('$before') >= 0) {
              current =
                yield Betch.parseVal('$before', val.$before, ctx, current)
            }

            const result = {}

            for (const key of keys) {
              // ignore system key
              if (key.startsWith(prefixOfSystem)) continue

              // declare full return flag for children nodes
              const returnChild =
                typeof val[key] === 'object' && !ctx.$fullReturn

              if (returnChild) ctx.$fullReturn = true

              try {
                if (keys.indexOf('$beforeEach') >= 0) {
                  current =
                    yield Betch.parseVal(
                      `${key}_$beforeEach`, val.$beforeEach, ctx, current)
                }

                // get result from parse val
                current =
                  yield Betch.parseVal(key, val[key], ctx, current)

                if (keys.indexOf('$afterEach') >= 0) {
                  current =
                    yield Betch.parseVal(
                      `${key}_$afterEach`, val.$afterEach, ctx, current)
                }

                // cache the value to context
                // but if the key stats with '-', it will be ignored
                if (!key.startsWith(prefixOfComment)) {
                  ctx[key] = current

                  // save current value to result
                  if (ctx.$fullReturn) result[key] = current
                }
              } finally {
                if (returnChild) ctx.$fullReturn = false
              }
            }

          // process after node
            if (keys.indexOf('$after') >= 0) {
              current =
                yield Betch.parseVal(`$after`, val.$after, ctx, current)
            }

            return ctx.$fullReturn ? result : current
          })
      }
    } else if (typeof val === 'string') {
      return aq.co(function *() {
        const fstat = yield aq.
          statFile(val).
          catch(() => aq.done(null))

        return !(fstat === null) && fstat.isFile()
          ? Betch.runScript(val, ctx, data)
          : val
      })
    } else {
      return Promise.resolve(val)
    }

    return Promise.resolve(val)
  }

  static parseVal (key, val, ctx, data) {
    if (val === null) return Promise.resolve(null)

    let pending = val

    switch (typeof val) {
    case 'string':
      // execute expression if it starts with '$'
      if (pending.startsWith('$')) {
        pending = pending.substr(1, pending.length - 1)
        pending = eval(pending)
      }
      break
    case 'object':
      if (Array.isArray(val)) {
        // parse every item in array
        pending = aq.
          parallel(
            val.map(
              (item) => Betch.parseVal(key, item, ctx, data)
            )
          )
      } else {
        pending = key.endsWith('$') ? val : Betch.run(val, ctx, data)
      }
      break
    case 'function':
      pending = Betch.run(pending(ctx, data))
      break
    default:
      // keep orignal format for other values
      break
    }

    if (pending === null) {
      return Promise.resolve(null)
    }

    // convert normal val to promise
    if (!(pending instanceof Promise)) {
      pending = pending instanceof Error
        ? Promise.reject(pending)
        : Promise.resolve(pending)
    }

    if (ctx[flagOfCatchError] === true) {
      return pending.
        catch((err) => {
          ctx[flagOfErrors][key] = err

          return ctx[flagOfIgnoreError] === true
            ? Promise.resolve(null)
            : Promise.reject(err)
        })
    }

    // return pending
    return pending
  }

  static runScript (file, options, data) {
    return aq.
      co(function *() {
        // parse script file by file name
        const fstat = yield aq.
          statFile(file).
          catch(() => aq.done(null))

        if (fstat === null || !fstat.isFile()) {
          return aq.done(new Error(`invalid script file: ${file}`))
        }

        // read file data
        const fdata = yield aq.
          readFile(file, { encoding: 'utf-8' }).
          catch(() => aq.done(null))

        if (fdata === null) {
          // read script file failed
          return aq.done(new Error(`read script file: ${file} failed`))
        }

        // const ctx = options || {}
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
                if (!ctx.$args) ctx.$args = {}
                ctx.$args[key] = options[key]
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

        let $$ = null

        try {
          // parse file data to a script
          $$ = eval(fdata)

          // call init method if it was defined in script
          if ($$.init) $$.init(ctx)
        } catch (err) {
          return aq.done(err)
        }

        // execute script
        return Betch.
          run($$.Body, ctx, data).
          then((result) => {
            // even get the result, we still need check $error dict
            if (ctx[flagOfCatchError] &&
              Object.keys(ctx[flagOfErrors]).length > 0) {
              // found error in result
              const error = new Error()

              error.details = {}
              error.message = ''
              Object.assign(error.details, ctx[flagOfErrors])
              if (options) {
                options[flagOfErrors] = ctx[flagOfErrors]
              }
            } else if (options) {
              options[flagOfErrors] = {}
            }

            return aq.done(result)
          }).
          catch((err) => {
            if (ctx[flagOfIgnoreError] === true) {
              return aq.done(null)
            }

            return aq.done(err)
          })
      })
  }

  static initContext (ctx) {
    if (ctx.$fullReturn !== true) {
      ctx.$fullReturn = false
    }

    if (!ctx[flagOfErrors]) {
      ctx[flagOfErrors] = {}
    }

    if (!ctx[flagOfCatchError]) {
      ctx[flagOfCatchError] = false
    }
  }

}

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

const co = aq.co
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
