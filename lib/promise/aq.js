const fs = require('fs')
const querystring = require('querystring')
const co = require('co')

const StringBuilder = global.StringBuilder

// define const varinats
const JsonContent = 'application/json'

class aq extends co
{

  static getModule (name) {
    try {
      return require(name)
    } catch (err) {
      return null
    }
  }

  // invoke co(gen)
  static co (gen) {
    return co(gen)
  }

  // package a value to Promise
  static then (val, err) {
    return new Promise((resolve, reject) => {
      if (err) reject(err)
      resolve(val)
    })
  }

  static done (val) {
    if (!val) return Promise.resolve(null)
    if (val instanceof Error) return Promise.reject(val)

    return Promise.resolve(val)
  }

  // call a function with callback
  static call (target, func, ...args) {
    const ctx = this

    return new Promise(
      (resolve, reject) => {
        const callback = (err, data) => {
          if (err) reject(err)
          resolve(data)
        }

        return Reflect.apply(func, target ? target : ctx, [...args, callback])
      }
    )
  }

  // apply a function with callback
  static apply (target, func, args) {
    const ctx = this

    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) reject(err)
        resolve(data)
      })

      return Reflect.apply(func, target ? target : ctx, args)
    })
  }

  // invoke a normal function
  static invoke (func, args) {
    const ctx = this

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(Reflect.apply(func, ctx, args))
        } catch (err) {
          reject(err)
        }
      }, 0)
    })
  }

  // execute array of promises one by one
  static series (promises) {
    if (!promises) return aq.then(null)
    else if (promises.length === 0) return aq.then([])

    return new Promise((resolve, reject) => {
      const promiseFunc = (val) => {
        promises[val].
          then((data) => {
            if (val < promises.length - 1) {
              return promiseFunc(val + 1)
            }

            return resolve(data)
          }).
          catch((err) => reject(err))
      }

      promiseFunc(0)
    })
  }

  // execute array of promises at the same time
  static parallel (promises) {
    if (!promises || promises.length === 0) {
      return aq.then(null)
    }

    return co.wrap(function *(newPromises) {
      return yield newPromises
    })(promises)
  }

  static race (promisses) {
    return Promise.race(promisses)
  }

  static statFile (fileName) {
    return new Promise((resolve, reject) => {
      fs.stat(fileName, (error, data) => {
        if (error) reject(error)

        resolve(data)
      })
    })
  }

  static readFile (fileName, options) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, options, (error, data) => {
        if (error) reject(error)

        resolve(data)
      })
    })
  }

  // define function of creating error with response
  static createError (res, data) {
    const err = new Error()

    switch (aq.fetchModule) {
    case 'node-fetch':
      err.code = res.status
      err.status = res.status
      err.message = res.statusText
      break
    case 'request':
      err.code = res.statusCode
      err.status = res.statusCode
      err.message = res.statusText
      break
    default:
      break
    }

    if (data) {
      if (data.error) {
        Object.assign(err, data.error)
      } else {
        err.source = data
      }
    }

    return err
  }

  static postForm (url, headers, body) {
    // create new instance of Promise
    return new Promise((resolve, reject) => {
      let
        newHeaders = headers

      // set default values
      if (!newHeaders) newHeaders = {}

      // append content-type to header
      if (!Object.
          keys(newHeaders).
          map((key) => key.toLowerCase()).
          includes('content-type')) {
        newHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      }

      if (!newHeaders['user-agent']) {
        newHeaders['user-agent'] = 'nblue-aq-fetch'
      }

      // create options map for fetch
      const fetchOptions = new Map()

      // convert method to upper case
      fetchOptions.set('method', 'POST')
      fetchOptions.set('headers', newHeaders)

      fetchOptions.set(
        'body',
        typeof body === 'object' ? querystring.stringify(body) : body
      )

      const { request, response } = aq.getFetch()

      request(url, fetchOptions.toObject()).
        then((res) => response(res)).
        then((data) => resolve(data)).
        catch((err) => reject(err))
    })
  }

  static rest (url, method, headers, body, options) {
    // create new instance of Promise
    return new Promise((resolve, reject) => {
      let
        newHeaders = headers,
        newMethod = method

      // set default values
      if (!newMethod) newMethod = 'GET'
      if (!newHeaders) newHeaders = {}

      // append content-type to header
      if (!Object.
          keys(newHeaders).
          map((key) => key.toLowerCase()).
          includes('content-type')) {
        newHeaders['Content-Type'] = JsonContent
      }

      if (!newHeaders['user-agent']) {
        newHeaders['user-agent'] = 'nblue-aq-fetch'
      }

      if (!body) {
        Reflect.deleteProperty(newHeaders, 'Content-Type')
      }

      // create options map for fetch
      const fetchOptions = new Map()

      // convert method to upper case
      fetchOptions.set('method', newMethod.toUpperCase())
      fetchOptions.set('headers', newHeaders)

      if (body &&
          fetchOptions.get('method').toUpperCase() !== 'GET') {
        // convert body to string, it looks request only use string
        fetchOptions.set(
          'body',
          typeof body === 'object' ? JSON.stringify(body) : body
        )
      }

      if (options) {
        Object.
          keys(options).
          forEach((key) => {
            fetchOptions.set(key, options)
          })
      }

      const { request, response } = aq.getFetch()

      return request(url, fetchOptions.toObject()).
        then((res) => response(res)).
        then((data) => resolve(data)).
        catch((err) => reject(err))
    })
  }

  static getFetch () {
    const isJson =
      (contentType) => contentType && contentType.indexOf(JsonContent) >= 0
    const resFailed = (data) => data && data.error

    if (!aq.fetchModule) {
      const sb = new StringBuilder()

      sb.append('Can\'t any fetch module in current project, ')
      sb.append('you need install one like below\r\n')
      sb.append('npm install node-fetch \r\n')
      sb.append('npm install request \r\n')

      return {
        request: () => Promise.reject(new Error(sb.toString())),
        response: () => null
      }
    }

    const fetch = aq.getModule(aq.fetchModule)

    switch (aq.fetchModule) {
    case 'request':
      return {
        request: (url, options) => {
          const reqOptions = {}

          Object.assign(reqOptions, options || {})

          reqOptions.url = url
          if (!reqOptions.method) reqOptions.method = 'GET'

          if (reqOptions.method &&
            reqOptions.method.toUpperCase() === 'GET') {
            Reflect.deleteProperty(reqOptions, 'body')
          }

          return new Promise((resolve, reject) => {
            fetch(reqOptions, (err, res, body) => {
              if (err) reject(err)
              else {
                res.body = body
                resolve(res)
              }
            })
          })
        },
        response: (res) => {
          // get content type from response headers
          // const strictMode = options && options.$strictMode
          const json = isJson(res.headers['content-type'])
          const ok = res.statusCode >= 200 && res.statusCode < 400

          // init flag of JSON response
          let body = res.body

          if (json) {
            body = body ? JSON.parse(body) : {}
          }

          return aq.
            then(body).
            then((data) => {
              if (!ok ||
                  json && resFailed(data)) {
                throw aq.createError(res, data)
              }

              return data
            })
        }
      }
    case 'node-fetch':
      return {
        request: (url, options) => fetch(url, options),
        response: (res) => {
          // parse response
          const json = isJson(res.headers.get('content-type'))
          const pending = json ? res.json() : res.text()

          return pending.
            then((data) => {
              if (!res.ok ||
                  json && resFailed(data)) {
                throw aq.createError(res, data)
              }

              return data
            })
        }
      }
    default:
      return {
        request: () => Promise.reject(
          new Error(`Doesn't support module: ${aq.fetchModule}`)),
        response: () => null
      }
    }
  }

  // static method for http get method
  static get (url, headers, body, options) {
    return aq.rest(url, 'GET', headers, body, options)
  }

  // static method for http post method
  static post (url, headers, body, options) {
    return aq.rest(url, 'POST', headers, body, options)
  }

  // static method for http put method
  static put (url, headers, body, options) {
    return aq.rest(url, 'PUT', headers, body, options)
  }

  // static method for http delete method
  static delete (url, headers, body, options) {
    return aq.rest(url, 'DELETE', headers, body, options)
  }

  // static method for http delete method
  static options (url, headers, body, options) {
    return aq.rest(url, 'OPTIONS', headers, body, options)
  }

}

const fetchModules = ['request', 'node-fetch']

for (const name of fetchModules) {
  const module = aq.getModule(name)

  if (module) {
    aq.fetchModule = name
    break
  }
}

// if (!aq.fetchModule) aq.fetchModule = 'node-fetch'
aq.fetch = aq.getFetch().request

if (!global.aq) global.aq = aq
if (!global.fetch) global.fetch = aq.fetch

module.exports = aq
