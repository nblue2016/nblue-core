const co = require('co');
const aq = require('.././promise/aq');
const Script = require('./script');
const Cache = require('../cache');

const script = Script.parse;
const fetch = aq.fetch;

const prefixOfSystem = '$';
const prefixOfComment = '_';
const suffixOfBetchKey = '$';

const flagOfErrors = '$errors';

const flagOfArgs = '$args';

const flagOfFullReturn = '$fullReturn';

const flagOfThrowError = '$throwError';

const flagOfIgnoreError = '$ignoreError';

const flagOfRuntimeErrors = '$runtime';

const flagOfUnhandledErrors = '$unhandled';

const returnOfError = null;

const eventOfBefore = '$before';
const eventOfBeforeEach = '$beforeEach';
const eventOfAfter = '$after';
const eventOfAfterEach = '$afterEach';

class Betch {

  constructor(ctx) {
    this._ctx = ctx ? ctx : {};
    this._initContext(this._ctx);
  }

  static run(val, ctx, data) {
    const callback = (err, reject) => {
      const key = flagOfUnhandledErrors;
      const errs = ctx[flagOfErrors] || {};

      if (!errs[key]) errs[key] = [];
      errs[key].push(err);
    };

    process.on('unhandledRejection', callback);

    const bc = new Betch(ctx);

    return bc._run(val, data).then(result => {
      const errs = ctx && ctx[flagOfErrors] || {};
      const hasError = errs && Object.keys(errs).length > 0;

      if (hasError) {
        const catchError = ctx[flagOfThrowError];

        if (!catchError) return result;

        const runError = new Error();

        runError.message = 'runtime error of betch';
        runError.items = errs;

        return Promise.reject(runError);
      }

      return result;
    }).finally(() => {
      process.removeListener('unhandledRejection', callback);
    });
  }

  static runScript(file, options, data) {
    const createContext = opts => {
      const ctx = {};

      if (opts) {
        const keys = Object.keys(opts);

        let hasArgs = true;

        keys.filter(key => key.startsWith('$')).forEach(key => {
          ctx[key] = opts[key];
        });

        if (!ctx[flagOfArgs]) {
          ctx[flagOfArgs] = {};
          hasArgs = false;
        }

        keys.filter(key => !key.startsWith('$')).forEach(key => {
          (hasArgs ? ctx : ctx[flagOfArgs])[key] = opts[key];
        });
      }

      if (opts && opts[flagOfThrowError] !== false) {
        ctx[flagOfThrowError] = true;
      }

      if (opts && opts[flagOfIgnoreError] !== false) {
        ctx[flagOfIgnoreError] = true;
      }

      return ctx;
    };

    const readScript = scriptFile => {
      let fs = null;

      return co(function* () {
        fs = yield aq.statFile(scriptFile);

        return aq.readFile(scriptFile, { encoding: 'utf-8' });
      }).catch(() => {
        if (fs === null || !fs.isFile()) {
          throw new Error(`invalid script file: ${ scriptFile }`);
        }

        throw new Error(`read script file: ${ scriptFile } failed`);
      });
    };

    const parseScript = (fdata, ctx) => {
      const $$ = (() => {
        try {
          return eval(fdata);
        } catch (err) {
          throw new Error('parse script failed');
        }
      })();

      if ($$.init && typeof $$.init === 'function') {
        $$.init(ctx);
      }

      return $$.Body;
    };

    const procError = (ctx, rt) => {
      const errs = ctx[flagOfErrors];

      if (errs && Object.keys(errs).length > 0) {
        options[flagOfErrors] = {};

        Object.assign(options[flagOfErrors], ctx[flagOfErrors]);
      }

      return rt;
    };

    return co(function* () {
      const ctx = createContext(options);

      const rs = yield readScript(file);

      const ps = parseScript(rs, ctx);

      return Betch.run(ps, ctx, data).then(rt => procError(ctx, rt));
    });
  }

