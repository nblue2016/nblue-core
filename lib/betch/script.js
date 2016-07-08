const defaultMetas = {
  $version: '1.0.2',
  $engine: 'nblue',
  $args: {}
}

class Script
{

  constructor (metas, body) {
    this._metas = {}
    this._body = body

    Object.assign(this._metas, defaultMetas)
    if (metas) {
      Object.assign(this._metas, metas)
    }
  }

  get Metas () {
    return this._metas
  }

  get Body () {
    return this._body
  }

  init (ctx) {
    const metas = this.Metas
    const args = metas.$args
    const ctxArgs = ctx.$args || {}

    for (const [key, arg] of Object.entries(args)) {
      if (!ctxArgs[key]) {
        // set default value to argument
        if (typeof arg === 'object') {
          ctxArgs[key] = arg.default ? arg.default : null
        } else {
          ctxArgs[key] = arg
        }
      }

      // check type
      if (arg.type) {
        if (ctxArgs[key] &&
            typeof ctxArgs[key] !== arg.type) {
          throw new Error(`invalid type for arg: ${key}`)
        }
      }
    }

    ctx.$args = ctxArgs
  }

  static parse (val) {
    if (typeof val !== 'object') {
      return new Script(null, val)
    }

    if (val.$metas) {
      const metas = val.$metas

      Reflect.deleteProperty(val, '$metas')

      return new Script(metas, val)
    }

    return new Script(null, val)
  }

}

module.exports = Script
