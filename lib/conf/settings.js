
class Settings {

  constructor(map) {
    this._map = map;
  }

  get Map() {
    return this._map;
  }

  get size() {
    return this.Map.size;
  }

  get [Symbol.iterator]() {
    return function* () {
      yield* this.Map.entries();
    };
  }

  has(key) {
    return this.Map.has(key);
  }

  get(key, defVal) {
    const map = this.Map;

    return map.has(key) ? map.get(key) : defVal;
  }

  set(key, val) {
    this.Map.set(key, val);
  }

  keys() {
    return this.Map.keys();
  }

  entries() {
    return this.Map.entries();
  }

  values() {
    return this.Map.values();
  }

}

module.exports = Settings;