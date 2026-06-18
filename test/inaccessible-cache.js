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

  // depending on the cacache version, creating the cache dir over a file
  // surfaces as ENOTDIR (older) or EEXIST (cacache >= 21.0.1, which mkdir's
  // the cache dir first); either way the inaccessible cache must reject
  await t.rejects(res.text(), { code: /^(ENOTDIR|EEXIST)$/ })
  t.ok(req.isDone())
})
