'use strict'

const CachePolicy = require('http-cache-semantics')
const requireInject = require('require-inject')
const { Request, Response } = require('minipass-fetch')

const { test } = require('tap')

test('should return instance of CachePolicy', (t) => {
  const makePolicy = requireInject('../utils/make-policy', {
    '../utils/iterable-to-object': () => ({})
  })
  const res = new Response('', {})
  const req = new Request('', {})
  const result = makePolicy(req, res)
  t.equal(result instanceof CachePolicy, true)
  t.end()
})

test('should pass objects to CachePolicy', (t) => {
  class MockClass {
    constructor (...args) {
      t.equal(typeof args[0], 'object', 'first argument is an object')
      t.equal(typeof args[1], 'object', 'second argument is an object')
      t.equal(typeof args[2], 'object', 'third argument is an object')
      t.deepEqual(args[2], { shared: false }, 'third argument always same opts')
      const expectedReqObject = {
        url: 'https://nope.com/',
        method: 'GET',
        headers: {}
      }
      t.deepEqual(args[0], expectedReqObject, 'should have expected req shape')
      const expectedResObject = {
        status: 200,
        headers: {}
      }
      t.deepEqual(args[1], expectedResObject, 'should have expected res shape')
    }
  }

  const res = new Response('', {})
  const req = new Request('https://nope.com', {})

  const makePolicy = requireInject('../utils/make-policy', {
    'http-cache-semantics': MockClass,
    '../utils/iterable-to-object': () => ({})
  })
  makePolicy(req, res)
  t.end()
})
