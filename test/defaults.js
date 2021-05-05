const nock = require('nock')
const t = require('tap')

const fetch = require('../lib/index.js')

nock.disableNetConnect()
t.beforeEach(() => nock.cleanAll())

t.test('can set default url', async (t) => {
  const srv = nock('http://localhost')
    .get('/test')
    .reply(200, 'success')

  const defaultedFetch = fetch.defaults('http://localhost/test')
  const res = await defaultedFetch()
  t.equal(res.status, 200, 'got success')
  const buf = await res.buffer()
  t.same(buf, Buffer.from('success'), 'got body')
  t.ok(srv.isDone())
})

t.test('allows default headers', async (t) => {
  const srv = nock('http://localhost', {
    reqHeaders: {
      'x-foo': 'bar',
      'x-bar': 'baz',
    },
  })
    .get('/test')
    .reply(200, 'success')

  const defaultedFetch = fetch.defaults({ headers: { 'x-foo': 'bar' } })
  const res = await defaultedFetch('http://localhost/test', {
    headers: {
      'x-bar': 'baz',
    },
  })
  t.equal(res.status, 200, 'got success')
  const buf = await res.buffer()
  t.same(buf, Buffer.from('success'), 'got body')
  t.ok(srv.isDone())
})
