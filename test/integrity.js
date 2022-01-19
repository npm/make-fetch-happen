'use strict'

const nock = require('nock')
const ssri = require('ssri')
const t = require('tap')
const zlib = require('zlib')

const CACHE = t.testdir()
const CONTENT = Buffer.from('hello, world!', 'utf8')
const CONTENT_GZ = zlib.gzipSync(CONTENT)
const INTEGRITY = ssri.fromData(CONTENT)
const INTEGRITY_GZ = ssri.fromData(CONTENT_GZ)
const HOST = 'https://make-fetch-happen-safely.npm'

const fetch = require('../lib/index.js').defaults({ retry: false })

nock.disableNetConnect()
t.beforeEach(() => nock.cleanAll())

t.test('basic integrity verification', async (t) => {
  const srv = nock(HOST)
    .get('/wowsosafe')
    .reply(200, CONTENT)
    .get('/wowsobad')
    .reply(200, Buffer.from('pwnd'))

  const safetch = fetch.defaults({
    integrity: INTEGRITY,
  })

  const goodRes = await safetch(`${HOST}/wowsosafe`)
  const goodBuf = await goodRes.buffer()
  t.same(goodBuf, CONTENT, 'good content passed scrutiny 👍🏼')

  const badRes = await safetch(`${HOST}/wowsobad`)
  await t.rejects(() => badRes.buffer(), { code: 'EINTEGRITY' })
  t.ok(srv.isDone())
})

t.test('skip integrity verification on error', async (t) => {
  const notFoundError = '{"error": "Not found"}'
  const internalError = '{"error": "Internal server error"}'

  const srv = nock(HOST)
    .get('/notfound')
    .reply(404, Buffer.from(notFoundError))
    .get('/internalerror')
    .reply(500, Buffer.from(internalError))

  const safetch = fetch.defaults({
    integrity: INTEGRITY,
  })

  const notFoundRes = await safetch(`${HOST}/notfound`)
  const notFoundBuf = await notFoundRes.buffer()
  t.same(notFoundBuf, Buffer.from(notFoundError), 'good error message passed through')

  const internalErrorRes = await safetch(`${HOST}/internalerror`)
  const internalErrorBuf = await internalErrorRes.buffer()
  t.same(internalErrorBuf, Buffer.from(internalError), 'good error message passed through')
  t.ok(srv.isDone())
})

t.test('picks the "best" algorithm', async (t) => {
  const integrity = ssri.fromData(CONTENT, {
    algorithms: ['md5', 'sha384', 'sha1', 'sha256'],
  })
  integrity.md5[0].digest = 'badc0ffee'
  integrity.sha1[0].digest = 'badc0ffee'

  const safetch = fetch.defaults({ integrity })

  const srv = nock(HOST)
    .get('/good')
    .times(3)
    .reply(200, CONTENT)
    .get('/bad')
    .reply(200, 'pwnt')

  const goodRes = await safetch(`${HOST}/good`)
  const goodBuf = await goodRes.buffer()
  t.same(goodBuf, CONTENT, 'data passed integrity check')

  const badRes = await safetch(`${HOST}/bad`)
  await t.rejects(() => badRes.buffer(), { code: 'EINTEGRITY' },
    'content validated with either sha256 or sha384 (likely the latter)')

  // invalidate sha384. sha256 is still valid, in theory
  integrity.sha384[0].digest = 'pwnt'
  const bad384Res = await safetch(`${HOST}/good`)
  await t.rejects(() => bad384Res.buffer(), { code: 'EINTEGRITY' },
    'strongest algorithm (sha384) treated as authoritative -- sha256 not used')

  // remove bad sha384 altogether. sha256 remains valid
  delete integrity.sha384
  const no384Res = await safetch(`${HOST}/good`)
  const no384Buf = await no384Res.buffer()
  t.same(no384Buf, CONTENT, 'data passed integrity check with sha256')
  t.ok(srv.isDone())
})

