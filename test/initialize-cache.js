'use strict'

const requireInject = require('require-inject')
const { test } = require('tap')

const clone = (opts) => Object.assign({}, opts)

test('initialize cache', (t) => {
  test('supplied with no values', (t) => {
    const initializeCache = requireInject('../utils/initialize-cache', {
      '../utils/is-header-conditional': () => {},
      '../cache': () => {}
    })
    const opts = {}
    initializeCache(opts)
    const expectedObject = { cache: 'default' }
    t.deepEqual(opts, expectedObject)
    t.end()
  })

  test('keep passed in `cache` value', (t) => {
    const initializeCache = requireInject('../utils/initialize-cache', {
      '../utils/is-header-conditional': () => {},
      '../cache': () => {}
    })
    const opts = { cache: 'something' }
    initializeCache(opts)
    const expectedObject = { cache: 'something' }
    t.deepEqual(opts, expectedObject, 'should keep `opts.cache` as what was passed in')
    t.end()
  })

  test('convert string path `cacheManager` into Cache class', (t) => {
    const opts = { cacheManager: 'path/to/cache' }
    let called = false
    const actualOpts = clone(opts)
    const ActualCache = class Cache {}
    const MockCache = class Cache {
      constructor (path, opts) {
        called = true
        t.equal(path, 'path/to/cache', 'should pass path to Cache constructor')
        t.deepEqual(opts, actualOpts, 'should pass opts to Cache constructor')
      }
    }
    const initializeCache = requireInject('../utils/initialize-cache', {
      '../utils/is-header-conditional': () => {},
      '../cache': MockCache
    })

    initializeCache(opts)
    const expectedObject = { cache: 'default', cacheManager: new ActualCache() }
    t.deepEqual(opts, expectedObject, 'should mutate opts passed in')
    t.equal(opts.cacheManager instanceof MockCache, true, 'should return instance of class')
    t.equal(called, true)
    t.end()
  })

  test('keep value of `cacheManager` if not string; likely cache', (t) => {
    class Cache {}
    const expectedCache = new Cache()
    const opts = { cacheManager: expectedCache }
    const actualOpts = clone(opts)
    let called = false
    const initializeCache = requireInject('../utils/initialize-cache', {
      '../utils/is-header-conditional': () => {},
      '../cache': () => {
        called = true
      }
    })

    initializeCache(opts)
    const expectedObject = { cache: 'default', cacheManager: expectedCache }
    t.deepEqual(opts, expectedObject, 'should mutate opts passed in')
    t.equal(actualOpts.cacheManager, opts.cacheManager)
    t.equal(called, false)
    t.end()
  })

  test('internal function isHeaderConditional returns true', (t) => {
    const opts = { cache: 'default' }
    const initializeCache = requireInject('../utils/initialize-cache', {
      '../utils/is-header-conditional': () => true,
      '../cache': class MockCache {}
    })

    initializeCache(opts)
    const expectedObject = { cache: 'no-store' }
    t.deepEqual(opts, expectedObject, 'should set new `cache` value')
    t.end()
  })

  test('internal function isHeaderConditional returns false', (t) => {
    const opts = { cache: 'default' }
    const initializeCache = requireInject('../utils/initialize-cache', {
      '../utils/is-header-conditional': () => false,
      '../cache': class MockCache {}
    })

    initializeCache(opts)
    const expectedObject = { cache: 'default' }
    t.deepEqual(opts, expectedObject, 'should NOT set new `cache` value')
    t.end()
  })

  t.end()
})
