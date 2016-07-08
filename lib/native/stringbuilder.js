class StringBuilder
{

  constructor () {
    this._buffer = []
  }

  get length () {
    return this._buffer.length
  }

  _append (ary, str) {
    for (let i = 0; i < str.length; i += 1) {
      ary.push(str[i])
    }
  }

  append (str) {
    if (!str) {
      throw new Error('null of str')
    }

    this._append(this._buffer, str)
  }

  appendFormat (format, ...items) {
    this.append(String.format(format, ...items))
  }

  insert (index, str) {
    if (index < 0 || index >= this.length) {
      throw new Error('the index out of range')
    }
    if (!str) {
      throw new Error('null of str')
    }

    if (index === 0) {
      let newBuffer = []

      this._append(newBuffer, str)
      this._buffer = newBuffer.concat(this._buffer)

      newBuffer = null
    } else if (index === this.length - 1) {
      this._append(this._buffer, str)
    } else {
      let
        buffer1 = null,
        buffer2 = null

      buffer1 = this._buffer.slice(0, index + 1)
      buffer2 = this._buffer.slice(index + 1, this.length)

      this._append(buffer1, str)
      this._buffer = buffer1.concat(buffer2)

      buffer1 = null
      buffer2 = null
    }
  }

  insertFormat (index, format, ... items) {
    this.insert(index, String.format(format, ...items))
  }

  remove (index, length) {
    if (index < 0 || index >= this.length) {
      throw new Error('the index out of range')
    }

    if (length < 0 || index + length > this.length) {
      throw new Error('invalid range of length')
    }

    this._buffer.splice(index, length)
  }

  toString () {
    return this._buffer.join('')
  }

}

if (!global.StringBuilder) {
  global.StringBuilder = StringBuilder
}

module.exports = StringBuilder
