const fs = require('fs')
const path = require('path')
const YAML = require('.././yaml')
const SettingsClass = require('./settings')

const aq = require('../promise/aq.js')
const co = aq.co
const proc = process

const SYSKEY_OF_VERSION = '$$version'
const SYSKEY_OF_DESCRIPTION = '$$description'
const KEY_OF_SETTINGS = 'settings'

const DefaultEnvs = ['debug', 'release']

class ConfigMap extends Map
{

  constructor () {
    super()

    this._version = '1.0.0'
    this._description = ''
  }

  get Version () {
    return this._version
  }
  get Description () {
    return this._description
  }

  get Settings () {
    const map = this.has(KEY_OF_SETTINGS)
      ? this.get(KEY_OF_SETTINGS)
      : new Map()

    return new SettingsClass(map)
  }

  get Modules () {
    const keys = []

    for (const [key] of this) {
      keys.push(key)
    }

    return keys.
      filter((key) => !key.startsWith('$$')).
      filter((key) => ![KEY_OF_SETTINGS].includes(key))
  }

  copy (map) {
    this.clear()
    this.merge(map)
  }

  merge (map) {
    // check for argument
    if (!map) return this

    // assign this to that
    const that = this

    // declare
    let
      mergeArrayFunc = null,
      mergeFunc = null

    // copy system variants
    if (map.Version) that._version = map.Version
    if (map.Description) that._description = map.Description
    if (map.size === 0) return this

    // declare merge function
    mergeArrayFunc = (mergedItem, clonedItem) => {
      const getKeysFunc =
        (aryItem) => aryItem.
          filter((item) => item instanceof Map).
          map((item) => Object.keys(item.toObject())).
          filter((keys) => keys.length > 0).
          map((keys) => keys[0])

      const findItemFunc = (aryItem, key) => {
        let result = aryItem.
                      filter((item) => item instanceof Map).
                      filter((item) => item.has(key))

        result = result.length > 0 ? result[0] : null

        return result
      }

      // change value by directly
      const mergedArray = []
      const mSubKeys = getKeysFunc(mergedItem)
      const cSubKeys = getKeysFunc(clonedItem)

      const keys = new Set()

      mSubKeys.forEach((key) => keys.add(key))
      cSubKeys.forEach((key) => keys.add(key))

      for (const key of keys) {
        if (mSubKeys.includes(key) &&
          cSubKeys.includes(key)) {
          const mItem = findItemFunc(mergedItem, key)
          const cItem = findItemFunc(clonedItem, key)

          mergedArray.push(mergeFunc(mItem, cItem))
        } else if (mSubKeys.includes(key)) {
          mergedArray.push(findItemFunc(mergedItem, key))
        } else if (cSubKeys.includes(key)) {
          mergedArray.push(findItemFunc(clonedItem, key))
        }
      }

      return mergedArray
    }

    mergeFunc = (mergedMap, clonedMap) => {
      for (const [cKey, cItem] of clonedMap) {
        try {
          if (mergedMap.has(cKey)) {
            // current key exists in mapping
            const mItem = mergedMap.get(cKey)

              // check child keys
            if (mItem === cItem) continue
            else if (cItem instanceof Map) {
              mergedMap.set(
                cKey,
                mItem instanceof Map ? mergeFunc(mItem, cItem) : cItem
              )
            } else if (Array.isArray(mItem) && Array.isArray(cItem)) {
              mergedMap.set(cKey, mergeArrayFunc(mItem, cItem))
            } else {
              // change value by directly
              mergedMap.set(cKey, cItem)
            }
          } else {
              // append new key to map
            mergedMap.set(cKey, cItem)
          }
        } catch (err) {
          // ignore current node
          // console.log(err.message)
          throw err
        }
      }

      return mergedMap
    }

    return mergeFunc(that, map)
  }

  clone () {
    // create new instance of config map
    const map = new ConfigMap()

    // copy items in current map
    map.copy(this)

    // return new map
    return map
  }

  module (name) {
    // get module by name find it only in root
    return this.has(name) ? this.get(name) : null
  }

  getEnv (key, defaultVal) {
    // check arguments for key
    if (!key) throw new ReferenceError('key')

    // return value if found key in process env
    if (proc.env[key]) return proc.env[key]

    // get env module from config file
    const envModule = this.module('env')

    // return default value if env module doesn't exist
    if (!envModule) return defaultVal

    // return env value by key if found in module else return defaults
    return envModule.has(key) ? envModule.get(key) : defaultVal
  }

  static parseMap (map) {
    // create new instance of ConfigMap
    const cf = new ConfigMap()

    // copy data from map
    cf.copy(map)

    // convert cf to JSON and parse it.
    return ConfigMap.parseJSON(cf.toJSON(true))
  }

  static parseYAML (yaml) {
    return ConfigMap.parse(YAML.parse(yaml))
  }

