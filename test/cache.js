'use strict'

const { join } = require('path')
const { Request } = require('minipass-fetch')
const cacache = require('cacache')
const fs = require('fs')
const nock = require('nock')
const ssri = require('ssri')
const t = require('tap')
const util = require('util')
const zlib = require('zlib')

const readdir = util.promisify(fs.readdir)

const configureOptions = require('../lib/options.js')
const CachePolicy = require('../lib/cache/policy.js')
const cacheKey = require('../lib/cache/key.js')
const fetch = require('../lib/index.js')

// const CACHE = t.testdir()
const CONTENT = Buffer.from('hello, world!')
const INTEGRITY = ssri.fromData(CONTENT).toString()
const HOST = 'https://local.registry.npm'

const getHeaders = (content) => ({
  'content-type': 'application/octet-stream',
  'content-length': content.length,
  'cache-control': 'max-age=300',
  host: 'local.registry.npm:443',
  date: new Date().toISOString(),
})

nock.disableNetConnect()
t.beforeEach(() => nock.cleanAll())

t.test('storable()', async (t) => {
  const storeOpts = configureOptions({ cachePath: './foo' })
  const noStoreOpts = configureOptions({ cachePath: './foo', cache: 'no-store' })

  const getReq = new Request(`${HOST}/test`)
  const getReqNoCache = new Request(`${HOST}/test`, {
    headers: {
      'cache-control': 'no-store',
    },
  })

  const headReq = new Request(`${HOST}/test`, { method: 'HEAD' })
  const putReq = new Request(`${HOST}/test`, { method: 'PUT' })

  t.equal(CachePolicy.storable(getReq, noStoreOpts), false, 'cache: no-store always returns false')
  t.equal(CachePolicy.storable(getReq, storeOpts), true, 'get requests are storable')
  t.equal(CachePolicy.storable(headReq, storeOpts), true, 'head requests are storable')
  t.equal(CachePolicy.storable(putReq, storeOpts), false, 'put requests are not storable')
  t.equal(CachePolicy.storable(getReqNoCache, storeOpts), false, 'cache-control header in the request is respected')
})

t.test('no match, fetches and replies', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      'x-foo': 'something',
    })

  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const dir = t.testdir()
  const res = await fetch(`${HOST}/test`, { cachePath: dir })
  t.ok(srv.isDone(), 'req is fulfilled')
  t.equal(res.status, 200)
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-stream')
  t.equal(res.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'has cache dir')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'has cache key')
  t.equal(res.headers.get('x-local-cache-mode'), 'buffer', 'should buffer store')
  t.equal(res.headers.get('x-local-cache-status'), 'miss', 'identifies as cache miss')
  t.ok(res.headers.has('x-local-cache-time'), 'has cache time')
  t.equal(res.headers.get('x-foo'), 'something', 'original response has all headers')
  t.notOk(res.headers.has('x-local-cache-hash'), 'hash header is only set when served from cache')

  const dirBeforeRead = await readdir(dir)
  t.same(dirBeforeRead, [], 'should not write to the cache yet')

  const buf = await res.buffer()
  t.same(buf, CONTENT, 'got the correct content')
  const dirAfterRead = await readdir(dir)
  // note, this does not make any assumptions about what directories
  // are in the cache, only that there is something there. this is so
  // our tests do not have to change if cacache version bumps its content
  // and/or index directories
  t.ok(dirAfterRead.length > 0, 'cache has data after consuming the body')

  // compact with a function that always returns false
  // results in a list of all entries in the index
  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 1, 'should only have one entry')
  const entry = entries[0]
  t.equal(entry.integrity, INTEGRITY, 'integrity matches')
  t.equal(entry.metadata.url, `${HOST}/test`, 'url matches')
  t.same(entry.metadata.reqHeaders, {}, 'metadata has no request headers as none are relevant')
  t.same(entry.metadata.resHeaders, {
    'content-type': res.headers.get('content-type'),
    'cache-control': res.headers.get('cache-control'),
    date: res.headers.get('date'),
  }, 'resHeaders has only the relevant headers for caching')
})

t.test('no matches, cache mode only-if-cached rejects', async (t) => {
  const dir = t.testdir()

  await t.rejects(() => fetch(`${HOST}/test`, { cache: 'only-if-cached', cachePath: dir }),
    { code: 'ENOTCACHED' },
    'rejects with the correct error')
})

