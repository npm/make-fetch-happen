const t = require('tap')
const minipassFetch = require('minipass-fetch')

const fetch = require('../lib/index.js')

t.test('exports fetch classes', async (t) => {
  t.equal(fetch.FetchError, minipassFetch.FetchError)
  t.type(fetch.FetchError, Function)

  t.equal(fetch.Headers, minipassFetch.Headers)
  t.type(fetch.Headers, Function)

  t.equal(fetch.Request, minipassFetch.Request)
  t.type(fetch.Request, Function)

  t.equal(fetch.Response, minipassFetch.Response)
  t.type(fetch.Response, Function)
})
