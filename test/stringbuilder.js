const assert = require('assert')
const StringBuilder = require('../lib').StringBuilder

describe('string builder', () => {
  it('test append method', () => {
    const sb = new StringBuilder()

    sb.append('abc')
    sb.append('def')
    assert.equal(sb.toString(), 'abcdef', 'Tested')

    sb.append('abc')
    assert.equal(sb.toString(), 'abcdefabc', 'Tested')

    sb.append('def')
    assert.equal(sb.toString(), 'abcdefabcdef', 'Tested')

    assert.equal(sb.length, 12, 'Tested')
  })

  it('test append format method', () => {
    const sb = new StringBuilder()

    sb.appendFormat('abc%sdef', 'aaa')
    sb.append('def')
    assert.equal(sb.toString(), 'abcaaadefdef', 'Tested')

    sb.appendFormat('abc%ddef', '111')
    assert.equal(sb.toString(), 'abcaaadefdefabc111def', 'Tested')
  })

  it('test insert method', () => {
    const sb = new StringBuilder()

    sb.append('abc')
    sb.append('def')
    sb.insert(2, 'fff')
    assert.equal(sb.toString(), 'abcfffdef', 'Tested')

    sb.insert(0, 'aaa')
    assert.equal(sb.toString(), 'aaaabcfffdef', 'Tested')

    sb.insert(11, 'hhh')
    assert.equal(sb.toString(), 'aaaabcfffdefhhh', 'Tested')
  })

  it('test remove method', () => {
    const sb = new StringBuilder()

    sb.append('abc')
    sb.append('def')
    sb.remove(2, 2)
    assert.equal(sb.toString(), 'abef', 'Tested')
  })
})