t.test('cache hit, no revalidation', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, getHeaders(CONTENT))

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const cacheRes = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  await cacheRes.buffer() // drain it immediately so it stores to the cache
  t.ok(srv.isDone(), 'req has fulfilled')

  const res = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'got the right content')
  t.equal(res.status, 200, 'got a 200')
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(res.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(res.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(res.headers.get('x-local-cache-mode'), 'buffer', 'should buffer read')
  t.equal(res.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'has the right hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(res.headers.has('x-local-cache-time'))
})

t.test('cache hit, cache mode reload 304', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const revalidateSrv = nock(HOST, {
    reqHeaders: {
      'if-none-match': '"beefc0ffee"',
    },
  })
    .get('/test')
    .reply(304)

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const cacheRes = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  await cacheRes.buffer() // drain it immediately so it stores to the cache
  t.ok(srv.isDone(), 'first req fulfilled')

  const res = await fetch(`${HOST}/test`, { cachePath: dir, retry: false, cache: 'reload' })
  const buf = await res.buffer()
  t.ok(revalidateSrv.isDone(), 'second req fulfilled')
  t.same(buf, CONTENT, 'got the right content')
  t.equal(res.status, 200, 'got a 200')
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(res.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(res.headers.get('etag'), '"beefc0ffee"', 'kept the etag')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(res.headers.get('x-local-cache-status'), 'revalidated', 'got a cache revalidated')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(res.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'has the right hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(res.headers.has('x-local-cache-time'))

  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 2, 'should have 2 entries')
})

t.test('cache hit, cache mode reload 200', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const revalidateSrv = nock(HOST, {
    reqHeaders: {
      'if-none-match': '"beefc0ffee"',
    },
  })
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefcafe"',
    })

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const cacheRes = await fetch(`${HOST}/test`, { cachePath: dir })
  await cacheRes.buffer() // drain it immediately so it stores to the cache
  t.ok(srv.isDone(), 'first req fulfilled')

  const res = await fetch(`${HOST}/test`, { cachePath: dir, retry: false, cache: 'reload' })
  const buf = await res.buffer()
  t.ok(revalidateSrv.isDone(), 'second req fulfilled')
  t.same(buf, CONTENT, 'got the right content')
  t.equal(res.status, 200, 'got a 200')
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(res.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(res.headers.get('etag'), '"beefcafe"', 'kept the etag')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(res.headers.get('x-local-cache-status'), 'updated', 'got a cache updated')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(res.headers.has('x-local-cache-time'))
  t.notOk(res.headers.has('x-local-cache-hash'), 'does not have a hash')

  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 2, 'should have two entries')
  // because compact returns an array that has been run through reduceRight
  // our newest entry will be the first in the resulting array. make sure we
  // have the newest etag where it belongs
  t.equal(entries[0].metadata.resHeaders.etag, '"beefcafe"', 'new etag takes priority')
})

