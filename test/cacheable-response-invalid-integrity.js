const port = 15443 + (+process.env.TAP_CHILD_ID || 0)

const fetch = require('../')

const { resolve, basename } = require('path')
const me = resolve(__dirname, basename(__filename, '.js'))
const mkdirp = require('mkdirp')
mkdirp.sync(me)
const t = require('tap')
const rimraf = require('rimraf')
t.teardown(() => rimraf.sync(me))

t.test('setup server', t => {
  const http = require('http')
  const data = Buffer.from('{"some":"data"}')
  const server = http.createServer((req, res) => {
    res.setHeader('cache-control', 'max-age=432000')
    res.setHeader('accept-ranges', 'bytes')
    res.setHeader('etag', '"a2177e7d2ad8d263e6c38e6fe8dd6f79"')
    res.setHeader('last-modified', 'Sat, 26 May 2018 16:03:07 GMT')
    res.setHeader('vary', 'Accept-Encoding')
    res.setHeader('connection', 'close')
    res.setHeader('content-length', data.length)
    res.setHeader('content-type', 'application/json')
    res.end(data)
  })
  server.listen(port, () => {
    t.parent.teardown(() => server.close())
    t.end()
  })
})

t.test('cacheable request with invalid integrity', t => {
  const integrity = 'sha512-012'
  const cache = me + '/cache'
  return t.rejects(fetch(`http://localhost:${port}/foo`, {
    cacheManager: cache,
    integrity,
    body: null,
    method: 'GET',
  }).then((res) => {
    t.pass('got response, drain to check integrity and cache', res.headers)
    return res.json()
  }), {
    code: 'EINTEGRITY',
  }) // TODO: add a .then() to verify cache was cleaned up
})
