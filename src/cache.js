/*
Simple cache class as default
*/
class Cache
{

  constructor () {
    this._cache = new Map()
  }

  get Cache () {
    return this._cache
  }

  get Size () {
    return this._cache.size
  }

  getItem (key) {
    // check for argument
    if (!key) throw new ReferenceError('key')

    // get instance of cache
    const cache = this.Cache

    // return null value if cache hasn't current key
    if (!cache.has(key)) return null

    // try to get item from cache by key
    const item = cache.get(key)

    // return null if item of expired
    if (!item ||
      this.isExpired(item.expired)) {
      return null
    }

    // return value of item
    return item.value
  }

  setItem (key, value, expired) {
    // get instance of cache
    const cache = this.Cache

    // create new item
    const item = {}

    // set value and expired for cache item
    item.value = value

    // set expired value for cache item, it should be a date value
    item.expired = this.convertExpired(expired)

    // save item to cache
    cache.set(key, item)
  }

  remove (key) {
    // get instance of cache
    const cache = this.Cache

    // remove key from cache
    if (cache.has(key)) cache.delete(key)
  }

  removeExpried () {
    // get instance of cache
    const cache = this.Cache

    // create new Set for removed keys
    const removedKeys = new Set()

    // fetch all key, value in cache
    for (const [key, val] of cache) {
      // check current value is expired or not
      if (this.isExpired(val.expired)) {
        // append key of expired item to set
        removedKeys.add(key)
      }
    }

    // fetch keys of expired
    for (const key of removedKeys) {
      // remove key from cache
      if (cache.has(key)) cache.delete(key)
    }
  }

  clear () {
    // get instance of cache
    const cache = this.Cache

    // clear all item in cache
    cache.clear()
  }

  isExpired (expired) {
    // / return false if not set expired
    if (!expired) return false

    // get long value for now
    const l1 = Date.now()

    // get long value for expired
    const l2 = expired.valueOf()

    // compare long value
    return l2 < l1
  }

  convertExpired (expired) {
    // check arguement
    if (!expired) throw new ReferenceError('expired')
    // get now date
    const now = Date.now()

    if (typeof expired === 'number') {
      // process type of expired is number
      return new Date(now.valueOf() + expired)
    } else if (typeof expired === 'object') {
      // process type of expired is date
      if (expired instanceof Date) return expired

      // try to convert object to string and get expired value again
      return this.convertExpired(expired.toString())
    } else if (typeof expired === 'string') {
      // try to parse string to number
      const intValue = Number.parseInt(expired, 0)

      // get expired value again if it is a number
      if (!isNaN(intValue)) return this.convertExpired(intValue)

      // try to parse string to date
      const dateValue = Date.parse(expired)

      // get expired value again if it is a Date
      if (!isNaN(dateValue)) return this.convertExpired(dateValue)
    }

    // throw error for doesn't supports type of expired
    throw new Error(`Doesn't support type of expired: ${typeof expired}`)
  }

}

module.exports = Cache