t.test('cache hit, stale but mode is only-if-cached', async (t) => {
  // rewind time to make cacache put a timestamp in the past
  const now = Date.now()
  const realNow = Date.now
  Date.now = () => {
    return now - (1000 * 60 * 10)
  }
  // restore it in a teardown just in case
  // this test blows up early
  t.teardown(() => {
    Date.now = realNow
  })

  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const initialRes = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  await initialRes.buffer()
  t.ok(srv.isDone())

  // back to the present
  Date.now = realNow

  const revalidateRes = await fetch(`${HOST}/test`, { cachePath: dir, cache: 'only-if-cached' })
  const revalidateBuf = await revalidateRes.buffer()
  t.same(revalidateBuf, CONTENT, 'got the right content')
  t.equal(revalidateRes.status, 200, 'got a 200')
  t.equal(revalidateRes.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(revalidateRes.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(revalidateRes.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(revalidateRes.headers.get('etag'), '"beefc0ffee"', 'kept the etag')
  t.equal(revalidateRes.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(revalidateRes.headers.get('x-local-cache-status'), 'stale', 'got a cache stale')
  t.equal(revalidateRes.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(revalidateRes.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'has the right hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(revalidateRes.headers.has('x-local-cache-time'))

  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 1, 'should have 1 entry')
})

t.test('cache hit, stale but revalidate request fails', async (t) => {
  // rewind time to make cacache put a timestamp in the past
  const now = Date.now()
  const realNow = Date.now
  Date.now = () => {
    return now - (1000 * 60 * 10)
  }
  // restore it in a teardown just in case
  // this test blows up early
  t.teardown(() => {
    Date.now = realNow
  })

  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })
    .get('/test')
    .replyWithError('failed request')

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const initialRes = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  await initialRes.buffer()

  // back to the present
  Date.now = realNow

  const revalidateRes = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  const revalidateBuf = await revalidateRes.buffer()
  t.same(revalidateBuf, CONTENT, 'got the right content')
  t.equal(revalidateRes.status, 200, 'got a 200')
  t.equal(revalidateRes.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(revalidateRes.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(revalidateRes.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(revalidateRes.headers.get('etag'), '"beefc0ffee"', 'kept the etag')
  t.equal(revalidateRes.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(revalidateRes.headers.get('x-local-cache-status'), 'stale', 'got a cache stale')
  t.equal(revalidateRes.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(revalidateRes.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'has the right hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(revalidateRes.headers.has('x-local-cache-time'))

  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 1, 'should have 1 entry')
  t.ok(srv.isDone())
})

t.test('cache hit, stale, revalidate request fails and response has must-revalidate', async (t) => {
  // rewind time to make cacache put a timestamp in the past
  const now = Date.now()
  const realNow = Date.now
  Date.now = () => {
    return now - (1000 * 60 * 10)
  }
  // restore it in a teardown just in case
  // this test blows up early
  t.teardown(() => {
    Date.now = realNow
  })

  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
      'cache-control': 'must-revalidate',
    })
    .get('/test')
    .replyWithError({
      message: 'failed request',
      code: 'ECONNRESET',
    })

  const dir = t.testdir()
  const initialRes = await fetch(`${HOST}/test`, { cachePath: dir, retry: false })
  await initialRes.buffer()

  // back to the present
  Date.now = realNow

  await t.rejects(fetch(`${HOST}/test`, { cachePath: dir, retry: false }), { code: 'ECONNRESET' }, 'rejects with error from request')
  t.ok(srv.isDone())
})

t.test('cache hit, policy requires revalidation', async (t) => {
  // rewind time to make cacache put a timestamp in the past
  const now = Date.now()
  const realNow = Date.now
  Date.now = () => {
    return now - (1000 * 60 * 10)
  }
  // restore it in a teardown just in case
  // this test blows up early
  t.teardown(() => {
    Date.now = realNow
  })

  const initialSrv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const revalidateSrv = nock(HOST, {
    reqHeaders: {
      'if-none-match': '"beefc0ffee"',
    },
  })
    .get('/test')
    .reply(304)

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const initialRes = await fetch(`${HOST}/test`, { cachePath: dir })
  await initialRes.buffer()
  t.ok(initialSrv.isDone())

  // back to the present
  Date.now = realNow

  const revalidateRes = await fetch(`${HOST}/test`, { cachePath: dir })
  const revalidateBuf = await revalidateRes.buffer()
  t.ok(revalidateSrv.isDone())
  t.same(revalidateBuf, CONTENT, 'got the right content')
  t.equal(revalidateRes.status, 200, 'got a 200')
  t.equal(revalidateRes.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(revalidateRes.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(revalidateRes.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(revalidateRes.headers.get('etag'), '"beefc0ffee"', 'kept the etag')
  t.equal(revalidateRes.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(revalidateRes.headers.get('x-local-cache-status'), 'revalidated', 'got a cache revalidated')
  t.equal(revalidateRes.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(revalidateRes.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'has the right hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(revalidateRes.headers.has('x-local-cache-time'))

  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 2, 'should have 2 entries')
})

t.test('cached GET is used for HEAD', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const cacheRes = await fetch(`${HOST}/test`, { cachePath: dir })
  await cacheRes.buffer() // drain it immediately so it stores to the cache
  t.ok(srv.isDone(), 'req has fulfilled')

  const res = await fetch(`${HOST}/test`, { method: 'HEAD', cachePath: dir })
  const buf = await res.buffer()
  t.same(buf, Buffer.from([]), 'got no content')
  t.equal(res.status, 200, 'got a 200')
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(res.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(res.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(res.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'has the right hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(res.headers.has('x-local-cache-time'))
})

t.test('HEAD requests are not stored', async (t) => {
  const srv = nock(HOST)
    .head('/test')
    .reply(200, undefined, getHeaders(CONTENT))

  const dir = t.testdir()
  const res = await fetch(`${HOST}/test`, { method: 'HEAD', cachePath: dir })
  const buf = await res.buffer()
  t.ok(srv.isDone())
  t.equal(res.status, 200, 'got a 200')
  t.same(buf, Buffer.from([]), 'got no body')
  t.equal(res.headers.get('x-local-cache-status'), 'skip', 'did not cache the response')
})

t.test('caches resulting GET after initial redirect', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(301, undefined, {
      location: `${HOST}/final`,
      'cache-control': 'max-age=300',
    })
    .get('/final')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const dir = t.testdir()
  // note: the request to /test will be cached with a status of 303, but
  // the key we cache the content under is the key for /final and that's
  // what will be indicated in the response headers
  const redirectKey = cacheKey(new Request(`${HOST}/test`))
  const reqKey = cacheKey(new Request(`${HOST}/final`))
  const res = await fetch(`${HOST}/test`, { cachePath: dir })
  const buf = await res.buffer()
  t.ok(srv.isDone())
  t.same(buf, CONTENT, 'got the right body')
  t.equal(res.status, 200, 'got a 200')
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(res.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(res.headers.get('x-local-cache-status'), 'miss', 'got a cache hit')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(res.headers.has('x-local-cache-time'))
  t.notOk(res.headers.has('x-local-cache-hash'), 'should not have a hash for initial write')

  const secondRes = await fetch(`${HOST}/test`, { cachePath: dir })
  const secondBuf = await secondRes.buffer()
  t.same(secondBuf, CONTENT, 'got the right body')
  t.equal(secondRes.status, 200, 'got a 200')
  t.equal(secondRes.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(secondRes.headers.get('content-type'), 'application/octet-stream', 'kept content-type')
  t.equal(secondRes.headers.get('content-length'), `${CONTENT.length}`, 'kept content-length')
  t.equal(secondRes.headers.get('x-local-cache'), encodeURIComponent(dir), 'encoded the path')
  t.equal(secondRes.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  t.equal(secondRes.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'got the right cache key')
  t.equal(secondRes.headers.get('x-local-cache-hash'), encodeURIComponent(INTEGRITY), 'got the correct hash')
  // just make sure x-local-cache-time is set, no need to assert its value
  t.ok(secondRes.headers.has('x-local-cache-time'))

  // the redirect itself is cached too
  const redirectRes = await fetch(`${HOST}/test`, { cachePath: dir, redirect: 'manual' })
  t.equal(redirectRes.status, 301, 'got the redirect')
  t.equal(redirectRes.headers.get('location'), `${HOST}/final`, 'kept the location header')
  t.equal(redirectRes.headers.get('x-local-cache-status'), 'hit', 'cache hit')
  t.equal(redirectRes.headers.get('x-local-cache-key'), encodeURIComponent(redirectKey), 'has the correct key')
})

t.test('cache misses when accept header differs', async (t) => {
  const jsonContent = Buffer.from(JSON.stringify({ some: 'data' }))
  const jsonSrv = nock(HOST, {
    reqHeaders: {
      accept: 'application/json',
    },
  })
    .get('/test')
    .reply(200, jsonContent, {
      ...getHeaders(jsonContent),
      'content-type': 'application/json',
    })

  const plainSrv = nock(HOST, {
    reqHeaders: {
      accept: 'application/octet-stream',
    },
  })
    .get('/test')
    .reply(200, CONTENT, getHeaders(CONTENT))

  const dir = t.testdir()
  const jsonRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/json',
    },
  })
  const json = await jsonRes.json()
  t.ok(jsonSrv.isDone())
  t.same(json, { some: 'data' }, 'got the right content')
  t.equal(jsonRes.headers.get('content-type'), 'application/json', 'got the right content type')
  t.equal(jsonRes.headers.get('x-local-cache-status'), 'miss', 'got a miss status')

  const plainRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/octet-stream',
    },
  })
  const plain = await plainRes.buffer()
  t.ok(plainSrv.isDone())
  t.same(plain, CONTENT, 'got the right content')
  t.equal(plainRes.headers.get('content-type'), 'application/octet-stream', 'got the right content type')
  t.equal(plainRes.headers.get('x-local-cache-status'), 'miss', 'got a miss status')
})

t.test('cache hits with the correct content-type', async (t) => {
  const jsonContent = Buffer.from(JSON.stringify({ some: 'data' }))
  const jsonSrv = nock(HOST, {
    reqHeaders: {
      accept: 'application/json',
    },
  })
    .get('/test')
    .reply(200, jsonContent, {
      ...getHeaders(jsonContent),
      etag: '"beef"',
      'content-type': 'application/json',
    })

  const plainSrv = nock(HOST, {
    reqHeaders: {
      accept: 'application/octet-stream',
    },
  })
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"cafe"',
    })

  const fooSrv = nock(HOST, {
    reqHeaders: {
      accept: 'application/x-foo',
    },
  })
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"c0ffee"',
      'content-type': 'application/x-foo',
    })

  const dir = t.testdir()
  const jsonRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/json',
    },
  })
  const json = await jsonRes.json()
  t.ok(jsonSrv.isDone())
  t.same(json, { some: 'data' }, 'got the right content')
  t.equal(jsonRes.headers.get('content-type'), 'application/json', 'got the right content type')
  t.equal(jsonRes.headers.get('x-local-cache-status'), 'miss', 'got a miss status')

  const plainRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/octet-stream',
    },
  })
  const plain = await plainRes.buffer()
  t.ok(plainSrv.isDone())
  t.same(plain, CONTENT, 'got the right content')
  t.equal(plainRes.headers.get('content-type'), 'application/octet-stream', 'got the right content type')
  t.equal(plainRes.headers.get('x-local-cache-status'), 'miss', 'got a miss status')

  const fooRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/x-foo',
    },
  })
  const foo = await fooRes.buffer()
  t.ok(fooSrv.isDone())
  t.same(foo, CONTENT, 'got the right content')
  t.equal(fooRes.headers.get('content-type'), 'application/x-foo', 'got the right content type')
  t.equal(fooRes.headers.get('x-local-cache-status'), 'miss', 'got a miss status')

  const cachedJsonRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/json',
    },
  })
  const cachedJson = await cachedJsonRes.json()
  t.same(cachedJson, { some: 'data' }, 'got the right content')
  t.equal(cachedJsonRes.headers.get('content-type'), 'application/json', 'got the right content type')
  t.equal(cachedJsonRes.headers.get('x-local-cache-status'), 'hit', 'got a hit status')

  const cachedPlainRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/octet-stream',
    },
  })
  const cachedPlain = await cachedPlainRes.buffer()
  t.same(cachedPlain, CONTENT, 'got the right content')
  t.equal(cachedPlainRes.headers.get('content-type'), 'application/octet-stream', 'got the right content type')
  t.equal(cachedPlainRes.headers.get('x-local-cache-status'), 'hit', 'got a hit status')

  const cachedFooRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      accept: 'application/x-foo',
    },
  })
  const cachedFoo = await cachedFooRes.buffer()
  t.same(cachedFoo, CONTENT, 'got the right content')
  t.equal(cachedFooRes.headers.get('content-type'), 'application/x-foo', 'got the right content type')
  t.equal(cachedFooRes.headers.get('x-local-cache-status'), 'hit', 'got a miss status')
})

