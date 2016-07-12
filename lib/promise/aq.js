const fs = require('fs')
const querystring = require('querystring')
const co = require('co')
const nfetch = require('node-fetch')

// define const varinats
const JsonContent = 'application/json'

class aq extends co
{

  static co (gen) {
    return co(gen)
  }

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

    err.code = res.status
    err.status = res.status
    err.message = res.statusText

    if (data) {
      if (data.error) {
        Object.assign(err, data.error)
      } else {
        err.source = data
      }
    }

    return err
  }

  static fetchRequest (url, options) {
    return nfetch(url, options)
  }

  static fetchResponse (resolve, reject, res, options) {
    // get content type from response headers
    const strictMode = options && options.strictMode
    const contentType = res.headers.get('content-type')

    // init flag of JSON response
    let isJSON = false

    // check content type from response headers
    if (contentType &&
      contentType.indexOf(JsonContent) >= 0) {
      isJSON = true
    }

    // throw new Error if get status is not 2xx or 400
    if (!res.ok) {
      if (isJSON === false) {
        res.
          text().
          then((data) => reject(aq.createError(res, data)))
      } else {
        res.
          json().
          then((data) => reject(aq.createError(res, data))).
          done(resolve, reject)
      }
    } else if (isJSON === false) {
      // resolve normal text response
      resolve(res.text())
    } else if (strictMode === false) {
      // response JSON response without strict mode
      resolve(res.json())
    } else {
      // check error key in response data with strict mode
      res.
        json().
        then((data) => {
          if (data && data.error) {
            // reject error
            reject(aq.createError(res, data))
          } else {
            // resolve data
            resolve(data)
          }
        }).
        done(resolve, reject)
    }
  }

  static postForm (url, headers, body, options) {
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

      const fetch = aq.getFetch()
      const request = fetch.request
      const response = fetch.response

      request(url, fetchOptions.toObject()).
        then((res) => response(resolve, reject, res, options)).
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

      const fetch = aq.getFetch()
      const request = fetch.request
      const response = fetch.response

      return request(url, fetchOptions.toObject()).
        then((res) => response(resolve, reject, res, options)).
        catch((err) => reject(err))
    })
  }

  static getFetch () {
    return {
      request: aq.fetchRequest,
      response: aq.fetchResponse
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

if (!global.aq) global.aq = aq

module.exports = aq
