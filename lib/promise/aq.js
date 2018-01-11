const fs = require('fs');
const querystring = require('querystring');
const co = require('co');
const lib = require('nblue-extend');

const StringBuilder = lib.StringBuilder;

const JsonContent = 'application/json';

class aq extends co {

  static getModule(name) {
    try {
      return require(name);
    } catch (err) {
      return null;
    }
  }

  static co(gen) {
    return co(gen);
  }

  static wrap(gen) {
    return (...val) => aq.co(gen(...val));
  }

  static then(val, err) {
    if (err) return Promise.reject(err);
    if (val && val instanceof Promise) {
      return val;
    }

    return Promise.resolve(val);
  }

  static done(val) {
    if (!val) return Promise.resolve(null);
    if (val instanceof Promise) return val;
    if (val instanceof Error) return Promise.reject(val);

    return Promise.resolve(val);
  }

  static pcall(promise, callback) {
    if (!promise) throw new Error('Null reference of promise.');
    if (promise instanceof Promise === false) {
      throw new Error('promise is not a Promise.');
    }

    return promise.then(data => {
      if (callback) return callback(null, data);

      return data;
    }).catch(err => {
      if (callback) return callback(err, null);

      throw err;
    });
  }

  static nodeify(promise, callback) {
    return aq.pcall(promise, callback);
  }

  static callback(func, ...args) {
    return new Promise((resolve, reject) => {
      const cb = (err, data) => {
        if (err) reject(err);else resolve(data);
      };

      func(...args, cb);
    });
  }