t.test('supports multiple hashes per algorithm', async (t) => {
  const ALTCONTENT = Buffer.from('alt-content is like content but not really')
  const integrity = ssri.fromData(CONTENT, {
    algorithms: ['md5', 'sha384', 'sha1', 'sha256'],
  }).concat(ssri.fromData(ALTCONTENT, {
    algorithms: ['sha384'],
  }))

  const safetch = fetch.defaults({ integrity })
  const srv = nock(HOST)
    .get('/main')
    .reply(200, CONTENT)
    .get('/alt')
    .reply(200, ALTCONTENT)
    .get('/bad')
    .reply(200, 'nope')

  const mainRes = await safetch(`${HOST}/main`)
  const mainBuf = await mainRes.buffer()
  t.same(mainBuf, CONTENT, 'main content validated against sha384')

  const altRes = await safetch(`${HOST}/alt`)
  const altBuf = await altRes.buffer()
  t.same(altBuf, ALTCONTENT, 'alt content validated against sha384')

  const badRes = await safetch(`${HOST}/bad`)
  await t.rejects(() => badRes.buffer(), { code: 'EINTEGRITY' }, 'only the two valid contents pass')
  t.ok(srv.isDone())
})

t.test('checks integrity on cache fetch too', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, { 'content-length': CONTENT.length })
    .get('/test')
    .twice()
    .reply(200, 'nope', { 'content-length': 4 })

  const safetch = fetch.defaults({
    cacheManager: CACHE,
    integrity: INTEGRITY,
    cache: 'no-cache',
  })

  const goodRes = await safetch(`${HOST}/test`)
  const goodBuf = await goodRes.buffer()
  t.same(goodBuf, CONTENT, 'good content passed scrutiny 👍🏼')

  const badRes1 = await safetch(`${HOST}/test`)
  await t.rejects(() => badRes1.buffer(), { code: 'EINTEGRITY' }, 'cached content failed checksum')

  const badRes2 = await safetch(`${HOST}/test`, {
    // try to use local cached version
    cache: 'force-cache',
    integrity: { algorithm: 'sha512', digest: 'doesnotmatch' },
  })
  await t.rejects(() => badRes2.buffer(), { code: 'EINTEGRITY' }, 'cached content failed checksum')
  t.ok(srv.isDone())
})

t.test('basic integrity verification with gzip content', async (t) => {
  const srv = nock(HOST)
    .get('/ungzipped')
    .reply(200, CONTENT_GZ, {
      'Content-Length': CONTENT_GZ.length,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'gzip',
    })
    .get('/gzipped')
    .reply(200, CONTENT_GZ, {
      'Content-Length': CONTENT_GZ.length,
      'Content-Type': 'application/octet-stream',
    })

  // first request is a content-encoding: gzip which minipass-fetch
  // decompresses for us, so the integrity should match that of the
  // decompressed content
  const ungzippedRes = await fetch(`${HOST}/ungzipped`, { integrity: INTEGRITY })
  const ungzippedBuf = await ungzippedRes.buffer()
  t.same(ungzippedBuf, CONTENT, 'receives the decompressed data')

  // second request lacks a content-encoding header, so minipass-fetch
  // will not decompress, which means integrity should match that of
  // the original gzipped content
  const gzippedRes = await fetch(`${HOST}/gzipped`, { integrity: INTEGRITY_GZ })
  const gzippedBuf = await gzippedRes.buffer()
  t.same(gzippedBuf, CONTENT_GZ, 'received the compressed data')
  t.ok(srv.isDone())
})

t.test('skip integrity check for error reponses', async (t) => {
  const srv = nock(HOST)
    .get('/wowforbidden')
    .reply(403, Buffer.from('Forbidden'))

  const safetch = fetch.defaults({
    integrity: INTEGRITY,
  })

  const res = await safetch(`${HOST}/wowforbidden`)
  t.equal(res.status, 403)
  const buf = await res.buffer()
  t.same(buf, Buffer.from('Forbidden'), 'got the body without validating')
  t.ok(srv.isDone())
})
