const querystring = require('querystring')

if (!Object.hasOwnProperty('values')) {
  Reflect.defineProperty(
    Object,
    'values',
    {
      value: (obj) => Object.
        keys(obj).
        map((key) => obj[key])
    }
  )
}

if (!Object.hasOwnProperty('entries')) {
  Reflect.defineProperty(
    Object,
    'entries',
    {
      value: (obj) => Object.
        keys(obj).
        map((key) => [key, obj[key]])
    }
  )
}

if (!Object.hasOwnProperty('is')) {
  Reflect.defineProperty(
    Object,
    'is',
    {
      value: (x1, y1) => {
        if (x1 === y1) return x1 !== 0 || 1 / x1 === 1 / y1

        return false
      }
    }
  )
}

if (!Object.hasOwnProperty('toMap')) {
  Reflect.defineProperty(
    Object,
    'toMap',
    {
      value: (obj, deep) => {
        if (!deep) return new Map(Object.entries(obj))

        const map = new Map()

        for (const key of Object.keys(obj)) {
          const val = obj[key]

          map.set(key, typeof val === 'object' ? Object.toMap(val, true) : val)
        }

        return map
      }
    }
  )
}

if (!Object.hasOwnProperty('toFormData')) {
  Reflect.defineProperty(
    Object,
    'toFormData',
    {
      value: (obj) => querystring.stringify(obj)
    }
  )
}
