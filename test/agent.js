'use strict'

const t = require('tap')
const url = require('url')

const MockHttp = mockHttpAgent('http')
MockHttp.HttpsAgent = mockHttpAgent('https')
const agent = t.mock('../lib/agent.js', {
  agentkeepalive: MockHttp,
  'https-proxy-agent': mockHttpAgent('https-proxy'),
  'http-proxy-agent': mockHttpAgent('http-proxy'),
  'socks-proxy-agent': { SocksProxyAgent: mockHttpAgent('socks-proxy') },
})

function mockHttpAgent (type) {
  return function Agent (opts) {
    return Object.assign({}, opts, { __type: type })
  }
}

t.test('extracts process env variables', async t => {
  process.env = { TEST_ENV: 'test', ANOTHER_ENV: 'no' }

  t.equal(agent.getProcessEnv(''), undefined, 'no env name returns undefined')
  t.equal(agent.getProcessEnv('test_ENV'), 'test', 'extracts single env')

  t.equal(
    agent.getProcessEnv(['not_existing_env', 'test_ENV', 'another_env']),
    'test',
    'extracts env from array of env names'
  )
})

const OPTS = {
  agent: null,
  maxSockets: 5,
  ca: 'ca',
  cert: 'cert',
  key: 'key',
  localAddress: 'localAddress',
  rejectUnauthorized: 'strictSSL',
  timeout: 5,
}

t.test('agent: false returns false', async t => {
  t.equal(agent({ url: 'http://x.com' }, { ...OPTS, agent: false }), false)
})

t.test('all expected options passed down to HttpAgent', async t => {
  t.match(agent('http://foo.com/bar', OPTS), {
    options: {
      maxSockets: 5,
      localAddress: 'localAddress',
      timeout: 6,
    },
  }, 'only expected options passed to HttpAgent')
})

t.test('timeout 0 keeps timeout 0', async t => {
  t.match(agent('http://foo.com/bar', { ...OPTS, timeout: 0 }), {
    options: {
      maxSockets: 5,
      localAddress: 'localAddress',
      timeout: 0,
    },
  }, 'only expected options passed to HttpAgent')
})

t.test('no max sockets gets 15 max sockets', async t => {
  t.match(agent('http://foo.com/bar', { ...OPTS, maxSockets: undefined }), {
    options: {
      maxSockets: 15,
      localAddress: 'localAddress',
      timeout: 6,
    },
  }, 'only expected options passed to HttpAgent')
})

t.test('no timeout gets timeout 0', async t => {
  t.match(agent('http://foo.com/bar', { ...OPTS, timeout: undefined }), {
    options: {
      maxSockets: 5,
      localAddress: 'localAddress',
      timeout: 0,
    },
  }, 'only expected options passed to HttpAgent')
})

t.test('all expected options passed down to HttpsAgent', async t => {
  t.match(agent('https://foo.com/bar', OPTS), {
    options: {
      ca: 'ca',
      cert: 'cert',
      key: 'key',
      maxSockets: 5,
      localAddress: 'localAddress',
      rejectUnauthorized: 'strictSSL',
      timeout: 6,
    },
  }, 'only expected options passed to HttpsAgent')
})

t.test('all expected options passed down to proxy agent', async t => {
  const opts = Object.assign({
    proxy: 'https://user:pass@my.proxy:1234/foo',
  }, OPTS)
  t.match(agent('https://foo.com/bar', opts), {
    options: {
      proxy: opts.proxy,
      ca: 'ca',
      cert: 'cert',
      key: 'key',
      maxSockets: 5,
      localAddress: 'localAddress',
      rejectUnauthorized: 'strictSSL',
      timeout: 6,
    },
  }, 'only expected options passed to https proxy')
})

t.test('all expected options passed down to proxy agent, username only', async t => {
  const opts = Object.assign({
    proxy: 'https://user-no-pass@my.proxy:1234/foo',
    // bust the cache
  }, { ...OPTS, timeout: OPTS.timeout + 1 })
  t.match(agent('https://foo.com/bar', opts), {
    options: {
      proxy: opts.proxy,
      ca: 'ca',
      cert: 'cert',
      key: 'key',
      maxSockets: 5,
      localAddress: 'localAddress',
      rejectUnauthorized: 'strictSSL',
      timeout: 7,
    },
  }, 'only expected options passed to https proxy')
})

