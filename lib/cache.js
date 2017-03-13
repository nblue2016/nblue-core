
class Cache {

  constructor() {
    this._cache = new Map();
  }

  get Cache() {
    return this._cache;
  }

  get Size() {
    return this._cache.size;
  }

  getItem(key) {
    if (!key) throw new ReferenceError('key');

    const cache = this.Cache;

    if (!cache.has(key)) return null;

    const item = cache.get(key);

    if (!item || this.isExpired(item.expired)) {
      return null;
    }

    return item.value;
  }

  setItem(key, value, expired) {
    const cache = this.Cache;

    const item = {};

    item.value = value;

    item.expired = this.convertExpired(expired);

    cache.set(key, item);
  }

  remove(key) {
    const cache = this.Cache;

    if (cache.has(key)) cache.delete(key);
  }

  removeExpried() {
    const cache = this.Cache;

    const removedKeys = new Set();

    for (const [key, val] of cache) {
      if (this.isExpired(val.expired)) {
        removedKeys.add(key);
      }
    }

    for (const key of removedKeys) {
      if (cache.has(key)) cache.delete(key);
    }
  }

  clear() {
    const cache = this.Cache;

    cache.clear();
  }

  isExpired(expired) {
    if (!expired) return false;

    const l1 = Date.now();

    const l2 = expired.valueOf();

    return l2 < l1;
  }

  convertExpired(expired) {
    if (!expired) throw new ReferenceError('expired');

    const now = Date.now();

    if (typeof expired === 'number') {
      return new Date(now.valueOf() + expired);
    } else if (typeof expired === 'object') {
      if (expired instanceof Date) return expired;

      return this.convertExpired(expired.toString());
    } else if (typeof expired === 'string') {
      const intValue = Number.parseInt(expired, 0);

      if (!isNaN(intValue)) return this.convertExpired(intValue);

      const dateValue = Date.parse(expired);

      if (!isNaN(dateValue)) return this.convertExpired(dateValue);
    }

    throw new Error(`Doesn't support type of expired: ${ typeof expired }`);
  }

}

module.exports = Cache;