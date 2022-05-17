'use strict'

const events = require('events')
const nock = require('nock')
const ssri = require('ssri')
const t = require('tap')

const fetch = require('../lib/index.js')

const CONTENT = Buffer.from('hello, world!', { encoding: 'utf8' })
const HOST = 'https://make-fetch-happen.npm'

nock.disableNetConnect()
t.beforeEach(() => {
  nock.cleanAll()
})

t.test('emits integrity and size events', t => {
  t.test('when response is cacheable', async t => {
    const INTEGRITY = ssri.fromData(CONTENT)
    const CACHE = t.testdir()
    const srv = nock(HOST)
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/test`, { cachePath: CACHE })
    t.equal(res.status, 200, 'successful status code')
    t.equal(res.headers.get('x-local-cache-status'), 'miss', 'is a cache miss')
    t.equal(res.body.hasIntegrityEmitter, true, 'flag is set on body')
    const gotIntegrity = events.once(res.body, 'integrity').then(i => i[0])
    const gotSize = events.once(res.body, 'size').then(s => s[0])
    const [integrity, size, buf] = await Promise.all([gotIntegrity, gotSize, res.buffer()])
    t.same(buf, CONTENT, 'request succeeded')
    t.same(integrity, INTEGRITY, 'got the right integrity')
    t.same(size, CONTENT.byteLength, 'got the right size')
    t.ok(srv.isDone())
  })

  t.test('when expected integrity is provided', async t => {
    const INTEGRITY = ssri.fromData(CONTENT)
    const srv = nock(HOST)
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/test`, { integrity: INTEGRITY })
    t.equal(res.status, 200, 'successful status code')
    t.notOk(res.headers.has('x-local-cache-status'), 'should not touch the cache')
    t.equal(res.body.hasIntegrityEmitter, true, 'flag is set on body')
    const gotIntegrity = events.once(res.body, 'integrity').then(i => i[0])
    const gotSize = events.once(res.body, 'size').then(s => s[0])
    const [integrity, size, buf] = await Promise.all([gotIntegrity, gotSize, res.buffer()])
    t.same(buf, CONTENT, 'request succeeded')
    t.same(integrity, INTEGRITY, 'got the right integrity')
    t.same(size, CONTENT.byteLength, 'got the right size')
    t.ok(srv.isDone())
  })

  t.test('when both expected integrity is provided and response is cacheable', async t => {
    const INTEGRITY = ssri.fromData(CONTENT)
    const CACHE = t.testdir()
    const srv = nock(HOST)
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/test`, { cachePath: CACHE, integrity: INTEGRITY })
    t.equal(res.status, 200, 'successful status code')
    t.equal(res.headers.get('x-local-cache-status'), 'miss', 'is a cache miss')
    t.equal(res.body.hasIntegrityEmitter, true, 'flag is set on body')
    const gotIntegrity = events.once(res.body, 'integrity').then(i => i[0])
    const gotSize = events.once(res.body, 'size').then(s => s[0])
    const [integrity, size, buf] = await Promise.all([gotIntegrity, gotSize, res.buffer()])
    t.same(buf, CONTENT, 'request succeeded')
    t.same(integrity, INTEGRITY, 'got the right integrity')
    t.same(size, CONTENT.byteLength, 'got the right size')
    t.ok(srv.isDone())
  })

  t.end()
})
