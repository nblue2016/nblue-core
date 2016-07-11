const assert = require('assert')
const IIf = global.IIf

describe('global', () => {
  it('test global method of IIf', () => {
    assert.equal(IIf(true, 's1', 's2'), 's1', 'IIF test for ture OK')
    assert.equal(IIf(false, 's1', 's2'), 's2', 'IIF test for false OK')
  })

  it('test array to object', () => {
    const source = {
      a: 1,
      b: 2,
      c: 3
    }

    const target = [1, 2, 3].toObject(['a', 'b', 'c'])

    assert.deepEqual(source, target, 'equal')
  })

  it('test string method of startsWith', () => {
    const s1 = 'abcdefg'

    assert.equal(s1.startsWith('abc'), true, "s1 starts with 'abc'")
    assert.equal(s1.startsWith('bcd'), false, "s1 doesn't start with 'bcd'")
  })

  it('test string method of endsWith', () => {
    const s1 = 'abcdefg'

    assert.equal(s1.endsWith('efg'), true, "s1 ends with 'efg'")
    assert.equal(s1.endsWith('bcd'), false, "s1 doesn't ends with 'bcd'")
  })

  it('test string method of includes', () => {
    const s1 = 'abcdefg'

    assert.equal(s1.includes('abc'), true, "s1 includes 'abc'")
    assert.equal(s1.includes('cde'), true, "s1 includes 'cde'")
    assert.equal(s1.includes('efg'), true, "s1 includes 'efg'")
    assert.equal(s1.includes('af'), false, "s1 doesn't includes 'af'")
  })

  it('test string method of eval', () => {
    const s1 = '1+1'
    const s2 = 'Number.parseInt((5+4)/3)'

    assert.equal(s1.eval(), 2, `eval s1: ${s1}`)
    assert.equal(s2.eval(), 3, `eval s1: ${s2}`)
  })

  it('test string method of padStart', () => {
    const s1 = 'abcdefghij'

    assert.equal(s1.padStart(10, '0'), 'abcdefghij',
      "'abcdefghij'.padStart(10, '0') should equal 'abcdefghij'")
    assert.equal(s1.padStart(7, '0'), 'abcdefg',
        "'abcdefghij'.padStart(7, '0') should equal 'abcdefg'")
    assert.equal(s1.padStart(15, '0'), '00000abcdefghij',
      "'abcdefghij'.padStart(15, '0') should equal '00000abcdefghij'")
    assert.equal(s1.padStart(15, 'abc'), 'abcababcdefghij',
      "'abcdefghij'.padStart(15, 'abc') should equal 'abcababcdefghij'")
    assert.equal(''.padStart(15, 'abc'), 'abcabcabcabcabc',
        "''.padStart(15, 'abc') should equal 'abcabcabcabcabc'")
    assert.equal(s1.padStart(15), '     abcdefghij',
            "''.padStart(15) should equal '     abcdefghij'")
  })

  it('test string method of padEnd', () => {
    const s1 = 'abcdefghij'

    assert.equal(s1.padEnd(10, '0'), 'abcdefghij',
      "'abcdefghij'.padEnd(10, '0') should equal 'abcdefghij'")
    assert.equal(s1.padEnd(7, '0'), 'abcdefg',
        "'abcdefghij'.padEnd(7, '0') should equal 'abcdefg'")
    assert.equal(s1.padEnd(15, '0'), 'abcdefghij00000',
      "'abcdefghij'.padEnd(15, '0') should equal 'abcdefghij00000'")
    assert.equal(s1.padEnd(15, 'abc'), 'abcdefghijabcab',
      "'abcdefghij'.padEnd(15, 'abc') should equal 'abcdefghijabcab'")
    assert.equal(''.padEnd(15, 'abc'), 'abcabcabcabcabc',
        "''.padEnd(15, 'abc') should equal 'abcabcabcabcabc'")
    assert.equal(s1.padEnd(15), 'abcdefghij     ',
            "''.padEnd(15) should equal 'abcdefghij     '")
  })

  it('test static method of String.format', () => {
    assert.equal(
      String.format('%s:%s', 'a1', 'a2'), 'a1:a2', 'test string format')
    assert.equal(
      String.format(
        '${word1} ${word2}!', {
          word1: 'hello',
          word2: 'world'
        }),
        'hello world!',
        'test string format2'
      )
    assert.equal(
      String.format('%d:%s-%s', 3, 's1', 's2'), '3:s1-s2', 'test string format')
  })

  it('test static method of Object.values', () => {
    const obj1 = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }

    assert.deepEqual(
      Object.values(obj1),
      [1, 2, 3, 4],
      "the value of array wasn't expected")
  })

  it('test static method of Object.entries', () => {
    const obj1 = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }

    assert.deepEqual(
      Object.entries(obj1),
      [['a', 1], ['b', 2], ['c', 3], ['d', 4]],
      "the value of array wasn't expected")
  })

  it('test static method of Object.toMap', () => {
    const obj1 = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }

    let map = Object.toMap(obj1)

    assert.equal(map.has('a'), true, 'not found key a')
    assert.equal(map.has('b'), true, 'not found key b')
    assert.equal(map.has('c'), true, 'not found key c')
    assert.equal(map.has('d'), true, 'not found key d')

    assert.equal(map.get('a'), 1, 'not found value for key a')
    assert.equal(map.get('b'), 2, 'not found value for key b')
    assert.equal(map.get('c'), 3, 'not found value for key c')
    assert.equal(map.get('d'), 4, 'not found value for key d')

    const obj2 = {
      a: 1,
      b: 2,
      c: {
        c1: 31,
        c2: 32
      },
      d: 4
    }

    map = Object.toMap(obj2)
    assert.equal(map.has('a'), true, 'not found key a')
    assert.equal(map.has('b'), true, 'not found key b')
    assert.equal(map.has('c'), true, 'not found key c')
    assert.equal(map.has('d'), true, 'not found key d')

    assert.equal(map.get('a'), 1, 'not found value for key a')
    assert.equal(map.get('b'), 2, 'not found value for key b')
    assert.deepEqual(
      map.get('c'), {
        c1: 31,
        c2: 32
      },
      'not found value for key c')
    assert.equal(map.get('d'), 4, 'not found value for key d')

    map = Object.toMap(obj2, true)
    assert.equal(map.has('a'), true, 'not found key a')
    assert.equal(map.has('b'), true, 'not found key b')
    assert.equal(map.has('c'), true, 'not found key c')
    assert.equal(map.has('d'), true, 'not found key d')

    assert.equal(map.get('a'), 1, 'not found value for key a')
    assert.equal(map.get('b'), 2, 'not found value for key b')
    assert.deepEqual(
      map.get('c'),
      Object.toMap({
        c1: 31,
        c2: 32
      }),
      'not found value for key c'
    )

    assert.equal(map.get('c').get('c1'), 31, 'not found value for key c1')
    assert.equal(map.get('c').get('c2'), 32, 'not found value for key c2')
    assert.equal(map.get('d'), 4, 'not found value for key d')
  })

  it('test static method of Object.toFormData', () => {
    const obj1 = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }

    assert.deepEqual(
      Object.toFormData(obj1),
      'a=1&b=2&c=3&d=4',
      'invaild string for form data')
  })
})
