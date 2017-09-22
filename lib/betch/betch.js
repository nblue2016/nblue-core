
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

const resultOfError = null;

const keyOfBeforeAll = '$before';
const keyOfBeforeEach = '$beforeEach';
const keyOfAfterAll = '$after';
const keyOfAfterEach = '$afterEach';

class Betch {

  constructor(ctx) {
    this._ctx = this._initContext(ctx || {});
  }

  static run(val, ctx, data) {
    const bc = new Betch(ctx || {});

    return bc._betch(val, data).then(result => {
      const errs = ctx && ctx[flagOfErrors];

      if (errs && Object.keys(errs).length > 0 && ctx[flagOfThrowError]) {
        const runError = new Error();

        runError.message = 'runtime error of betch';

        runError.items = errs;

        return Promise.reject(runError);
      }

      return result;
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

    return ctx;
  }

  _betch(val, data) {
    if (val === null) return Promise.resolve(null);

    if (typeof val === 'object') {
      if (val instanceof Promise) return val;

      const objFunc = this._betchObject.bind(this);

      return objFunc(val, data);
    }

    return Promise.resolve(val);
  }

  _betchObject(obj, data) {
    const ctx = this._ctx;

    const valFunc = this._betchValue.bind(this);

    if (Array.isArray(obj)) {
      return aq.parallel(obj.map((item, index) => valFunc(data, `_${ index }`, item)));
    }

    const keys = Object.keys(obj);

    const getValFunc = function (current, key, prefix) {
      if (keys.indexOf(key) < 0) {
        return aq.then(current);
      }

      const fullKey = prefix ? `${ prefix }_${ key }` : key;

      return valFunc(current, fullKey, obj[key]);
    };

    const gen = function* () {
      let current = data ? data : null;

      current = yield getValFunc(current, keyOfBeforeAll);

      const rt = {};

      for (const key of keys) {
        if (key.startsWith(prefixOfSystem)) continue;

        const flagOfSubBetch = typeof obj[key] === 'object' && !ctx[flagOfFullReturn];

        if (flagOfSubBetch) ctx[flagOfFullReturn] = true;

        try {
          const prefix = key;

          current = yield getValFunc(current, keyOfBeforeEach, prefix);

          current = yield getValFunc(current, key);

          current = yield getValFunc(current, keyOfAfterEach, prefix);

          if (!key.startsWith(prefixOfComment)) {
            ctx[key] = current;

            if (ctx[flagOfFullReturn]) rt[key] = current;
          }
        } finally {
          if (flagOfSubBetch) ctx[flagOfFullReturn] = false;
        }
      }

      current = yield getValFunc(current, keyOfAfterAll);

      return ctx[flagOfFullReturn] ? rt : current;
    };

    return co(gen.bind(this));
  }

  _betchValue(current, key, val) {
    const ctx = this._ctx;

    const betchFunc = this._betch.bind(this);

    const valFunc = this._betchValue.bind(this);

    const catchErrorFunc = err => {
      const errs = ctx[flagOfErrors];

      const ignoreError = ctx[flagOfIgnoreError];

      if (ignoreError === true) {
        return Promise.resolve(resultOfError);
      }

      errs[key] = err;

      const catchError = ctx[flagOfThrowError];

      return catchError === true ? Promise.reject(err) : Promise.resolve(resultOfError);
    };

    try {
      const result = (() => {
        if (val === null) return null;

        let rt = null;

        switch (typeof val) {
          case 'string':
            rt = val.startsWith('$') ? eval(val.substr(1, val.length - 1)) : val;
            break;
          case 'function':
            rt = val(ctx, current);
            break;
          case 'object':
            if (Array.isArray(val)) {
              rt = aq.parallel(val.map(item => valFunc(current, key, item)));
            } else {
              rt = val;
            }
            break;
          default:
            rt = val;
            break;
        }

        if (key.endsWith(suffixOfBetchKey)) {
          rt = betchFunc(rt, current);
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

const cacheHandler = (key, obj, expired) => {
  if (!key) throw new ReferenceError('key');
  if (!obj) return Promise.resolve();

  const caches = cache();

  const val = caches.getItem(key);

  if (val !== null) return aq.then(obj);

  return Betch.run(obj).tap(data => caches.setItem(key, data, expired)).then(data => data);
};

const rest = aq.rest;
const getRest = aq.get;
const postRest = aq.post;
const putRest = aq.put;
const delRest = aq.delete;
const postForm = aq.postForm;

if (!aq.betch) aq.betch = Betch.run;
if (!aq.betch$) aq.betch$ = Betch.runScript;

module.exports = Betch;