  static parseJSON (json) {
    return ConfigMap.parse(JSON.parse(json))
  }

  static parse (options) {
    // create new instance of config map
    const cMap = new ConfigMap()

    // convert object to map object
    const parseKeys = (obj, map) => {
      // create new instance of Map if the arg doesn't exist
      let newMap = map

      if (!newMap) newMap = new Map()
      // if (!obj) return newMap
      if (!obj) return null

      // fetch all key in object
      Object.
        keys(obj).
        forEach((key) => {
          // ingore comment or system key
          if (key.startsWith('#') || key.startsWith('$$')) return

          // get value by key
          let value = obj[key]

          if (Array.isArray(value)) {
            value = value.map((val) => {
              if (typeof val === 'object') return parseKeys(val)

              return val
            })
            newMap.set(key, value)

            return
          } else if (typeof value === 'object') {
            // create new map for object value
            newMap.set(key, parseKeys(value))

            return
          }

          if (typeof value === 'string') {
            // allow use ${expression} to define
            // an expression and apply it in runtime
            if (value.startsWith('${') && value.endsWith('}')) {
              const expression = value.substring(2, value.length - 1)

              try {
                // convert express to value
                value = expression.eval()
              } catch (err) {
                throw new Error(`Can't parse expression: ${expression}`)
              }
            }
          }

          // set value by current key
          newMap.set(key, value)
        })

      // return created map
      return newMap
    }

    parseKeys(options, cMap)

    // append system variants
    if (options[SYSKEY_OF_VERSION]) {
      cMap._version = options[SYSKEY_OF_VERSION]
    }

    if (options[SYSKEY_OF_DESCRIPTION]) {
      cMap._description = options[SYSKEY_OF_DESCRIPTION]
    }

    return cMap
  }

  static readConfig (fileName, extName) {
    let newExt = extName

    if (!newExt) newExt = '.yml'

    return aq.
      statFile(fileName).
      then(() => aq.readFile(fileName, { encoding: 'utf-8' })).
      then((data) => {
        if (newExt === '.json' || newExt === '.config') {
          return ConfigMap.parseJSON(data)
        }

        return ConfigMap.parseYAML(data)
      }).
      catch(() => null)
  }

  static readConfigSync (fileName, extName) {
    let newExt = extName

    if (!newExt) newExt = '.yml'

    try {
      const fstat = fs.statSync(fileName)

      if (!fstat.isFile()) throw new Error(`the ${fileName} is not a file`)

      const data = fs.readFileSync(fileName, { encoding: 'utf-8' })

      if (newExt === '.json' || newExt === '.config') {
        return ConfigMap.parseJSON(data)
      }

      return ConfigMap.parseYAML(data)
    } catch (err) {
      return null
    }
  }

  static parseConfig (configFile, envs, callback) {
    // check for argument
    if (!configFile) throw new Error('undefined config file.')

    let
      newCallback = callback,
      newEnvs = envs

      // set default values fr new Envs
    if (!newEnvs) {
      newEnvs = DefaultEnvs
    } else if (typeof newEnvs === 'function') {
      newCallback = newEnvs
      newEnvs = DefaultEnvs
    }

    if (typeof newEnvs !== typeof []) {
      newEnvs = [newEnvs]
    }

    if (typeof newCallback !== 'function') newCallback = null

    // parse path for config file
    const fpath = path.parse(configFile)
    const ext = fpath.ext

    newEnvs = newEnvs.map((env) => String.format(
      '%s/%s.%s%s', fpath.dir, fpath.name, env, ext))

    return aq.pcall(
      co(function *() {
        const config = yield ConfigMap.readConfig(configFile, ext)

        if (!config) throw new Error(`parse file:${configFile} failed.`)

        const gen = function *(env) {
          const data = yield ConfigMap.readConfig(env, ext)

          config.merge(data)

          return config
        }

        if (newEnvs && newEnvs.length > 0) {
          return aq.series(newEnvs.map((env) => co(gen(env))))
        }

        return config
      }),
      callback
    )
  }

  static parseConfigSync (configFile, envs) {
    // check for argument
    if (!configFile) throw new Error('undefined config file.')

    let
      data = null,
      newEnvs = envs

    if (!newEnvs) {
      newEnvs = DefaultEnvs
    } else if (typeof newEnvs !== typeof []) {
      newEnvs = [newEnvs]
    }

    // parse path for config file
    const fpath = path.parse(configFile)

    newEnvs = newEnvs.map((env) => String.format(
      '%s/%s.%s%s', fpath.dir, fpath.name, env, fpath.ext))

    data = ConfigMap.readConfigSync(configFile, fpath.ext)

    const configs =
      newEnvs.map(
        (env) => ConfigMap.readConfigSync(env, fpath.ext)
      )

    // merge env configuration files
    for (const config of configs) {
      if (config === null) continue

      data.merge(config)
    }

    return data
  }

}

module.exports = ConfigMap
