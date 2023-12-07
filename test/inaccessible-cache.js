const nock = require('nock')
const t = require('tap')
const path = require('path')

const fetch = require('../')
nock.disableNetConnect()

t.beforeEach(() => nock.cleanAll())
t.test('catches error for inaccessible cache', async t => {
  // a file for the cache which wont work
  const cache = t.testdir({
    file: '',
  })
  const req = nock('http://localhost')
    .get('/foo')
    .reply(() => [200, Buffer.from('text')])

  const res = await fetch('http://localhost/foo', {
    cachePath: path.resolve(cache, 'file'),
  })

  await t.rejects(res.text(), { code: 'ENOTDIR' })
  t.ok(req.isDone())
})
