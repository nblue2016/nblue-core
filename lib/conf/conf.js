
const fs = require('fs');
const path = require('path');
const YAML = require('.././yaml');
const SettingsClass = require('./settings');
const aq = require('../promise/aq.js');

const co = aq.co;
const proc = process;

const SYSKEY_OF_VERSION = '$$version';
const SYSKEY_OF_DESCRIPTION = '$$description';
const KEY_OF_SETTINGS = 'settings';

const DefaultEnvs = ['debug', 'release'];

class ConfigMap extends Map {
  static parseMap(map) {
    if (!map) throw new ReferenceError('map');

    const cf = new ConfigMap();

    cf.copy(map);

    return ConfigMap.parseJSON(cf.toJSON(true));
  }

  static parseYAML(yaml) {
    return ConfigMap.parse(YAML.parse(yaml));
  }

  static parseJSON(json) {
    return ConfigMap.parse(JSON.parse(json));
  }

  static parse(options) {
    const cMap = new ConfigMap();

    const parseKeys = (obj, map) => {
      let newMap = map;

      if (!newMap) newMap = new Map();

      if (!obj) return null;

      Object.keys(obj).forEach(key => {
        if (key.startsWith('#') || key.startsWith('$$')) return;

        let value = obj[key];

        if (Array.isArray(value)) {
          value = value.map(val => {
            if (typeof val === 'object') return parseKeys(val);

            return val;
          });
          newMap.set(key, value);

          return;
        } else if (typeof value === 'object') {
          newMap.set(key, parseKeys(value));

          return;
        }

        if (typeof value === 'string') {
          if (value.startsWith('${') && value.endsWith('}')) {
            const expression = value.substring(2, value.length - 1);

            try {
              value = expression.eval();
            } catch (err) {
              throw new Error(`Can't parse expression: ${ expression }`);
            }
          }
        }

        newMap.set(key, value);
      });

      return newMap;
    };

    parseKeys(options, cMap);

    if (options[SYSKEY_OF_VERSION]) {
      cMap._version = options[SYSKEY_OF_VERSION];
    }

    if (options[SYSKEY_OF_DESCRIPTION]) {
      cMap._description = options[SYSKEY_OF_DESCRIPTION];
    }

    return cMap;
  }

  static readConfig(fileName, extName) {
    let newExt = extName;

    if (!newExt) newExt = '.yml';

    return aq.statFile(fileName).then(() => aq.readFile(fileName, { encoding: 'utf-8' })).then(data => {
      if (newExt === '.json' || newExt === '.config') {
        return ConfigMap.parseJSON(data);
      }

      return ConfigMap.parseYAML(data);
    }).catch(() => null);
  }

  static readConfigSync(fileName, extName) {
    let newExt = extName;

    if (!newExt) newExt = '.yml';

    try {
      const fstat = fs.statSync(fileName);

      if (!fstat.isFile()) throw new Error(`the ${ fileName } is not a file`);

      const data = fs.readFileSync(fileName, { encoding: 'utf-8' });

      if (newExt === '.json' || newExt === '.config') {
        return ConfigMap.parseJSON(data);
      }

      return ConfigMap.parseYAML(data);
    } catch (err) {
      return null;
    }
  }

  static parseConfig(configFile, envs, callback) {
    if (!configFile) throw new Error('undefined config file.');

    let newCallback = callback,
        newEnvs = envs;

    if (!newEnvs) {
      newEnvs = DefaultEnvs;
    } else if (typeof newEnvs === 'function') {
      newCallback = newEnvs;
      newEnvs = DefaultEnvs;
    }

    if (typeof newEnvs !== typeof []) {
      newEnvs = [newEnvs];
    }

    if (typeof newCallback !== 'function') newCallback = null;

    const fpath = path.parse(configFile);
    const ext = fpath.ext;

    newEnvs = newEnvs.map(env => String.format('%s/%s.%s%s', fpath.dir, fpath.name, env, ext));

    return aq.nodeify(co(function* () {
      const config = yield ConfigMap.readConfig(configFile, ext);

      if (!config) throw new Error(`parse file:${ configFile } failed.`);

      const gen = function* (env) {
        const data = yield ConfigMap.readConfig(env, ext);

        if (data) config.merge(data);

        return config;
      };

      if (newEnvs && newEnvs.length > 0) {
        return aq.series(newEnvs.map(env => co(gen(env))));
      }

      return config;
    }), callback);
  }