t.test('get proxy uri', async t => {
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
    noProxy: ['a.b.c.foo.com', '........', '.y.foo.com'],
  }), false, 'no proxy for uri on noProxy option')

  process.env.no_proxy = '.y.foo.com, a.b.c.foo.com'
  t.equal(getProxyUri('http://x.y.foo.com/bar', {
    noProxy: '..., x.y.com, .y.foo.com',
  }), false, 'no proxy for uri in no_proxy environ')

  delete process.env.https_proxy
  t.strictSame(getProxyUri('https://foo.com/bar', {}), null,
    'no https proxy without https_proxy env')
  t.strictSame(getProxyUri('http://foo.com/bar', {}), new url.URL(hp), 'http proxy for http')
})

t.test('get proxy agent', async t => {
  const { getProxy } = agent
  const PROXY_OPTS = {
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    timeout: 1,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
  }

  t.match(getProxy(new url.URL('http://proxy.local:80/'), PROXY_OPTS, true), {
    options: {
      proxy: 'http://proxy.local/',
      ca: 'ca',
      cert: 'cert',
      key: 'key',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
      rejectUnauthorized: true,
    },
  }, 'http proxy url, for https request')

  t.match(getProxy(new url.URL('https://proxy.local:443/'), PROXY_OPTS, true), {
    options: {
      proxy: 'https://proxy.local/',
      ca: 'ca',
      cert: 'cert',
      key: 'key',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
      rejectUnauthorized: true,
    },
  }, 'https proxy url, for https request')

  t.strictSame(getProxy(new url.URL('socks://proxy.local:443/'), PROXY_OPTS, true), {
    hostname: 'proxy.local',
    port: '443',
    protocol: 'socks:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'socks-proxy',
  }, 'socks proxy url, for https request')

  t.match(getProxy(new url.URL('http://proxy.local:80/'), PROXY_OPTS, false), {
    options: {
      proxy: 'http://proxy.local/',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
    },
  }, 'http proxy url, for http request')

  t.match(getProxy(new url.URL('https://proxy.local:443/'), PROXY_OPTS, false), {
    options: {
      proxy: 'https://proxy.local/',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
    },
  }, 'https proxy url, for http request')

  t.strictSame(getProxy(new url.URL('socks://proxy.local:443/'), PROXY_OPTS, false), {
    hostname: 'proxy.local',
    port: '443',
    protocol: 'socks:',
    path: '/',
    auth: null,
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'socks-proxy',
  }, 'socks proxy url, for http request')

  t.strictSame(getProxy(new url.URL('socks://user@proxy.local:443/'), PROXY_OPTS, false), {
    hostname: 'proxy.local',
    port: '443',
    protocol: 'socks:',
    path: '/',
    auth: 'user',
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'socks-proxy',
  }, 'socks proxy url with username only, for http request')

  t.strictSame(getProxy(new url.URL('socks://user:pass@proxy.local:443/'), PROXY_OPTS, false), {
    hostname: 'proxy.local',
    port: '443',
    protocol: 'socks:',
    path: '/',
    auth: 'user:pass',
    ca: 'ca',
    cert: 'cert',
    key: 'key',
    timeout: 2,
    localAddress: 'local address',
    maxSockets: 3,
    rejectUnauthorized: true,
    __type: 'socks-proxy',
  }, 'socks proxy url with auth, for http request')

  t.match(getProxy(new url.URL('http://user:pass@proxy.local:80/'), PROXY_OPTS, false), {
    options: {
      proxy: 'http://user:pass@proxy.local/',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
    },
  }, 'http proxy url, for http request')

  t.match(getProxy(new url.URL('http://user@proxy.local:80/'), PROXY_OPTS, false), {
    options: {
      proxy: 'http://user@proxy.local/',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
    },
  }, 'http proxy url, for http request')

  t.match(getProxy(new url.URL('http://user%231:pass@proxy.local:80/'), PROXY_OPTS, false), {
    options: {
      proxy: 'http://user%231:pass@proxy.local/',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
    },
  }, 'http proxy url, for http request')

  t.match(getProxy(new url.URL('http://user%231:pass%231@proxy.local:80/'), PROXY_OPTS, false), {
    options: {
      proxy: 'http://user%231:pass%231@proxy.local/',
      timeout: 2,
      localAddress: 'local address',
      maxSockets: 3,
    },
  }, 'http proxy url, for http request')

  t.throws(() => getProxy(new url.URL('gopher://proxy.local'), PROXY_OPTS, false), {
    message: 'unsupported proxy protocol: \'gopher:\'',
    code: 'EUNSUPPORTEDPROXY',
    url: 'gopher://proxy.local',
  })
})