t.test('large payload switches to streaming mode', async (t) => {
  const desiredSize = 5 * 1024 * 1024 // 5MB, currently hard coded in lib/cache/entry.js
  const count = Math.ceil(desiredSize / CONTENT.length) + 1
  const largeContent = Buffer.from(new Array(count).join(CONTENT))
  const expectedIntegrity = ssri.fromData(largeContent).toString()
  const srv = nock(HOST)
    .get('/test')
    .reply(200, largeContent, {
      ...getHeaders(largeContent),
      etag: '"c0ffeecafe"',
    })

  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const dir = t.testdir()
  const res = await fetch(`${HOST}/test`, { cachePath: dir })
  const buf = await res.buffer()
  t.same(buf, largeContent, 'got the correct content')
  t.ok(srv.isDone(), 'req is fulfilled')
  t.equal(res.status, 200, 'got success status')
  t.equal(res.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(res.headers.get('content-type'), 'application/octet-stream', 'kept content-stream')
  t.equal(res.headers.get('content-length'), `${largeContent.length}`, 'kept content-length')
  t.equal(res.headers.get('x-local-cache'), encodeURIComponent(dir), 'has cache dir')
  t.equal(res.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'has cache key')
  t.equal(res.headers.get('x-local-cache-mode'), 'stream', 'used a stream to store')
  t.equal(res.headers.get('x-local-cache-status'), 'miss', 'identifies as cache miss')
  t.ok(res.headers.has('x-local-cache-time'), 'has cache time')
  t.notOk(res.headers.has('x-local-cache-hash'), 'hash header is only set when served from cache')

  const cachedRes = await fetch(`${HOST}/test`, { cachePath: dir })
  const cachedBuf = await cachedRes.buffer()
  t.equal(cachedRes.status, 200, 'got success status')
  t.same(cachedBuf, largeContent, 'got the correct content')
  t.equal(cachedRes.headers.get('cache-control'), 'max-age=300', 'kept cache-control')
  t.equal(cachedRes.headers.get('content-type'), 'application/octet-stream', 'kept content-stream')
  t.equal(cachedRes.headers.get('content-length'), `${largeContent.length}`, 'kept content-length')
  t.equal(cachedRes.headers.get('x-local-cache'), encodeURIComponent(dir), 'has cache dir')
  t.equal(cachedRes.headers.get('x-local-cache-hash'), encodeURIComponent(expectedIntegrity), 'hash header is only set when served from cache')
  t.equal(cachedRes.headers.get('x-local-cache-key'), encodeURIComponent(reqKey), 'has cache key')
  t.equal(cachedRes.headers.get('x-local-cache-mode'), 'stream', 'used a stream to respond')
  t.equal(cachedRes.headers.get('x-local-cache-status'), 'hit', 'identifies as cache hit')
  t.ok(cachedRes.headers.has('x-local-cache-time'), 'has cache time')
})

t.test('errors streaming from cache propagate to request', async (t) => {
  const desiredSize = 5 * 1024 * 1024 // 5MB, currently hard coded in lib/cache/entry.js
  const count = Math.ceil(desiredSize / CONTENT.length) + 1
  const largeContent = Buffer.from(new Array(count).join(CONTENT))
  const srv = nock(HOST)
    .get('/test')
    .reply(200, largeContent, {
      ...getHeaders(largeContent),
      etag: '"c0ffeecafe"',
    })

  const dir = t.testdir()
  const res = await fetch(`${HOST}/test`, { cachePath: dir })
  const buf = await res.buffer()
  t.same(buf, largeContent, 'got the correct content')
  t.ok(srv.isDone(), 'req is fulfilled')
  t.equal(res.status, 200, 'got success status')
  t.equal(res.headers.get('x-local-cache-mode'), 'stream', 'used a stream to store')
  t.equal(res.headers.get('x-local-cache-status'), 'miss', 'identifies as cache miss')

  const hexIntegrity = ssri.fromData(largeContent).hexDigest()
  const cachedContent = join(dir, 'content-v2', 'sha512', hexIntegrity.slice(0, 2), hexIntegrity.slice(2, 4), hexIntegrity.slice(4))
  t.ok(fs.existsSync(cachedContent), 'cache file is present')
  // delete the real content, and write garbage in its place
  fs.unlinkSync(cachedContent)
  fs.writeFileSync(cachedContent, 'invalid data', { flag: 'wx' })

  const cachedRes = await fetch(`${HOST}/test`, { cachePath: dir })
  t.equal(cachedRes.status, 200, 'got success status')
  t.equal(cachedRes.headers.get('x-local-cache-mode'), 'stream', 'used a stream to respond')
  t.equal(cachedRes.headers.get('x-local-cache-status'), 'hit', 'identifies as cache hit')
  await t.rejects(cachedRes.buffer(), { code: 'EINTEGRITY' }, 'rejects when consuming body')
})

t.test('errors reading from cache propagate to request', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beefc0ffee"',
    })

  const dir = t.testdir()
  const cacheRes = await fetch(`${HOST}/test`, { cachePath: dir })
  await cacheRes.buffer() // drain it immediately so it stores to the cache
  t.ok(srv.isDone(), 'req has fulfilled')

  const hexIntegrity = ssri.fromData(CONTENT).hexDigest()
  const cachedContent = join(dir, 'content-v2', 'sha512', hexIntegrity.slice(0, 2), hexIntegrity.slice(2, 4), hexIntegrity.slice(4))
  t.ok(fs.existsSync(cachedContent), 'cache file is present')
  // delete the real content, and write garbage in its place
  fs.unlinkSync(cachedContent)
  fs.writeFileSync(cachedContent, 'invalid data', { flag: 'wx' })

  const res = await fetch(`${HOST}/test`, { cachePath: dir })
  t.equal(res.status, 200, 'got a success response')
  t.equal(res.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  await t.rejects(res.buffer(), { code: 'EINTEGRITY' }, 'consuming payload rejects')
})