  static parseConfigSync(configFile, envs) {
    if (!configFile) throw new Error('undefined config file.');

    let data = null,
        newEnvs = envs;

    if (!newEnvs) {
      newEnvs = DefaultEnvs;
    } else if (typeof newEnvs !== typeof []) {
      newEnvs = [newEnvs];
    }

    const fpath = path.parse(configFile);

    newEnvs = newEnvs.map(env => String.format('%s/%s.%s%s', fpath.dir, fpath.name, env, fpath.ext));

    data = ConfigMap.readConfigSync(configFile, fpath.ext);

    const configs = newEnvs.map(env => ConfigMap.readConfigSync(env, fpath.ext));

    for (const config of configs) {
      if (config === null) continue;

      data.merge(config);
    }

    return data;
  }

  constructor() {
    super();

    this._version = '1.0.0';
    this._description = '';
  }

  get Version() {
    return this._version;
  }

  get Description() {
    return this._description;
  }

  get Settings() {
    const map = this.has(KEY_OF_SETTINGS) ? this.get(KEY_OF_SETTINGS) : new Map();

    return new SettingsClass(map);
  }

  get Modules() {
    const keys = [];

    for (const [key] of this) {
      keys.push(key);
    }

    return keys.filter(key => !key.startsWith('$$')).filter(key => ![KEY_OF_SETTINGS].includes(key));
  }

  copy(map) {
    if (!map) throw new ReferenceError('map');

    this.clear();

    this.merge(map);
  }

  merge(map) {
    if (!map) throw new ReferenceError('map');

    let mergeArrayFunc = null,
        mergeFunc = null;

    if (map.Version) this._version = map.Version;
    if (map.Description) this._description = map.Description;
    if (map.size === 0) return this;

    mergeArrayFunc = (mergedItem, clonedItem) => {
      const getKeysFunc = aryItem => aryItem.filter(item => item instanceof Map).map(item => Object.keys(item.toObject())).filter(keys => keys.length > 0).map(keys => keys[0]);

      const findItemFunc = (aryItem, key) => {
        let result = aryItem.filter(item => item instanceof Map).filter(item => item.has(key));

        result = result.length > 0 ? result[0] : null;

        return result;
      };

      const mergedArray = [];
      const mSubKeys = getKeysFunc(mergedItem);
      const cSubKeys = getKeysFunc(clonedItem);

      const keys = new Set();

      mSubKeys.forEach(key => keys.add(key));
      cSubKeys.forEach(key => keys.add(key));

      for (const key of keys) {
        if (mSubKeys.includes(key) && cSubKeys.includes(key)) {
          const mItem = findItemFunc(mergedItem, key);
          const cItem = findItemFunc(clonedItem, key);

          mergedArray.push(mergeFunc(mItem, cItem));
        } else if (mSubKeys.includes(key)) {
          mergedArray.push(findItemFunc(mergedItem, key));
        } else if (cSubKeys.includes(key)) {
          mergedArray.push(findItemFunc(clonedItem, key));
        }
      }

      return mergedArray;
    };

    mergeFunc = (mergedMap, clonedMap) => {
      for (const [cKey, cItem] of clonedMap) {
        try {
          if (mergedMap.has(cKey)) {
            const mItem = mergedMap.get(cKey);

            if (mItem === cItem) continue;else if (cItem instanceof Map) {
              mergedMap.set(cKey, mItem instanceof Map ? mergeFunc(mItem, cItem) : cItem);
            } else if (Array.isArray(mItem) && Array.isArray(cItem)) {
              mergedMap.set(cKey, mergeArrayFunc(mItem, cItem));
            } else {
              mergedMap.set(cKey, cItem);
            }
          } else {
            mergedMap.set(cKey, cItem);
          }
        } catch (err) {
          throw err;
        }
      }

      return mergedMap;
    };

    return mergeFunc(this, map);
  }

  clone() {
    const map = new ConfigMap();

    map.copy(this);

    return map;
  }

  module(name) {
    if (!name) throw new ReferenceError('name');

    return this.has(name) ? this.get(name) : null;
  }

  getEnv(key, defaultVal) {
    if (!key) throw new ReferenceError('key');

    if (proc.env[key]) return proc.env[key];

    const envModule = this.module('env');

    if (!envModule) return defaultVal;

    return envModule.has(key) ? envModule.get(key) : defaultVal;
  }

}

module.exports = ConfigMap;