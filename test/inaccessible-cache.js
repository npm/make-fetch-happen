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
    .reply(() => {
      const data = Buffer.from('text')
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
    cachePath: path.resolve(cache, 'file'),
  })

  await t.rejects(res.json(), { code: 'ENOTDIR' })
  t.ok(req.isDone())
})
