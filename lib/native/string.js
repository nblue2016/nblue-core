const util = require('util')

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    const newPosition = position || 0

    return this.substr(newPosition, searchString.length) === searchString
  }
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (searchString, position) {
    const subjectString = this.toString()

    let newPosition = position

    if (typeof position !== 'number' ||
        !isFinite(position) ||
        Math.floor(position) !== position ||
        position > subjectString.length) {
      newPosition = subjectString.length
    }

    newPosition -= searchString.length

    const lastIndex = subjectString.indexOf(searchString, newPosition)

    return lastIndex !== -1 && lastIndex === position
  }
}

if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    let newStart = start

    if (typeof newStart !== 'number') newStart = 0

    if (newStart + search.length > this.length) {
      return this.indexOf(search, newStart) !== -1
    }

    return false
  }
}

if (!String.prototype.eval) {
  String.prototype.eval = function () {
    const s1 = this.toString()

    return eval(s1)
  }
}

if (!String.prototype.padStart) {
  String.prototype.padStart = function (targetLength, padString) {
    const ctx = this
    const currentLength = ctx.length

    let newString = padString

    if (!newString) newString = ' '

    if (currentLength >= targetLength) {
      return ctx.substr(0, targetLength)
    }

    const startPart = newString.
      repeat(targetLength - currentLength).
      substr(0, targetLength - currentLength)

    return `${startPart}${ctx.toString()}`
  }
}

if (!String.prototype.padEnd) {
  String.prototype.padEnd = function (targetLength, padString) {
    const ctx = this
    const currentLength = ctx.length

    let newString = padString

    if (!newString) newString = ' '

    if (currentLength >= targetLength) {
      return ctx.substr(0, targetLength)
    }


    const endPart = newString.
      repeat(targetLength - currentLength).
      substr(0, targetLength - currentLength)

    return `${ctx.toString()}${endPart}`
  }
}

if (!String.prototype.toDate) {
  String.prototype.toDate = function () {
    return new Date(Date.parse(this.toString()))
  }
}

if (!String.hasOwnProperty('format')) {
  Reflect.defineProperty(
    String,
    'format',
    {
      value: (text, ...items) => {
        if (items.length === 1 &&
          typeof items[0] === 'object') {
          const dict = items[0]

          let newText = text

          Object.
            keys(dict).
            forEach(
              (key) => {
                let indexKey = '${'

                indexKey += key
                indexKey += '}'

                while (newText.indexOf(indexKey) >= 0) {
                  newText = newText.replace(indexKey, dict[key])
                }
              }
            )

          return newText
        }

        return util.format(text, ...items)
      }
    }
  )
}
