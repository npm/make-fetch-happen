'use strict'

const nock = require('nock')
const t = require('tap')
const zlib = require('zlib')

const fetch = require('../lib/index.js')

const HOST = 'http://example.com'
const CONTENT = Buffer.from('hello, world!')
const CONTENT_GZIP = zlib.gzipSync(CONTENT)

const getHeaders = (content) => ({
  'content-type': 'text/plain',
  'content-length': content.length,
  'cache-control': 'max-age=300',
  host: (new URL(HOST)).host,
  date: new Date().toISOString(),
})

nock.disableNetConnect()

t.test('separate caches', async (t) => {
  setupNock(t)

  for (const compress of [false, true]) {
    await t.test(`{compress: ${compress}}`, async (t) => {
      // isolate cache to each test condition
      await makeRequests(t, {
        cachePath: t.testdir(),
        compress,
      })
    })
  }
})

t.test('shared cache', async (t) => {
  setupNock(t)

  // test conditions share a cache
  const cachePath = t.testdir()

  for (const compress of [false, true]) {
    await t.test(`{compress: ${compress}}`, async (t) => {
      await makeRequests(t, {
        cachePath,
        compress,
      })
    })
  }
})

function setupNock (t) {
  // both of these nock interceptors use .persist() to make test results easier
  // to interpret across codebase states that pass vs. fail.  the point is to
  // test the caching and revalidation behaviour itself, and without
  // .persist(), failing caching behaviour compounds into unaligned nock
  // requests.
  //
  // responds to non-revalidation requests
  nock(HOST, {
    reqHeaders: {
      'accept-encoding': 'gzip',
    },
    badheaders: ['if-none-match'],
  })
    .persist()
    .get('/test')
    .reply(200, CONTENT_GZIP, {
      ...getHeaders(CONTENT_GZIP),
      'content-encoding': 'gzip',
      etag: '"0xBADCAFE"',
    })

  // responds only to revalidation requests
  nock(HOST, {
    reqHeaders: {
      'accept-encoding': 'gzip',
      'if-none-match': '"0xBADCAFE"',
    },
  })
    .persist()
    .get('/test')
    .reply(304)

  t.teardown(nock.cleanAll)
}

async function makeRequests (t, options) {
  const {cachePath, compress} = options

  for (const trial of [1, 2, 3]) {
    await t.test(`request ${trial}`, async (t) => {
      const res = await fetch(`${HOST}/test`, {
        cachePath,
        cache: 'no-cache',
        compress,
        headers: {
          'accept-encoding': 'gzip',
        },
      })

      const cacheStatus = trial === 1 ? 'miss' : 'revalidated'

      const buf = await res.buffer()
      t.same(buf, compress ? CONTENT : CONTENT_GZIP, `content is ${compress ? 'uncompressed' : 'compressed'}`)
      t.equal(res.status, 200, 'status 200')
      t.equal(res.headers.get('x-local-cache-status'), cacheStatus, `cache ${cacheStatus}`)
      t.ok(res.headers.has('content-encoding'), 'content-encoding present')
      t.equal(res.headers.get('content-encoding'), 'gzip', 'content-encoding: gzip (a known lie when {compress: true})')
      t.equal(res.headers.get('content-type'), 'text/plain', 'content-type: text/plain')
    })
  }
}
