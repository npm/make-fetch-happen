'use strict'

const requireInject = require('require-inject')
const { test } = require('tap')

test('configure options', (t) => {
  let mockCache = () => {}
  const configureOptions = requireInject('../utils/configure-options', {
    '../utils/initialize-cache': mockCache
  })

  test('supplied with no value', (t) => {
    const opts = configureOptions()
    const expectedObject = { method: 'GET', retry: { retries: 0 } }
    t.deepEqual(opts, expectedObject, 'should return default opts')
    t.end()
  })

  test('supplied with empty object', (t) => {
    const opts = configureOptions({})
    const expectedObject = { method: 'GET', retry: { retries: 0 } }
    t.deepEqual(opts, expectedObject, 'should return default opts')
    t.end()
  })

  test('changes method to upper case', (t) => {
    const actualOpts = { method: 'post' }
    const opts = configureOptions(actualOpts)
    const expectedObject = { method: 'POST', retry: { retries: 0 } }
    t.deepEqual(opts, expectedObject, 'should return upper cased method')
    t.end()
  })

  test('should set retry property correctly', (t) => {
    t.test('no property given', (t) => {
      const actualOpts = { method: 'GET' }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 0 } }
      t.deepEqual(opts, expectedObject, 'should return default retry property')
      t.end()
    })

    t.test('invalid property give', (t) => {
      const actualOpts = { method: 'GET', retry: 'one' }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 0 } }
      t.deepEqual(opts, expectedObject, 'should return default retry property')
      t.end()
    })

    t.test('number value for retry given', (t) => {
      const actualOpts = { method: 'GET', retry: 10 }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 10 } }
      t.deepEqual(opts, expectedObject, 'should set retry value, if number')
      t.end()
    })

    t.test('string number value for retry given', (t) => {
      const actualOpts = { method: 'GET', retry: '10' }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 10 } }
      t.deepEqual(opts, expectedObject, 'should set retry value')
      t.end()
    })

    t.test('truthy value for retry given', (t) => {
      const actualOpts = { method: 'GET', retry: {} }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 0 } }
      t.deepEqual(opts, expectedObject, 'should return default retry property')
      t.end()
    })

    t.end()
  })

  test('calls initializeCache module', (t) => {
    const actualOpts = { method: 'GET', cacheManager: true }
    const opts = configureOptions(actualOpts)
    mockCache = (incomingOpts) => {
      const innerExpectedObject = {
        method: 'GET',
        cacheManager: true,
        retry: { retries: 0 }
      }
      t.deepEqual(incomingOpts, innerExpectedObject, 'should have called')
    }
    const expectedObject = {
      method: 'GET',
      cacheManager: true,
      retry: { retries: 0 }
    }
    t.deepEqual(opts, expectedObject)
    t.end()
  })
  t.end()
})
