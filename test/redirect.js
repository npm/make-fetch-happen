const nock = require('nock')
const t = require('tap')

const fetch = require('../lib/index.js')

const HOST = 'https://local.registry.npm'

t.test('respects redirect limits when not caching', async (t) => {
  const srvOne = nock(HOST)
    .get('/one')
    .times(4)
    .reply(301, null, { location: '/two' })

  const srvTwo = nock(HOST)
    .get('/two')
    .times(2)
    .reply(301, null, { location: '/three' })

  const srvThree = nock(HOST)
    .get('/three')
    .reply(200, 'hello', {
      'content-length': 5,
      'content-type': 'text/plain',
    })

  await t.rejects(fetch(`${HOST}/one`, {
    redirect: 'error',
  }), { code: 'ENOREDIRECT' }, 'rejects when redirect mode is error')

  const manualRes = await fetch(`${HOST}/one`, { redirect: 'manual' })
  t.equal(manualRes.status, 301, 'returned the redirect')
  t.equal(manualRes.headers.get('location'), `${HOST}/two`, 'kept the location header')

  await t.rejects(fetch(`${HOST}/one`, {
    follow: 1,
  }), { code: 'EMAXREDIRECT' }, 'rejects when exceeding follow limit')

  const res = await fetch(`${HOST}/one`)
  t.equal(res.status, 200, 'got to the 200 response')
  const txt = await res.text()
  t.equal(txt, 'hello', 'got the right content')

  t.ok(srvOne.isDone())
  t.ok(srvTwo.isDone())
  t.ok(srvThree.isDone())
})

t.test('respects redirect limits when caching', async (t) => {
  const srvOne = nock(HOST)
    .get('/one')
    .reply(301, null, {
      location: '/two',
      'cache-control': 'max-age=300',
    })

  const srvTwo = nock(HOST)
    .get('/two')
    .reply(301, null, {
      location: '/three',
      'cache-control': 'max-age=300',
    })

  const srvThree = nock(HOST)
    .get('/three')
    .reply(200, 'hello', {
      'content-length': 5,
      'content-type': 'text/plain',
      'cache-control': 'max-age=300',
    })

  const dir = t.testdir()
  await t.rejects(fetch(`${HOST}/one`, {
    cachePath: dir,
    redirect: 'error',
  }), { code: 'ENOREDIRECT' }, 'rejects when redirect mode is error')

  // the above request rejected, but the redirect response gets cached
  // so this request is a cache hit
  const manualRes = await fetch(`${HOST}/one`, { redirect: 'manual', cachePath: dir })
  t.equal(manualRes.status, 301, 'returned the redirect')
  t.equal(manualRes.headers.get('location'), `${HOST}/two`, 'kept the location header')
  t.equal(manualRes.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')

  // this is a hit for /one and a miss for /two
  // both are now cached
  await t.rejects(fetch(`${HOST}/one`, {
    follow: 1,
    cachePath: dir,
  }), { code: 'EMAXREDIRECT' }, 'rejects when exceeding follow limit')

  // cache hit for /one and /two, but ultimately a miss because we didn't have /three
  const res = await fetch(`${HOST}/one`, { cachePath: dir })
  t.equal(res.status, 200, 'got to the 200 response')
  t.equal(res.headers.get('x-local-cache-status'), 'miss', 'got a cache miss')
  const txt = await res.text()
  t.equal(txt, 'hello', 'got the right content')

  // nocks are all finished, from here on all reads are from the cache
  t.ok(srvOne.isDone())
  t.ok(srvTwo.isDone())
  t.ok(srvThree.isDone())

  await t.rejects(fetch(`${HOST}/one`, {
    cachePath: dir,
    redirect: 'error',
  }), { code: 'ENOREDIRECT' }, 'rejects when redirect mode is error')

  const cachedManualRes = await fetch(`${HOST}/one`, { redirect: 'manual', cachePath: dir })
  t.equal(cachedManualRes.status, 301, 'returned the redirect')
  t.equal(cachedManualRes.headers.get('location'), `${HOST}/two`, 'kept the location header')
  t.equal(cachedManualRes.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')

  await t.rejects(fetch(`${HOST}/one`, {
    cachePath: dir,
    follow: 1,
  }), { code: 'EMAXREDIRECT' }, 'rejects when exceeding follow limit')

  const cacheRes = await fetch(`${HOST}/one`, { cachePath: dir })
  t.equal(cacheRes.status, 200, 'got to the 200 response')
  t.equal(cacheRes.headers.get('x-local-cache-status'), 'hit', 'got a cache hit')
  const cacheTxt = await cacheRes.text()
  t.equal(cacheTxt, 'hello', 'got the right content')
})
