'use strict'

const { test } = require('tap')

const isHeaderConditional = require('../utils/is-header-conditional')

test('supplied with no value', (t) => {
  const result = isHeaderConditional()
  t.equal(result, false, 'should return false')
  t.end()
})

test('supplied with NOT an object', (t) => {
  const result = isHeaderConditional('not-object')
  t.equal(result, false, 'should return false')
  t.end()
})

test('checks for presense of keys', (t) => {
  t.test('if-modified-since', (t) => {
    const headers = { 'if-modified-since': 'value' }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })

  t.test('if-modified-since; case insensitive', (t) => {
    const headers = { 'IF-MODIFIED-SINCE': 'value' }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })

  t.test('if-none-match', (t) => {
    const headers = { 'if-none-match': 'value' }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })

  t.test('if-unmodified-since', (t) => {
    const headers = { 'if-unmodified-since': 'value' }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })

  t.test('if-match', (t) => {
    const headers = { 'if-match': 'value' }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })

  t.test('if-range', (t) => {
    const headers = { 'if-range': 'value' }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })

  t.test('any combination', (t) => {
    const headers = {
      'if-range': 'value',
      'some-key': 'value',
      'if-match': 'value',
    }
    const result = isHeaderConditional(headers)
    t.equal(result, true, 'should return true')
    t.end()
  })
  t.end()
})