t.test('keeps encoding headers when compress is disabled', async (t) => {
  const gzippedContent = zlib.gzipSync(CONTENT)
  const srv = nock(HOST)
    .get('/test')
    .reply(200, gzippedContent, {
      ...getHeaders(gzippedContent),
      etag: '"c0ffee"',
      'content-encoding': 'gzip',
    })
    .get('/test')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"c0ffee"',
    })

  const dir = t.testdir()
  const cacheRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    compress: false,
    headers: {
      'accept-encoding': 'gzip',
    },
  })
  const cacheBuf = await cacheRes.buffer()
  t.same(cacheBuf, gzippedContent, 'returned the gzipped content')
  t.equal(cacheRes.status, 200, 'got a success response')
  t.equal(cacheRes.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  t.equal(cacheRes.headers.get('content-encoding'), 'gzip', 'kept content-encoding')

  const res = await fetch(`${HOST}/test`, {
    cachePath: dir,
    compress: false,
    headers: {
      'accept-encoding': 'gzip',
    },
  })
  const buf = await res.buffer()
  t.same(buf, gzippedContent, 'returned the gzipped content')
  t.equal(res.status, 200, 'got a success response')
  t.equal(res.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  t.equal(res.headers.get('content-encoding'), 'gzip', 'kept content-encoding')

  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 1, 'cache has one entry')
  t.equal(entries[0].metadata.reqHeaders['accept-encoding'], 'gzip', 'kept the request header')
  t.equal(entries[0].metadata.resHeaders['content-encoding'], 'gzip', 'kept the response header')

  const compressRes = await fetch(`${HOST}/test`, { cachePath: dir })
  const compressBuf = await compressRes.buffer()
  t.same(compressBuf, CONTENT, 'got the expected content')
  t.equal(compressRes.status, 200, 'got a success')
  t.equal(compressRes.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  t.notOk(compressRes.headers.has('content-encoding'), 'did not get a content-encoding header')

  const newEntries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(newEntries.length, 2, 'cache now has two entries')
  t.ok(srv.isDone())
})

