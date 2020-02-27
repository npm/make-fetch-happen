const { Headers, Request, Response, FetchError } = require('../')
const fetch = require('minipass-fetch')
const { test } = require('tap')

test('exports the same helper classes', t => {
  t.equal(Headers, fetch.Headers)
  t.match(Headers, Function)

  t.equal(Request, fetch.Request)
  t.match(Request, Function)

  t.equal(Response, fetch.Response)
  t.match(Response, Function)

  t.equal(FetchError, fetch.FetchError)
  t.match(FetchError, Function)

  t.end()
})
