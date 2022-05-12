const nock = require('nock')
const t = require('tap')
const util = require('util')
const readdir = util.promisify(require('fs').readdir)

const fetch = require('../')
nock.disableNetConnect()

t.beforeEach(() => nock.cleanAll())
t.test('cacheable request with invalid integrity', async t => {
  // an empty directory for the cache
  const cache = t.testdir()
  const req = nock('http://localhost')
    .get('/foo')
    .reply(() => {
      const data = Buffer.from('{"some":"data"}')
      return [
        200,
        data,
        {
          'cache-control': 'max-age=432000',
          'accept-ranges': 'bytes',
          etag: '"a2177e7d2ad8d263e6c38e6fe8dd6f79"',
          'last-modified': 'Sat, 26 May 2018 16:03:07 GMT',
          vary: 'Accept-Encoding',
          connection: 'close',
          'content-length': data.length,
          'content-type': 'application/json',
        },
      ]
    })

  const res = await fetch('http://localhost/foo', {
    cachePath: cache,
    integrity: 'sha512-012',
  })

  await t.rejects(res.json(), { code: 'EINTEGRITY' })
  t.ok(req.isDone())
  const dir = await readdir(cache)
  t.same(dir, ['tmp'], 'did not write to cache, only temp')
})