  _initContext(ctx) {
    if (ctx[flagOfFullReturn] !== true) {
      ctx[flagOfFullReturn] = false;
    }

    if (!ctx[flagOfErrors]) {
      ctx[flagOfErrors] = {};
    }

    if (ctx[flagOfThrowError] !== false) {
      ctx[flagOfThrowError] = true;
    }

    if (ctx[flagOfIgnoreError] !== true) {
      ctx[flagOfIgnoreError] = false;
    }
  }

  _run(val, data) {
    if (!val) return Promise.resolve(null);

    const that = this;
    const runFunc = that._runAsObject.bind(that);

    if (typeof val === 'object') {
      return val instanceof Promise ? val : runFunc(val, data);
    }

    return Promise.resolve(val);
  }

  _runAsObject(val, data) {
    const that = this;
    const ctx = that._ctx;
    const getFunc = that._getVal.bind(that);

    if (Array.isArray(val)) {
      return aq.parallel(val.map((item, index) => getFunc(data, `_${ index }`, item)));
    }

    const keys = Object.keys(val);
    const valFunc = function (current, key, prefix) {
      if (keys.indexOf(key) < 0) {
        return Promise.resolve(current);
      }

      return getFunc(current, prefix ? `${ prefix }_${ key }` : key, val[key]);
    };

    return co(function* () {
      let current = data ? data : null;

      current = yield valFunc(current, eventOfBefore);

      const rt = {};

      for (const key of keys) {
        if (key.startsWith(prefixOfSystem)) continue;

        const isNested = typeof val[key] === 'object' && !ctx[flagOfFullReturn];

        if (isNested) ctx[flagOfFullReturn] = true;

        try {
          current = yield valFunc(current, eventOfBeforeEach, key);

          current = yield valFunc(current, key);

          current = yield valFunc(current, eventOfAfterEach, key);

          if (!key.startsWith(prefixOfComment)) {
            ctx[key] = current;

            if (ctx[flagOfFullReturn]) {
              rt[key] = current;
            }
          }
        } finally {
          if (isNested) ctx[flagOfFullReturn] = false;
        }
      }

      current = yield valFunc(current, eventOfAfter);

      return ctx[flagOfFullReturn] ? rt : current;
    });
  }

  _getVal(current, key, val) {
    const that = this;
    const ctx = that._ctx;

    const runFunc = that._run.bind(that);
    const getValFunc = that._getVal.bind(that);

    const catchErrorFunc = err => {
      const errs = ctx[flagOfErrors];
      const catchError = ctx[flagOfThrowError];
      const ignoreError = ctx[flagOfIgnoreError];

      if (!ignoreError) errs[key] = err;

      return catchError ? Promise.reject(err) : Promise.resolve(returnOfError);
    };

    try {
      const result = (() => {
        if (!val) return null;

        let rt = null;

        switch (typeof val) {
          case 'string':
            rt = val.startsWith('$') ? eval(val.substr(1, val.length - 1)) : val;
            break;
          case 'function':
            rt = val(ctx, current);
            break;
          case 'object':
            rt = Array.isArray(val) ? aq.parallel(val.map(item => getValFunc(current, key, item))) : val;
            break;
          default:
            rt = val;
            break;
        }

        if (key.endsWith(suffixOfBetchKey)) {
          rt = runFunc(rt, current);
        }

        return rt;
      })();

      if (typeof result === 'object' && result instanceof Promise) {
        return result.catch(perr => catchErrorFunc(perr));
      }

      return Promise.resolve(result);
    } catch (err) {
      return catchErrorFunc(err);
    }
  }

}

const config = () => Betch.config || global.config || {};

const cache = () => {
  if (!Betch.cache) {
    Betch.cache = new Cache();
  }

  return Betch.cache;
};

const cacheHandler = (key, expired, promise) => {
  const caches = cache();
  const item = caches.getItem(key);

  let result = null;

  if (item === null) {
    result = Betch.run(promise);

    caches.setItem(key, result, expired);
  } else {
    result = item;
  }

  return result;
};

const rest = aq.rest;
const getRest = aq.get;
const postRest = aq.post;
const putRest = aq.put;
const delRest = aq.delete;
const postForm = aq.postForm;

aq.betch = Betch.run;

aq.run = Betch.runScript;

module.exports = Betch;