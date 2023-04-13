'use strict'
const dns = require('dns')
const configureOptions = require('../lib/options.js')
const { test } = require('tap')

const defaultDns = { ttl: 5 * 60 * 1000, lookup: dns.lookup }

test('configure options', async (t) => {
  test('supplied with no value', async (t) => {
    const opts = configureOptions()
    const expectedObject = {
      method: 'GET',
      retry: { retries: 0 },
      cache: 'default',
      rejectUnauthorized: true,
      dns: defaultDns,
      cacheAdditionalHeaders: [],
    }
    t.same(opts, expectedObject, 'should return default opts')
  })

  test('supplied with empty object', async (t) => {
    const opts = configureOptions({})
    const expectedObject = {
      method: 'GET',
      retry: { retries: 0 },
      cache: 'default',
      rejectUnauthorized: true,
      dns: defaultDns,
      cacheAdditionalHeaders: [],
    }
    t.same(opts, expectedObject, 'should return default opts')
  })

  test('changes method to upper case', async (t) => {
    const actualOpts = { method: 'post' }
    const opts = configureOptions(actualOpts)
    const expectedObject = {
      method: 'POST',
      retry: { retries: 0 },
      cache: 'default',
      rejectUnauthorized: true,
      dns: defaultDns,
      cacheAdditionalHeaders: [],
    }
    t.same(opts, expectedObject, 'should return upper cased method')
  })

  test('copies strictSSL to rejectUnauthorized', async (t) => {
    const trueOpts = configureOptions({ strictSSL: true })
    const trueExpectedObject = {
      method: 'GET',
      retry: { retries: 0 },
      cache: 'default',
      rejectUnauthorized: true,
      dns: defaultDns,
      cacheAdditionalHeaders: [],
    }
    t.same(trueOpts, trueExpectedObject, 'should return default opts and copy strictSSL')

    const falseOpts = configureOptions({ strictSSL: false })
    const falseExpectedObject = {
      method: 'GET',
      retry: { retries: 0 },
      cache: 'default',
      rejectUnauthorized: false,
      dns: defaultDns,
      cacheAdditionalHeaders: [],
    }
    t.same(falseOpts, falseExpectedObject, 'should return default opts and copy strictSSL')

    const undefinedOpts = configureOptions({ strictSSL: undefined })
    t.same(undefinedOpts, trueExpectedObject,
      'should treat strictSSL: undefined as true just like tls.connect')

    const unsetOpts = configureOptions({ })
    t.same(unsetOpts, trueExpectedObject,
      'should treat unset strictSSL as true just like tls.connect')

    const nullOpts = configureOptions({ strictSSL: null })
    t.same(nullOpts, trueExpectedObject,
      'should treat strictSSL: null as true just like tls.connect')
  })

  test('should set dns property correctly', async (t) => {
    t.test('no property given', async (t) => {
      const actualOpts = { method: 'GET' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 0 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: defaultDns,
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should return default retry property')
    })

    t.test('ttl property given', async (t) => {
      const actualOpts = { method: 'GET', dns: { ttl: 100 } }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 0 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: { ...defaultDns, ttl: 100 },
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should extend default dns with custom ttl')
    })

    t.test('lookup property given', async (t) => {
      const lookup = () => {}
      const actualOpts = { method: 'GET', dns: { lookup } }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 0 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: { ...defaultDns, lookup },
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should extend default dns with custom lookup')
    })
  })

  test('should set retry property correctly', async (t) => {
    t.test('no property given', async (t) => {
      const actualOpts = { method: 'GET' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 0 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: defaultDns,
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should return default retry property')
    })

    t.test('invalid property give', async (t) => {
      const actualOpts = { method: 'GET', retry: 'one' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 0 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: defaultDns,
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should return default retry property')
    })

    t.test('number value for retry given', async (t) => {
      const actualOpts = { method: 'GET', retry: 10 }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 10 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: defaultDns,
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should set retry value, if number')
    })

    t.test('string number value for retry given', async (t) => {
      const actualOpts = { method: 'GET', retry: '10' }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 10 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: defaultDns,
        cacheAdditionalHeaders: [],
      }
      t.same(opts, expectedObject, 'should set retry value')
    })

    t.test('truthy value for retry given', async (t) => {
      const actualOpts = { method: 'GET', retry: {} }
      const opts = configureOptions(actualOpts)
      const expectedObject = {
        method: 'GET',
        retry: { retries: 0 },
        cache: 'default',
        rejectUnauthorized: true,
        dns: defaultDns,
        cacheAdditionalHeaders: [],
      }
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
        dns: defaultDns,
        cacheAdditionalHeaders: [],
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
        dns: defaultDns,
        cacheAdditionalHeaders: [],
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
        cacheAdditionalHeaders: [],
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
        cacheAdditionalHeaders: [],
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
        cacheAdditionalHeaders: [],
      }
      t.match(opts, expectedObject)
    })
  })
})
