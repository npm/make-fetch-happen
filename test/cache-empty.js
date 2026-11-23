'use strict'

const { join } = require('path')
const cacache = require('cacache')
const nock = require('nock')
const ssri = require('ssri')
const t = require('tap')
const zlib = require('zlib')
const fetch = require('../lib/index.js')
const cacheKey = require('../lib/cache/key.js')

const HOST = 'https://empty.registry.npm'
const EMPTY = Buffer.alloc(0)
const EMPTY_INTEGRITY = ssri.fromData(EMPTY).toString()

nock.disableNetConnect()
t.beforeEach(() => nock.cleanAll())

for (const scenario of [
  { name: 'with Content-Length', headers: { 'content-length': '0' } },
  { name: 'without Content-Length', headers: {} },
  { name: 'with an integrity check', headers: {}, integrity: EMPTY_INTEGRITY },
  { name: 'after gzip decoding', body: zlib.gzipSync(EMPTY), headers: { 'content-encoding': 'gzip' } },
]) {
  t.test(`caches an empty GET ${scenario.name}`, async t => {
    const request = nock(HOST)
      .get('/empty')
      .reply(200, scenario.body || EMPTY, {
        'cache-control': 'max-age=300',
        ...scenario.headers,
      })
    const options = { cachePath: t.testdir(), integrity: scenario.integrity }
    const response = await fetch(`${HOST}/empty`, options)
    const integrities = []
    const sizes = []
    response.body.on('integrity', value => integrities.push(value.toString()))
    response.body.on('size', value => sizes.push(value))
    t.same(await response.buffer(), EMPTY, 'consumes the empty response')
    t.ok(request.isDone(), 'fetched the response once')
    t.equal(response.headers.get('x-local-cache-status'), 'miss')
    t.same(integrities, [EMPTY_INTEGRITY], 'emits the empty body digest')
    t.same(sizes, [0], 'emits the empty body size')

    const entry = await cacache.get.info(options.cachePath, cacheKey(new fetch.Request(`${HOST}/empty`)))
    t.equal(entry.size, 0, 'stores zero bytes')
    t.equal(entry.integrity, EMPTY_INTEGRITY, 'stores the correct digest')

    const cached = await fetch(`${HOST}/empty`, { ...options, cache: 'only-if-cached' })
    t.equal(cached.headers.get('x-local-cache-status'), 'hit', 'can read without a network request')
    t.same(await cached.buffer(), EMPTY, 'cached body is empty')
    t.equal(cached.headers.get('content-length'), '0')
  })
}

t.test('rejects an empty body with the wrong integrity', async t => {
  const request = nock(HOST).get('/empty').reply(200, EMPTY, { 'cache-control': 'max-age=300' })
  const cachePath = t.testdir()
  const response = await fetch(`${HOST}/empty`, { cachePath, integrity: ssri.fromData('not empty').toString() })
  await t.rejects(response.buffer(), { code: 'EINTEGRITY' })
  t.ok(request.isDone())
  t.notOk(await cacache.get.info(cachePath, cacheKey(new fetch.Request(`${HOST}/empty`))), 'does not cache a bad body')
})

t.test('reports a cache write error for an empty body', async t => {
  const request = nock(HOST).get('/empty').reply(200, EMPTY, { 'cache-control': 'max-age=300' })
  const cachePath = join(t.testdir({ blocked: 'not a directory' }), 'blocked')
  const response = await fetch(`${HOST}/empty`, { cachePath })
  await t.rejects(response.buffer(), { code: 'EEXIST' })
  t.ok(request.isDone())
})

t.test('revalidates an empty cached GET', async t => {
  const request = nock(HOST)
    .get('/empty')
    .reply(200, EMPTY, { 'cache-control': 'max-age=0', etag: '"empty"' })
    .get('/empty')
    .matchHeader('if-none-match', '"empty"')
    .reply(304, undefined, { 'cache-control': 'max-age=300', etag: '"empty"' })
  const options = { cachePath: t.testdir() }
  const first = await fetch(`${HOST}/empty`, options)
  t.same(await first.buffer(), EMPTY)
  const revalidated = await fetch(`${HOST}/empty`, options)
  t.equal(revalidated.headers.get('x-local-cache-status'), 'revalidated')
  t.same(await revalidated.buffer(), EMPTY)
  const cached = await fetch(`${HOST}/empty`, { ...options, cache: 'only-if-cached' })
  t.equal(cached.headers.get('x-local-cache-status'), 'hit')
  t.same(await cached.buffer(), EMPTY)
  t.ok(request.isDone())
})

t.test('can use an empty cached GET when revalidation fails', async t => {
  const request = nock(HOST)
    .get('/empty')
    .reply(200, EMPTY, { 'cache-control': 'max-age=0', etag: '"empty"' })
    .get('/empty')
    .replyWithError({ code: 'ECONNREFUSED' })
  const options = { cachePath: t.testdir() }
  const first = await fetch(`${HOST}/empty`, options)
  t.same(await first.buffer(), EMPTY)
  const stale = await fetch(`${HOST}/empty`, options)
  t.equal(stale.headers.get('x-local-cache-status'), 'stale')
  t.same(await stale.buffer(), EMPTY)
  t.ok(request.isDone())
})
