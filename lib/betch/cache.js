class Cache
{

  constructor () {
    this._cache = new Map()
  }

  get Caches () {
    return this._cache
  }

  getItem (key) {
    const ctx = this

    if (!ctx.Caches.has(key)) return null

    const item = ctx.Caches.get(key)

    if (!item ||
      ctx.isExpired(item.expired)) {
      return null
    }

    return item.value
  }

  setItem (key, value, expired) {
    const ctx = this
    const item = {}

    item.value = value
    item.expired = ctx.convertExpired(expired)

    ctx.Caches.set(key, item)
  }

  isExpired (expired) {
    if (!expired) return false

    const l1 = Date.now()
    const l2 = expired.valueOf()

    return l2 < l1
  }

  convertExpired (expired) {
    const ctx = this
    const now = new Date()

    if (expired) {
      if (typeof expired === 'number') {
        return new Date(now.valueOf() + expired)
        // return now.addSeconds(expired)
      } else if (typeof expired === 'object') {
        if (expired instanceof Date) return expired

        return ctx.convertExpired(expired.toString())
      } else if (typeof expired === 'string') {
        const intValue = Number.parseInt(expired, 0)

        if (!isNaN(intValue)) return ctx.convertExpired(intValue)

        const dateValue = Date.parse(expired)

        if (!isNaN(dateValue)) return ctx.convertExpired(dateValue)
      }
    }

    throw new Error(`invalid value of expired: ${expired}`)
  }

}

module.exports = Cache