  static invoke(func, ...args) {
    try {
      const rt = Reflect.apply(func, this, args);

      if (rt instanceof Promise) return rt;

      return Promise.resolve(rt);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static series(promises, data) {
    if (!promises) return aq.then(null);
    if (!Array.isArray(promises)) throw new Error('promises must be array');
    if (promises.length === 0) return aq.then(null);

    return new Promise((resolve, reject) => {
      const promiseFunc = (val, args) => {
        const pending = aq.mapPromise(promises[val], args);

        pending.then(ret => {
          if (val < promises.length - 1) {
            return promiseFunc(val + 1, ret);
          }

          return resolve(ret);
        }).catch(err => reject(err));
      };

      promiseFunc(0, data);
    });
  }

  static parallel(promises, data) {
    if (!promises) return aq.then(null);
    if (!Array.isArray(promises)) throw new Error('promises must be array');
    if (promises.length === 0) return aq.then([]);

    if (!promises) {
      return aq.then(null);
    }

    return Promise.all(promises.map(item => aq.mapPromise(item, data)));
  }

  static race(promises, data) {
    if (!promises) return aq.then(null);
    if (!Array.isArray(promises)) throw new Error('promises must be array');
    if (promises.length === 0) return aq.then([]);

    if (!promises) {
      return aq.then(null);
    }

    return Promise.race(promises.map(item => aq.mapPromise(item, data)));
  }

  static mapPromise(item, data) {
    let pending = item;

    if (typeof pending === 'function') {
      pending = pending(data);
    }

    if (!pending) return Promise.resolve(null);
    if (!(pending instanceof Promise)) {
      return Promise.resolve(pending);
    }

    return pending;
  }

  static statFile(fileName) {
    return new Promise((resolve, reject) => {
      fs.stat(fileName, (error, data) => {
        if (error) reject(error);

        resolve(data);
      });
    });
  }

  static readFile(fileName, options) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, options, (error, data) => {
        if (error) reject(error);

        resolve(data);
      });
    });
  }

  static readLines(fileName, options) {
    const opts = {
      trim: true,
      ignoreBlank: true
    };

    Object.assign(opts, options);

    const lines = [];

    return aq.statFile(fileName).then(() => new Promise((resolve, reject) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: fs.createReadStream(fileName, options)
      });

      rl.on('line', line => {
        if (line === '' && opts.ignoreBlank) return;

        lines.push(opts.trim === true ? line.trim() : line);
      });

      rl.on('error', err => reject(err));
      rl.on('close', () => resolve(lines));
    }));
  }

  static createError(res, data) {
    const err = new Error();

    switch (aq.fetchModule) {
      case 'node-fetch':
        err.code = res.status;
        err.status = res.status;
        err.message = res.statusText;
        break;
      case 'request':
        err.code = res.statusCode;
        err.status = res.statusCode;
        err.message = res.statusMessage;
        break;
      default:
        break;
    }

    if (data) {
      if (data.error) {
        Object.assign(err, data.error);
      } else {
        err.source = data;
      }
    }

    return err;
  }

  static getFetch() {
    const isJson = contentType => contentType && contentType.indexOf(JsonContent) >= 0;
    const checkResponse = (flag, res, data) => {
      if (!flag) {
        throw aq.createError(res, data);
      }

      return data;
    };

    if (!aq.fetchModule) {
      const sb = new StringBuilder();

      sb.append('Can\'t find any fetch module in current project, ');
      sb.append('you need install one module, like below\r\n');
      sb.append('npm install node-fetch \r\n or \r\n');
      sb.append('npm install request \r\n');

      return {
        request: () => Promise.reject(new Error(sb.toString())),
        response: () => null
      };
    }

    const fetch = aq.getModule(aq.fetchModule);

    switch (aq.fetchModule) {
      case 'request':
        return {
          request: (url, options) => {
            const reqOptions = {};

            Object.assign(reqOptions, options || {});

            reqOptions.url = url;
            if (!reqOptions.method) reqOptions.method = 'GET';

            if (reqOptions.method && reqOptions.method.toUpperCase() === 'GET') {
              Reflect.deleteProperty(reqOptions, 'body');
            }

            return new Promise((resolve, reject) => {
              fetch(reqOptions, (err, res, body) => {
                if (err) reject(err);else {
                  res.body = body;
                  resolve(res);
                }
              });
            });
          },
          response: res => {
            const json = isJson(res.headers['content-type']);
            const ok = res.statusCode >= 200 && res.statusCode < 400;

            let body = null;

            if (json) {
              try {
                body = JSON.parse(res.body);
              } catch (err) {
                throw aq.createError(res, res.body);
              }
            } else {
              body = res.body;
            }

            return aq.then(body).then(data => checkResponse(ok, res, data));
          }
        };
      case 'node-fetch':
        return {
          request: (url, options) => fetch(url, options),
          response: res => {
            const json = isJson(res.headers.get('content-type'));
            const pending = json ? res.json() : res.text();

            return pending.then(data => checkResponse(res.ok, res, data));
          }
        };
      default:
        return {
          request: () => Promise.reject(new Error(`Doesn't support module: ${aq.fetchModule}`)),
          response: () => null
        };
    }
  }

  static postForm(url, headers, body) {
    return new Promise((resolve, reject) => {
      let newHeaders = headers;

      if (!newHeaders) newHeaders = {};

      if (!Object.keys(newHeaders).map(key => key.toLowerCase()).includes('content-type')) {
        newHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      if (!newHeaders['user-agent']) {
        newHeaders['user-agent'] = 'nblue-aq-fetch';
      }

      const opts = new Map();

      opts.set('method', 'POST');
      opts.set('headers', newHeaders);

      opts.set('body', typeof body === 'object' ? querystring.stringify(body) : body);

      const { request, response } = aq.getFetch();

      request(url, opts.toObject()).then(res => response(res)).then(data => resolve(data)).catch(err => reject(err));
    });
  }

  static rest(url, method, headers, body, options) {
    return new Promise((resolve, reject) => {
      let newHeaders = headers,
          newMethod = method;

      if (!newMethod) newMethod = 'GET';
      if (!newHeaders) newHeaders = {};

      if (!Object.keys(newHeaders).map(key => key.toLowerCase()).includes('content-type')) {
        newHeaders['Content-Type'] = JsonContent;
      }

      if (!newHeaders['user-agent']) {
        newHeaders['user-agent'] = 'nblue-aq-fetch';
      }

      if (!body) {
        Reflect.deleteProperty(newHeaders, 'Content-Type');
      }

      const fetchOptions = new Map();

      fetchOptions.set('method', newMethod.toUpperCase());
      fetchOptions.set('headers', newHeaders);

      if (body && fetchOptions.get('method').toUpperCase() !== 'GET') {
        fetchOptions.set('body', typeof body === 'object' ? JSON.stringify(body) : body);
      }

      if (options) {
        Object.keys(options).forEach(key => {
          fetchOptions.set(key, options);
        });
      }

      const { request, response } = aq.getFetch();

      return request(url, fetchOptions.toObject()).then(res => response(res)).then(data => resolve(data)).catch(err => reject(err));
    });
  }

  static get(url, headers, body, options) {
    return aq.rest(url, 'GET', headers, body, options);
  }

  static post(url, headers, body, options) {
    return aq.rest(url, 'POST', headers, body, options);
  }

  static put(url, headers, body, options) {
    return aq.rest(url, 'PUT', headers, body, options);
  }

  static delete(url, headers, body, options) {
    return aq.rest(url, 'DELETE', headers, body, options);
  }

  static options(url, headers, body, options) {
    return aq.rest(url, 'OPTIONS', headers, body, options);
  }

}

const fetchModules = ['request', 'node-fetch'];

for (const name of fetchModules) {
  const module = aq.getModule(name);

  if (module) {
    aq.fetchModule = name;
    break;
  }
}

aq.fetch = aq.getFetch().request;

module.exports = aq;