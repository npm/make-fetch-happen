'use strict'

const test = require('tap').test
const requireInject = require('require-inject')

const http = require('http')
const https = require('https')

const MockHttp = mockHttpAgent('http')

MockHttp.HttpsAgent = mockHttpAgent('https')

const agent = requireInject.installGlobally('../lib/agent.js', {
  'is-lambda': true,
  agentkeepalive: MockHttp,
  'https-proxy-agent': mockHttpAgent('https-proxy'),
})

function mockHttpAgent (type) {
  return function Agent (opts) {
    return Object.assign({}, opts, { __type: type })
  }
}

const OPTS = {
  agent: null,
  maxSockets: 5,
  ca: 'ca',
  cert: 'cert',
  key: 'key',
  localAddress: 'localAddress',
  strictSSL: 'strictSSL',
  timeout: 5,
}

test('extracts process env variables', async (t) => {
  process.env = { TEST_ENV: 'test', ANOTHER_ENV: 'no' }

  t.same(agent.getProcessEnv('test_ENV'), 'test', 'extracts single env')

  t.same(
    agent.getProcessEnv(['not_existing_env', 'test_ENV', 'another_env']),
    'test',
    'extracts env from array of env names'
  )
})

test('global http agent when lambda', async (t) => {
  t.same(agent('http://foo.com/bar', OPTS), http.globalAgent)
})

test('global https agent when lambda', async (t) => {
  t.same(agent('https://foo.com/bar', OPTS), https.globalAgent)
})

test('all expected options passed down to proxy agent', async (t) => {
  const opts = Object.assign({
    proxy: 'https://user:pass@my.proxy:1234/foo',
  }, OPTS)
  t.same(agent('https://foo.com/bar', opts), {
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
    timeout: 6,
  }, 'only expected options passed to https proxy')
})