t.test('handles vary header correctly', async (t) => {
  const enContent = Buffer.from('hello')
  const esContent = Buffer.from('hola')

  const enSrv = nock(HOST, {
    reqHeaders: {
      'accept-language': 'en',
    },
  })
    .get('/test')
    .reply(200, enContent, {
      ...getHeaders(enContent),
      etag: '"beef"',
      'content-language': 'en',
      vary: 'accept-language',
    })

  const esSrv = nock(HOST, {
    reqHeaders: {
      'accept-language': 'es',
    },
  })
    .get('/test')
    .reply(200, esContent, {
      ...getHeaders(esContent),
      etag: '"cafe"',
      'content-language': 'es',
      vary: 'accept-language',
    })

  const dir = t.testdir()
  const enInitialRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      'accept-language': 'en',
    },
  })
  t.equal(enInitialRes.status, 200, 'got a success status')
  t.equal(enInitialRes.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  t.equal(enInitialRes.headers.get('content-language'), 'en', 'kept content-language')
  const enInitialBuf = await enInitialRes.buffer()
  t.same(enInitialBuf, enContent, 'got the right content')
  t.ok(enSrv.isDone())

  const esInitialRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      'accept-language': 'es',
    },
  })
  t.equal(esInitialRes.status, 200, 'got a success status')
  t.equal(esInitialRes.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  t.equal(esInitialRes.headers.get('content-language'), 'es', 'kept content-language')
  const esInitialBuf = await esInitialRes.buffer()
  t.same(esInitialBuf, esContent, 'got the right content')
  t.ok(esSrv.isDone())

  const enCachedRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      'accept-language': 'en',
    },
  })
  t.equal(enCachedRes.status, 200, 'got success status')
  t.equal(enCachedRes.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  t.equal(enCachedRes.headers.get('content-language'), 'en', 'got the right content-language')
  const enCachedBuf = await enCachedRes.buffer()
  t.same(enCachedBuf, enContent, 'got the right content')

  const esCachedRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      'accept-language': 'es',
    },
  })
  t.equal(esCachedRes.status, 200, 'got success status')
  t.equal(esCachedRes.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  t.equal(esCachedRes.headers.get('content-language'), 'es', 'got the right content-language')
  const esCachedBuf = await esCachedRes.buffer()
  t.same(esCachedBuf, esContent, 'got the right content')
})

