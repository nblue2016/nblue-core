
class Settings {

  constructor (map) {
    this._map = map
  }

  get Map () {
    return this._map
  }

  get [Symbol.iterator] () {
    return function *() {
      yield* this.Map.entries()
    }
  }

  has (key) {
    const map = this.Map

    return map.has(key)
  }

  get (key, defVal) {
    const map = this.Map

    return map.has(key) ? map.get(key) : defVal
  }

  set (key, val) {
    const map = this.Map

    map.set(key, val)
  }

}

module.exports = Settings
