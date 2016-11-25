if (!Map.prototype.toObject) {
  Map.prototype.toObject = function () {
    const obj = {}
    const ctx = this

    for (const key of ctx.keys()) {
      const val = ctx.get(key)

      if (val instanceof Map) {
        obj[key] = val.toObject()
      }

      obj[key] = val
    }

    return obj
  }
}

if (!Map.prototype.toJSON) {
  Map.prototype.toJSON =
    function () {
      return JSON.stringify(this.toObject())
    }
}

if (!Map.prototype.get2) {
  Map.prototype.get2 =
    function (key, defVal) {
      return this.has(key) ? this.get(key) : defVal
    }
}
