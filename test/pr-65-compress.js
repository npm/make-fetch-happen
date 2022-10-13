'use strict'

const { join } = require('path')
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
  const { misses, revalidations } = setupNock(t)

  // isolate cache to each test condition
  const cacheRoot = t.testdir({
    compress: {},
    noCompress: {},
  })

  t.comment('{compress: false}')
  let cachePath = join(cacheRoot, 'noCompress')
  await assertRequest(t, { cachePath, compress: false },
    { status: 'miss', body: CONTENT_GZIP })
  await assertRequest(t, { cachePath, compress: false },
    { status: 'revalidated', body: CONTENT_GZIP })
  await assertRequest(t, { cachePath, compress: false },
    { status: 'revalidated', body: CONTENT_GZIP })

  t.comment('{compress: true}')
  cachePath = join(cacheRoot, 'compress')
  await assertRequest(t, { cachePath, compress: true }, { status: 'miss', body: CONTENT })
  await assertRequest(t, { cachePath, compress: true }, { status: 'revalidated', body: CONTENT })
  await assertRequest(t, { cachePath, compress: true }, { status: 'revalidated', body: CONTENT })

  t.equal(misses(), 2, 'nock intercepted 2 misses')
  t.equal(revalidations(), 4, 'nock intercepted 4 revalidations')
})

t.test('shared cache', async (t) => {
  const { misses, revalidations } = setupNock(t)

  // test conditions share a cache
  const cachePath = t.testdir()

  t.comment('{compress: false}')
  await assertRequest(t, { cachePath, compress: false },
    { status: 'miss', body: CONTENT_GZIP })
  await assertRequest(t, { cachePath, compress: false },
    { status: 'revalidated', body: CONTENT_GZIP })
  await assertRequest(t, { cachePath, compress: false },
    { status: 'revalidated', body: CONTENT_GZIP })

  t.comment('{compress: true}')
  await assertRequest(t, { cachePath, compress: true }, { status: 'miss', body: CONTENT })
  await assertRequest(t, { cachePath, compress: true }, { status: 'revalidated', body: CONTENT })
  await assertRequest(t, { cachePath, compress: true }, { status: 'revalidated', body: CONTENT })

  t.equal(misses(), 2, 'nock intercepted 2 misses')
  t.equal(revalidations(), 4, 'nock intercepted 4 revalidations')
})

t.test('shared cache, miss due to different accept-encoding', async (t) => {
  const { misses, revalidations } = setupNock(t)

  // test conditions share a cache and compress value
  const cachePath = t.testdir()
  const compress = true

  t.comment('{accept-encoding: gzip}')
  await assertRequest(t, { cachePath, compress, headers: { 'accept-encoding': 'gzip' } },
    { status: 'miss', body: CONTENT })
  await assertRequest(t, { cachePath, compress, headers: { 'accept-encoding': 'gzip' } },
    { status: 'revalidated', body: CONTENT })
  await assertRequest(t, { cachePath, compress, headers: { 'accept-encoding': 'gzip' } },
    { status: 'revalidated', body: CONTENT })

  t.comment('{accept-encoding: gzip,deflate}')
  await assertRequest(t, { cachePath, compress, headers: { 'accept-encoding': 'gzip,deflate' } },
    { status: 'miss', body: CONTENT })
  await assertRequest(t, { cachePath, compress, headers: { 'accept-encoding': 'gzip,deflate' } },
    { status: 'revalidated', body: CONTENT })
  await assertRequest(t, { cachePath, compress, headers: { 'accept-encoding': 'gzip,deflate' } },
    { status: 'revalidated', body: CONTENT })

  t.equal(misses(), 2, 'nock intercepted 2 misses')
  t.equal(revalidations(), 4, 'nock intercepted 4 revalidations')
})

function setupNock (t) {
  // both of these nock interceptors use .persist() to make test results easier
  // to interpret across codebase states that pass vs. fail.  the point is to
  // test the caching and revalidation behaviour itself, and without
  // .persist(), failing caching behaviour compounds into unaligned nock
  // requests.
  //
  // responds to non-revalidation requests
  const missInterceptor = nock(HOST, {
    reqHeaders: {
      'accept-encoding': /gzip/,
    },
    badheaders: ['if-none-match'],
  })
    .persist()
    .get('/test')

  missInterceptor.reply(200, CONTENT_GZIP, {
    ...getHeaders(CONTENT_GZIP),
    'content-encoding': 'gzip',
    etag: '"0xBADCAFE"',
  })

  // responds only to revalidation requests
  const revalidationInterceptor = nock(HOST, {
    reqHeaders: {
      'accept-encoding': /gzip/,
      'if-none-match': '"0xBADCAFE"',
    },
  })
    .persist()
    .get('/test')

  revalidationInterceptor.reply(304)

  t.teardown(nock.cleanAll)

  return {
    misses: () => missInterceptor.interceptionCounter,
    revalidations: () => revalidationInterceptor.interceptionCounter,
  }
}

async function assertRequest (t, options, expected) {
  const { cachePath, compress, headers } = options

  const res = await fetch(`${HOST}/test`, {
    cachePath,
    cache: 'no-cache',
    compress,
    headers: {
      'accept-encoding': 'gzip',
      ...headers,
    },
  })

  t.equal(res.status, 200, 'status 200')
  t.equal(res.headers.get('x-local-cache-status'), expected.status, `cache ${expected.status}`)
  t.ok(res.headers.has('content-encoding'), 'content-encoding present')
  t.equal(res.headers.get('content-encoding'), 'gzip',
    'content-encoding: gzip (a known lie when {compress: true})')
  t.equal(res.headers.get('content-type'), 'text/plain', 'content-type: text/plain')

  const buf = await res.buffer()
  t.same(buf, expected.body, `content is as expected`)
}
