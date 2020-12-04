'use strict'

const { Request, Response } = require('minipass-fetch')
const { test } = require('tap')

const iterableToObject = require('../utils/iterable-to-object')

test('supplied with no value', (t) => {
  t.throws(() => iterableToObject(), {}, 'should throw')
  t.end()
})

test('should parse headers of a Request object', (t) => {
  const iterable = new Request('fake.com', { headers: { a: 'a' } })
  const result = iterableToObject(iterable.headers)
  const expectedObject = { a: 'a' }
  t.deepEqual(result, expectedObject, 'should create object from headers')
  t.end()
})

test('should parse headers of a Response object; test object body', (t) => {
  const iterable = new Response({ b: 'b' }, { headers: { a: 'a' } })
  const result = iterableToObject(iterable.headers)
  const expectedObject = {
    'content-type': 'text/plain;charset=UTF-8',
    a: 'a',
  }
  t.equal(typeof result, 'object', 'should generate an object')
  t.deepEqual(result, expectedObject, 'should create object from headers')
  t.end()
})

test('should parse headers of a Response object; test json body', (t) => {
  const iterable = new Response('{ "b": "B" }', { headers: { a: 'a' } })
  const result = iterableToObject(iterable.headers)
  const expectedObject = {
    'content-type': 'text/plain;charset=UTF-8',
    a: 'a',
  }
  t.equal(typeof result, 'object', 'should generate an object')
  t.deepEqual(result, expectedObject, 'should create object from headers')
  t.end()
})
