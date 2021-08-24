'use strict'

const configureOptions = require('../lib/options.js')
const { test } = require('tap')

test('configure options', async (t) => {
  test('supplied with no value', async (t) => {
    const opts = configureOptions()
    const expectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
    t.same(opts, expectedObject, 'should return default opts')
  })

  test('supplied with empty object', async (t) => {
    const opts = configureOptions({})
    const expectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
    t.same(opts, expectedObject, 'should return default opts')
  })

  test('changes method to upper case', async (t) => {
    const actualOpts = { method: 'post' }
    const opts = configureOptions(actualOpts)
    const expectedObject = { method: 'POST', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
    t.same(opts, expectedObject, 'should return upper cased method')
  })

  test('copies strictSSL to rejectUnauthorized', async (t) => {
    const trueOpts = configureOptions({ strictSSL: true })
    const trueExpectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
    t.same(trueOpts, trueExpectedObject, 'should return default opts and copy strictSSL')

    const falseOpts = configureOptions({ strictSSL: false })
    const falseExpectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: false }
    t.same(falseOpts, falseExpectedObject, 'should return default opts and copy strictSSL')

    const undefinedOpts = configureOptions({ strictSSL: undefined })
    t.same(undefinedOpts, trueExpectedObject, 'should treat strictSSL: undefined as true just like tls.connect')

    const unsetOpts = configureOptions({ })
    t.same(unsetOpts, trueExpectedObject, 'should treat unset strictSSL as true just like tls.connect')

    const nullOpts = configureOptions({ strictSSL: null })
    t.same(nullOpts, trueExpectedObject, 'should treat strictSSL: null as true just like tls.connect')
  })

  test('should set retry property correctly', async (t) => {
    t.test('no property given', async (t) => {
      const actualOpts = { method: 'GET' }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
      t.same(opts, expectedObject, 'should return default retry property')
    })

    t.test('invalid property give', async (t) => {
      const actualOpts = { method: 'GET', retry: 'one' }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
      t.same(opts, expectedObject, 'should return default retry property')
    })

    t.test('number value for retry given', async (t) => {
      const actualOpts = { method: 'GET', retry: 10 }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 10 }, cache: 'default', rejectUnauthorized: true }
      t.same(opts, expectedObject, 'should set retry value, if number')
    })

    t.test('string number value for retry given', async (t) => {
      const actualOpts = { method: 'GET', retry: '10' }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 10 }, cache: 'default', rejectUnauthorized: true }
      t.same(opts, expectedObject, 'should set retry value')
    })

    t.test('truthy value for retry given', async (t) => {
      const actualOpts = { method: 'GET', retry: {} }
      const opts = configureOptions(actualOpts)
      const expectedObject = { method: 'GET', retry: { retries: 0 }, cache: 'default', rejectUnauthorized: true }
      t.same(opts, expectedObject, 'should return default retry property')
    })
  })

  test('configures cache correctly', async (t) => {
    t.test('supplied with no values', async (t) => {
      const actualOpts = {}
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        rejectUnauthorized: true,
        retry: { retries: 0 },
        cache: 'default',
      }
      t.same(opts, expectedObject, 'should set the default cache')
    })

    t.test('keeps provided cache value', async (t) => {
      const actualOpts = { cache: 'something' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        rejectUnauthorized: true,
        retry: { retries: 0 },
        cache: 'something',
      }
      t.same(opts, expectedObject, 'should keep the provided cache')
    })

    t.test('initializes cacheManager', async (t) => {
      const actualOpts = { method: 'GET', cachePath: './foo' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        rejectUnauthorized: true,
        retry: { retries: 0 },
        cache: 'default',
        cachePath: './foo',
      }
      t.match(opts, expectedObject)
    })

    t.test('copies cacheManager to cachePath if cachePath is not set', async (t) => {
      const actualOpts = { method: 'GET', cacheManager: './foo' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        rejectUnauthorized: true,
        retry: { retries: 0 },
        cache: 'default',
        cachePath: './foo',
        cacheManager: './foo',
      }
      t.match(opts, expectedObject)
    })

    t.test('including a conditional header sets cache to no-store', async (t) => {
      const actualOpts = { method: 'GET', headers: { 'if-none-match': '"notarealetag"' } }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        rejectUnauthorized: true,
        retry: { retries: 0 },
        cache: 'no-store',
      }
      t.match(opts, expectedObject)
    })
  })
})
