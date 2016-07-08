if (!Array.prototype.toObject) {
  Array.prototype.toObject = function (keys) {
    if (keys === null) throw new Error('invaild keys')
    if (!Array.isArray(keys)) throw new Error('the keys is not an array')

    // const length = this.length > keys.length ? keys.length : this.length
    return keys.reduce((obj, key, index) => {
      if (index < this.length) {
        obj[key] = this[index]
      }

      return obj
    }, {})
  }
}
