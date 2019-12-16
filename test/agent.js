'use strict'

const test = require('tap').test
const requireInject = require('require-inject')
const url = require('url')

const MockHttp = mockHttpAgent('http')
MockHttp.HttpsAgent = mockHttpAgent('https')
const agent = requireInject.installGlobally('../agent.js', {
  agentkeepalive: MockHttp,
  'https-proxy-agent': mockHttpAgent('https-proxy'),
  'http-proxy-agent': mockHttpAgent('http-proxy'),
  'socks-proxy-agent': mockHttpAgent('socks-proxy')
})

function mockHttpAgent (type) {
  return function Agent (opts) {
    return Object.assign({}, opts, { __type: type })
  }
}

test('extracts process env variables', t => {
  process.env = { TEST_ENV: 'test', ANOTHER_ENV: 'no' }

  t.strictEqual(agent.getProcessEnv(''), undefined, 'no env name returns undefined')
  t.equal(agent.getProcessEnv('test_ENV'), 'test', 'extracts single env')

  t.equal(
    agent.getProcessEnv(['not_existing_env', 'test_ENV', 'another_env']),
    'test',
    'extracts env from array of env names'
  )
  t.done()
})

const OPTS = {
  agent: null,
  maxSockets: 5,
  ca: 'ca',
  cert: 'cert',
  key: 'key',
  localAddress: 'localAddress',
  strictSSL: 'strictSSL',
  timeout: 5
}

test('agent: false returns false', t => {
  t.equal(agent({ url: 'http://x.com' }, { ...OPTS, agent: false }), false)
  t.end()
})

test('all expected options passed down to HttpAgent', t => {
  t.deepEqual(agent('http://foo.com/bar', OPTS), {
    __type: 'http',
    maxSockets: 5,
    localAddress: 'localAddress',
    timeout: 6
  }, 'only expected options passed to HttpAgent')
  t.done()
})

test('timeout 0 keeps timeout 0', t => {
  t.deepEqual(agent('http://foo.com/bar', { ...OPTS, timeout: 0 }), {
    __type: 'http',
    maxSockets: 5,
    localAddress: 'localAddress',
    timeout: 0
  }, 'only expected options passed to HttpAgent')
  t.done()
})

test('no max sockets gets 15 max sockets', t => {
  t.deepEqual(agent('http://foo.com/bar', { ...OPTS, maxSockets: undefined }), {
    __type: 'http',
    maxSockets: 15,
    localAddress: 'localAddress',
    timeout: 6
  }, 'only expected options passed to HttpAgent')
  t.done()
})

test('no timeout gets timeout 0', t => {
  t.deepEqual(agent('http://foo.com/bar', { ...OPTS, timeout: undefined }), {
    __type: 'http',
    maxSockets: 5,
    localAddress: 'localAddress',
    timeout: 0
  }, 'only expected options passed to HttpAgent')
  t.done()
})

test('all expected options passed down to HttpsAgent', t => {
  t.deepEqual(agent('https://foo.com/bar', OPTS), {
    __type: 'https',
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    maxSockets: 5,
    localAddress: 'localAddress',
    rejectUnauthorized: 'strictSSL',
    timeout: 6
  }, 'only expected options passed to HttpsAgent')
  t.done()
})

test('all expected options passed down to proxy agent', t => {
  const opts = Object.assign({
    proxy: 'https://user:pass@my.proxy:1234/foo'
  }, OPTS)
  t.deepEqual(agent('https://foo.com/bar', opts), {
    __type: 'https-proxy',
    host: 'my.proxy',
    port: '1234',
    protocol: 'https:',
    path: '/foo',
    auth: 'user:pass',
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    maxSockets: 5,
    localAddress: 'localAddress',
    rejectUnauthorized: 'strictSSL',
    timeout: 6
  }, 'only expected options passed to https proxy')
  t.done()
})

test('get proxy uri', t => {
  const { getProxyUri } = agent
  const { httpProxy, httpsProxy, noProxy } = process.env
  t.teardown(() => {
    process.env.https_proxy = httpsProxy
    process.env.http_proxy = httpProxy
    process.env.no_proxy = noProxy
  })
  const hsp = 'https://proxy.internal:8443/'
  process.env.https_proxy = hsp
  const hp = 'http://proxy.internal:8000/'
  process.env.http_proxy = hp

  t.strictSame(getProxyUri('https://blarg.com', { proxy: new url.URL(hp) }),
    new url.URL(hp), 'just specify the proxy, get that one')

  t.strictSame(getProxyUri('https://foo.com/bar', {}),
    new url.URL(hsp), 'https proxy for https')
  t.strictSame(getProxyUri('http://foo.com/bar', {}),
    new url.URL(hsp), 'https proxy for http')

  t.equal(getProxyUri('http://x.y.foo.com/bar', {
    noProxy: ['a.b.c.foo.com', '........', '.y.foo.com']
  }), false, 'no proxy for uri on noProxy option')

  process.env.no_proxy = '.y.foo.com, a.b.c.foo.com'
  t.equal(getProxyUri('http://x.y.foo.com/bar', {
    noProxy: '..., x.y.com, .y.foo.com'
  }), false, 'no proxy for uri in no_proxy environ')

  delete process.env.https_proxy
  t.strictSame(getProxyUri('https://foo.com/bar', {}), null, 'no https proxy without https_proxy env')
  t.strictSame(getProxyUri('http://foo.com/bar', {}), new url.URL(hp), 'http proxy for http')

  t.end()
})

test('get proxy agent', t => {
  const { getProxy } = agent
  const OPTS = {
    ca: 'ca',
    cert: 'cert',
    keyu: 'key',
    timeout: 1,
    localAddress: 'local address',
    maxSockets: 3,
    strictSSL: true
  }

  t.strictSame(getProxy(new url.URL('http://proxy.local:443/'), OPTS, true), {
    host: 'proxy.local',
    port: '443',
    protocol: 'http:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: undefined,
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'https-proxy'
  }, 'http proxy url, for https request')

  t.strictSame(getProxy(new url.URL('https://proxy.local:443/'), OPTS, true), {
    host: 'proxy.local',
    port: '',
    protocol: 'https:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: undefined,
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'https-proxy'
  }, 'https proxy url, for https request')

  t.strictSame(getProxy(new url.URL('socks://proxy.local:443/'), OPTS, true), {
    host: 'proxy.local',
    port: '443',
    protocol: 'socks:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: undefined,
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'socks-proxy'
  }, 'socks proxy url, for https request')

  t.strictSame(getProxy(new url.URL('http://proxy.local:443/'), OPTS, false), {
    host: 'proxy.local',
    port: '443',
    protocol: 'http:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: undefined,
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'http-proxy'
  }, 'http proxy url, for http request')

  t.strictSame(getProxy(new url.URL('https://proxy.local:443/'), OPTS, false), {
    host: 'proxy.local',
    port: '',
    protocol: 'https:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: undefined,
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'http-proxy'
  }, 'https proxy url, for http request')

  t.strictSame(getProxy(new url.URL('socks://proxy.local:443/'), OPTS, false), {
    host: 'proxy.local',
    port: '443',
    protocol: 'socks:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: undefined,
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'socks-proxy'
  }, 'socks proxy url, for http request')

  t.throws(() => getProxy(new url.URL('gopher://proxy.local'), OPTS, false), {
    message: 'unsupported proxy protocol: \'gopher:\'',
    url: 'gopher://proxy.local'
  })

  t.end()
})