t.test('cache misses when urls match but host header differs', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .twice()
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      etag: '"beef"',
    })

  const dir = t.testdir()
  const reqKey = cacheKey(new Request(`${HOST}/test`))
  const initialRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      host: 'foo.bar:443',
    },
  })
  t.equal(initialRes.status, 200, 'got a 200')
  t.equal(initialRes.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  const initialBuf = await initialRes.buffer()
  t.same(initialBuf, CONTENT, 'got the right content')

  const secondRes = await fetch(`${HOST}/test`, {
    cachePath: dir,
    headers: {
      host: 'bar.baz:443',
    },
  })
  t.equal(secondRes.status, 200, 'got a 200')
  t.equal(secondRes.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  const secondBuf = await secondRes.buffer()
  t.same(secondBuf, CONTENT, 'got the right content')

  const entries = await cacache.index.compact(dir, reqKey, () => false)
  t.equal(entries.length, 2, 'should have two entries')
  // entries are newest first
  t.equal(entries[0].metadata.reqHeaders.host, 'bar.baz:443', 'host header was saved')
  t.equal(entries[1].metadata.reqHeaders.host, 'foo.bar:443', 'host header was saved')

  t.ok(srv.isDone())
})

t.test('vary headers in response correctly store the request headers in cache', async (t) => {
  const srv = nock(HOST)
    .get('/star')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      vary: '*',
    })
    .get('/foo')
    .reply(200, CONTENT, {
      ...getHeaders(CONTENT),
      vary: 'x-foo',
    })

  const dir = t.testdir()

  const starKey = cacheKey(new Request(`${HOST}/star`))
  const starRes = await fetch(`${HOST}/star`, {
    cachePath: dir,
    headers: {
      'x-foo': 'bar',
    },
  })
  t.equal(starRes.status, 200, 'got success response')
  t.equal(starRes.headers.get('x-local-cache-status'), 'miss', 'cache misses')
  const starBuf = await starRes.buffer()
  t.same(starBuf, CONTENT, 'got the correct content')

  const starEntries = await cacache.index.compact(dir, starKey, () => false)
  t.equal(starEntries.length, 1, 'has one entry')
  t.equal(starEntries[0].metadata.reqHeaders['x-foo'], undefined, 'did not keep x-foo')

  const fooKey = cacheKey(new Request(`${HOST}/foo`))
  const fooRes = await fetch(`${HOST}/foo`, {
    cachePath: dir,
    headers: {
      'x-foo': 'bar',
    },
  })
  t.equal(fooRes.status, 200, 'got success response')
  t.equal(fooRes.headers.get('x-local-cache-status'), 'miss', 'cache misses')
  const fooBuf = await fooRes.buffer()
  t.same(fooBuf, CONTENT, 'got the correct content')

  const fooEntries = await cacache.index.compact(dir, fooKey, () => false)
  t.equal(fooEntries.length, 1, 'has one entry')
  t.equal(fooEntries[0].metadata.reqHeaders['x-foo'], 'bar', 'did keep x-foo')
  t.ok(srv.isDone())
})
