'use strict'

const { Response, Headers } = require('minipass-fetch')
const requireInject = require('require-inject')
const { Buffer } = require('safe-buffer')
const Minipass = require('minipass')
const { test } = require('tap')
const nock = require('nock')
const url = require('url')

const tnock = require('./util/tnock')

const CONTENT = Buffer.from('hello, world!', 'utf8')
const HOST = 'https://make-fetch-happen.npm'
const HTTPHOST = 'http://registry.npm.test.org'

function mockRequire (mocks = {}) {
  const mergedMocks = Object.assign(
    {},
    {
      '../agent': (uri, opts) => {
        if (opts.agent === false)
          return false
        const parsedUri = new url.URL(typeof uri === 'string' ? uri : uri.url)
        const isHttps = parsedUri.protocol === 'https:'
        return (isHttps)
          ? new (require('agentkeepalive').HttpsAgent)()
          : new (require('agentkeepalive'))()
      },
      '../warning': () => {},
      '../utils/configure-options': (opts = {}) => {
        const retry = (!opts.retry)
          ? { retries: 0 }
          : (typeof opts.retry === 'object')
            ? opts.retry
            : (typeof opts.retry === 'number')
              ? { retries: opts.retry }
              : (typeof opts.retry === 'string')
                ? { retries: parseInt(opts.retry, 10) }
                : { retries: 0 }
        const method = (!opts.method) ? 'GET' : opts.method.toUpperCase()
        const cache = opts.cache || 'default'
        const cacheManager = {
          delete: () => Promise.resolve(),
          match: () => Promise.resolve(new Response()),
          put: () => Promise.resolve(new Response()),
        }
        return (!opts.cacheManager)
          ? Object.assign({}, opts, { method, retry })
          : Object.assign({}, opts, { method, retry, cache, cacheManager })
      },
      '../utils/initialize-cache': () => {},
      '../utils/iterable-to-object': () => {},
      '../utils/make-policy': () => {},
    },
    mocks
  )
  return requireInject('../index', mergedMocks)
}

test('requests remote content', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)
  srv
    .get('/test')
    .reply(200, CONTENT)

  return fetch(`${HOST}/test`)
    .then(res => {
      t.equal(res.status, 200, 'successful status code')
      return res.buffer()
    })
    .then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
})

test('supports http', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, 'http://foo.npm')
  srv
    .get('/test')
    .reply(200, CONTENT)

  return fetch('http://foo.npm/test')
    .then(res => {
      t.equal(res.url, 'http://foo.npm/test', 'http request url')
      return res.buffer()
    })
    .then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
})

test('supports https', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, 'https://foo.npm')
  srv
    .get('/test')
    .reply(200, CONTENT)

  return fetch('https://foo.npm/test')
    .then(res => {
      t.equal(res.url, 'https://foo.npm/test', 'https request url')
      return res.buffer()
    })
    .then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
})

test('500-level responses not thrown', t => {
  const fetch = mockRequire({})

  t.test('500 response', (t) => {
    const srv = tnock(t, HOST)
    srv.get('/test-500').reply(500)

    return fetch(`${HOST}/test-500`, { retry: { retries: 0 } })
      .then(res => {
        t.equal(res.status, 500, 'got regular response w/ errcode 500')
      })
  })
  t.test('543 response', (t) => {
    const srv = tnock(t, HOST)
    srv.get('/test-543').reply(543)

    return fetch(`${HOST}/test-543`, { retry: { retries: 0 } })
      .then(res => {
        t.equal(res.status, 543, 'got regular response w/ errcode 543, as given')
      })
  })

  t.end()
})

test('calls opts.onRetry', t => {
  const fetch = mockRequire({})

  t.test('when request is retriable', (t) => {
    const srv = tnock(t, HOST)
    let retryNotification = 0
    let attempt = 0
    let calledOnRetry = false

    const replyCb = () => {
      attempt++
      return null
    }

    srv
      .get('/test-onretry').reply(500, replyCb)
      .get('/test-onretry').reply(200, replyCb)

    return fetch(`${HOST}/test-onretry`, {
      retry: {
        retries: 1,
      },
      onRetry: (res) => {
        calledOnRetry = true
        retryNotification++
      },
    }).then((res) => {
      t.equal(calledOnRetry, true, 'should have called onRetry')
      t.equal(retryNotification, 1, 'should have called method once')
      t.equal(attempt, 2, 'should have tried twice')
    })
  })

  t.test('when request is retriable; and caught', (t) => {
    const srv = tnock(t, HOST)
    let calledOnRetry = false

    srv
      .get('/catch-retry')
      .replyWithError({
        message: 'retry please',
        code: 'ECONNRESET',
      })
      .get('/catch-retry')
      .reply(200, CONTENT)

    return fetch(`${HOST}/catch-retry`, {
      retry: {
        retries: 1,
      },
      onRetry: (err) => {
        t.deepEqual(
          err.message,
          `request to ${HOST}/catch-retry failed, reason: retry please`,
          'correct error message'
        )
        t.equal(err.code, 'ECONNRESET', 'correct error code')
        calledOnRetry = true
      },
    }).then((res) => {
      t.equal(calledOnRetry, true, 'should have called onRetry')
      return res.buffer()
    }).then((buf) => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
  })

  t.test('onRetry not supplied', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/catch-retry')
      .replyWithError({
        message: 'retry please',
        code: 'ECONNRESET',
      })
      .get('/catch-retry')
      .reply(200, CONTENT)

    return fetch(`${HOST}/catch-retry`, {
      retry: {
        retries: 1,
      },
      onRetry: null,
    }).then((res) => {
      t.equal(res.status, 200, 'successful status code')
      return res.buffer()
    }).then((buf) => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
  })

  t.end()
})

test('custom headers', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)

  srv
    .get('/test')
    .reply(200, CONTENT, {
      foo: (req) => {
        t.equal(req.headers.test[0], 'ayy', 'got request header')
        return 'bar'
      },
    })
  return fetch(`${HOST}/test`, { headers: { test: 'ayy' } })
    .then(res => {
      t.equal(res.headers.get('foo'), 'bar', 'got response header')
    })
})

test('custom headers (class)', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)

  srv
    .get('/test')
    .reply(200, CONTENT, {
      foo: (req) => {
        t.equal(req.headers.test[0], 'ayy', 'got request header')
        return 'bar'
      },
    })

  return fetch(`${HOST}/test`, { headers: new Headers({ test: 'ayy' }) })
    .then(res => {
      t.equal(res.headers.get('foo'), 'bar', 'got response header')
    })
})

test('supports redirect logic', t => {
  const fetch = mockRequire({})

  t.test('simple redirect', (t) => {
    const srv = tnock(t, HOST)
    srv
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HOST}/redirect`)
      .then(res => {
        t.equal(res.redirected, true, 'should have been redirected')
        t.equal(res.url, `${HOST}/test`, 'should be from redirected url')
        t.equal(res.status, 200, 'got the final status')
        return res.buffer()
      }).then(buf => {
        t.deepEqual(buf, CONTENT, 'final req gave right body')
      })
  })

  t.test('set manual redirect', (t) => {
    const srv = tnock(t, HOST)
    srv
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    return fetch(`${HOST}/redirect`, { redirect: 'manual' })
      .then((res) => {
        t.equal(res.redirected, false, 'should not have been redirected')
        t.equal(res.url, `${HOST}/redirect`, 'should be from original url')
        t.equal(res.status, 301, 'did not follow redirect')
        return res.buffer()
      })
      .then((buf) => {
        t.equal(buf.length, 0, 'empty body')
      })
  })

  t.test('supports error redirect flag', (t) => {
    const srv = tnock(t, HOST)
    srv
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    return t.rejects(
      fetch(`${HOST}/redirect`, { redirect: 'error' }),
      {
        message: 'redirect mode is set to error: https://make-fetch-happen.npm/redirect',
        code: 'ENOREDIRECT',
      }
    )
  })

  t.test('throws error when redirect location is missing', (t) => {
    const srv = tnock(t, HOST)

    srv.get('/redirect').reply(301)

    return t.rejects(
      fetch(`${HOST}/redirect`),
      {
        message: 'redirect location header missing at: https://make-fetch-happen.npm/redirect',
        code: 'EINVALIDREDIRECT',
      }
    )
  })

  t.test('bad location header information', (t) => {
    const scope = tnock(t, HOST)

    scope
      .get('/redirect')
      .reply(301, '', { Location: 'ftp://nope' })

    return t.rejects(
      fetch(`${HOST}/redirect`)
    )
  })

  t.end()
})

test('supports protocol switching on redirect', t => {
  const fetch = mockRequire({})

  t.test('rediret to https', (t) => {
    const httpSrv = tnock(t, HTTPHOST)
    const httpsSrv = tnock(t, HOST)

    httpSrv
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    httpsSrv
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HTTPHOST}/redirect`)
      .then(res => {
        t.equal(res.url, `${HOST}/test`, 'response should be from https')
        t.equal(res.redirected, true, 'response should have been redirected')
        t.equal(res.status, 200, 'got the final status')
        return res.buffer()
      }).then(buf => {
        t.deepEqual(buf, CONTENT, 'final req gave right body')
      })
  })

  t.test('manually redirect to https', (t) => {
    const httpSrv = tnock(t, HTTPHOST)

    httpSrv
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    return fetch(`${HTTPHOST}/redirect`, { redirect: 'manual' })
      .then((res) => {
        t.equal(res.status, 301, 'did not follow redirect with manual mode')
        return res.buffer()
      })
      .then((buf) => {
        t.equal(buf.length, 0, 'empty body')
      })
  })

  t.end()
})

test('removes authorization header if changing hostnames', t => {
  const fetch = mockRequire({})
  const httpSrv = tnock(t, HTTPHOST)
  const httpsSrv = tnock(t, HOST)

  httpSrv
    .matchHeader('authorization', 'test')
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  httpsSrv
    .matchHeader('authorization', 'test')
    .get('/test')
    .reply(200, () => {
      t.equal(true, false, 'meaningful failure, this should never be executed')
      return CONTENT
    })

  return t.rejects(
    fetch(`${HTTPHOST}/redirect`, { headers: { authorization: 'test' } }),
    {
      code: 'FETCH_ERROR',
    }
  )
    .then(() => {
      t.equal(httpsSrv.pendingMocks().length, 1, 'redirect request does not happen')
      nock.cleanAll()
    })
})

test('supports passthrough of options on redirect', t => {
  const fetch = mockRequire({})
  const httpSrv = tnock(t, HTTPHOST)
  const httpsSrv = tnock(t, HOST)

  httpSrv
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  httpsSrv
    .get('/test')
    .matchHeader('x-test', 'test')
    .reply(200, CONTENT, {
      'test-header': (req, res, body) => {
        t.ok(req.headers['x-test'].length)
        t.equal(req.headers['x-test'][0], 'test', 'headers from redriect')
        return 'truthy'
      },
    })

  return fetch(`${HTTPHOST}/redirect`, { headers: { 'x-test': 'test' } })
    .then((res) => {
      t.equal(res.status, 200, 'successful status code')
      t.equal(res.redirected, true, 'request was redirected')
      t.equal(res.headers.get('test-header'), 'truthy', 'should get test header')
      return res.buffer()
    })
    .then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
})

test('supports redirects from POST requests', t => {
  const fetch = mockRequire({})

  t.test('supports 301 redirects', (t) => {
    const srv = tnock(t, HOST)
    srv
      .post('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HOST}/redirect`, {
      method: 'POST',
      body: 'test',
    }).then(res => {
      t.equal(res.status, 200, 'successful status code')
      t.equal(res.redirected, true, 'request was redirected')
      return res.buffer()
    }).then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
  })

  t.test('supports 302 redirects', (t) => {
    const srv = tnock(t, HOST)
    srv
      .post('/redirect')
      .reply(302, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HOST}/redirect`, {
      method: 'POST',
      body: 'test',
    }).then(res => {
      t.equal(res.status, 200, 'successful status code')
      t.equal(res.redirected, true, 'request was redirected')
      return res.buffer()
    }).then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
  })

  t.end()
})

test('throws error if follow is less than request count', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)

  srv
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  return t.rejects(
    fetch(`${HOST}/redirect`, { follow: 0 }),
    {
      message: 'maximum redirect reached at: https://make-fetch-happen.npm/redirect',
      code: 'EMAXREDIRECT',
    }
  )
})

test('supports streaming content', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)

  srv
    .get('/test')
    .reply(200, CONTENT)

  return fetch(`${HOST}/test`)
    .then(res => {
      t.equal(res.status, 200, 'successful status code')
      const buf = []
      let bufLen = 0
      res.body.on('data', d => {
        buf.push(d)
        bufLen += d.length
      })
      return res.body.promise().then(() => Buffer.concat(buf, bufLen))
    })
    .then(body => {
      t.deepEqual(body, CONTENT, 'streamed body ok')
    })
})

test('supports proxy configurations', { skip: true }, t => {
  const fetch = mockRequire({})
  t.plan(3)
  // Gotta do this manually 'cause nock's interception breaks proxies
  const srv = require('http').createServer((req, res) => {
    // WHO SETS THIS HEADER?
    t.equal(req.headers.host, 'npm.im:80', 'proxy target host received')
    res.write(CONTENT, () => {
      res.end(() => {
        req.socket.end(() => {
          srv.close(() => {
            t.ok(true, 'server closed')
          })
        })
      })
    })
  }).listen(9854).on('error', err => {
    throw err
  })
  fetch('http://npm.im/make-fetch-happen', {
    proxy: 'http://localhost:9854',
    retry: {
      retries: 0,
    },
  }).then(res => {
    return res.buffer()
  }).then(buf => {
    t.deepEqual(buf, CONTENT, 'request succeeded')
  })
})

test('supports custom agent config', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST, { date: new Date().toISOString() })
  srv
    .get('/test')
    .reply(200, function () {
      t.equal(this.req.headers.connection[0], 'close', 'one-shot agent!')
      return CONTENT
    })

  return fetch(`${HOST}/test`, { agent: false })
    .then(res => {
      t.equal(res.status, 200)
      return res.buffer()
    }).then(buf => {
      t.deepEqual(buf, CONTENT, 'request succeeded')
    })
})

test('handles 15 concurrent requests', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)

  srv
    .get('/test')
    .times(15)
    .delay(50)
    .reply(200, CONTENT)

  const requests = []
  const expected = []

  for (let i = 0; i < 15; i++) {
    expected.push(CONTENT)
    requests.push(
      fetch(`${HOST}/test`)
        .then((res) => {
          t.equal(res.status, 200, 'successful status code')
          return res.buffer()
        })
    )
  }
  return Promise.all(requests).then(results => {
    t.deepEqual(results, expected, 'all requests resolved successfully')
  })
})

test('handle integrity options', (t) => {
  const fetch = mockRequire({})
  const integrity = 'sha512-MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw=='
  const data = 'hello world'

  t.test('valid integrity value', (t) => {
    const scope = tnock(t, HOST)

    scope.get('/integrity').reply(200, data)
    scope.get('/integrity').reply(200, data)

    const firstFetch = fetch(`${HOST}/integrity`, { integrity })
      .then((res) => {
        t.equal(res.status, 200, 'successful status code')
        t.ok(Minipass.isStream(res.body), 'body is a stream')
        return res.buffer()
      })
      .then((buf) => {
        t.deepEqual(buf.toString(), data, 'request succeeded')
      })

    // 100% branch coverage
    const secondFetch = fetch(`${HOST}/integrity`, { integrity })
      .then((res) => {
        t.equal(res.status, 200, 'successful status code')
        t.ok(Minipass.isStream(res.body), 'body is a stream')
        return res.buffer()
      })
      .then((buf) => {
        t.deepEqual(buf.toString(), data, 'request succeeded')
      })

    return Promise.resolve()
      .then(() => firstFetch)
      .then(() => secondFetch)
  })

  // TODO: have isaac make this test work
  t.test('valid integrity value', { skip: true }, (t) => {
    const scope = tnock(t, HOST)
    const badIntegrity = 'sha512-MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXJJ=='
    scope.get('/integrity').reply(200, data)

    return fetch(`${HOST}/integrity`, { integrity: badIntegrity })
      .then((res) => {
        t.equal(res.status, 200, 'successful status code')
        t.ok(Minipass.isStream(res.body), 'body is a stream')
        return res.buffer()
      })
      .then((buf) => {
        t.deepEqual(buf.toString(), data, 'request succeeded')
      })
  })

  t.end()
})

test('supports opts.timeout for controlling request timeout time', t => {
  const fetch = mockRequire({})
  const srv = tnock(t, HOST)

  srv
    .get('/test')
    .delay(10)
    .reply(200, CONTENT)

  return t.rejects(
    fetch(`${HOST}/test`, { timeout: 1, retry: { retries: 0 } }),
    {
      code: 'FETCH_ERROR',
      type: 'request-timeout',
    }
  )
})

test('retries non-POST requests on timeouts', t => {
  const fetch = mockRequire({})

  t.test('retries request', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .delay(100)
      .times(4)
      .reply(200)

    srv
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HOST}/test`, {
      timeout: 10,
      retry: {
        retries: 4,
        minTimeout: 5,
      },
    })
      .then((res) => {
        t.equal(res.headers.get('x-fetch-attempts'), '5', 'fetched five times')
        return res.buffer()
      })
      .then((buf) => {
        t.deepEqual(buf, CONTENT, 'request retried until success')
      })
  })

  t.test('throws if not enough retries', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .delay(100)
      .times(2)
      .reply(200)

    return t.rejects(
      fetch(`${HOST}/test`, {
        timeout: 10,
        retry: { retries: 1, minTimeout: 1 },
      }),
      {
        type: 'request-timeout',
      }
    )
  })

  t.end()
})

test('retries non-POST requests on 500 errors', t => {
  const fetch = mockRequire({})

  t.test('retries request', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .times(4)
      .reply(500)
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HOST}/test`, {
      retry: {
        retries: 4,
        minTimeout: 5,
      },
    })
      .then((res) => {
        t.equal(res.headers.get('x-fetch-attempts'), '5', 'five request attempts')
        return res.buffer()
      })
      .then((buf) => {
        t.deepEqual(buf, CONTENT, 'request retried until success')
      })
  })

  t.test('returns 500 if at max retries', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .twice()
      .reply(500)

    return fetch(`${HOST}/test`, {
      retry: {
        retries: 1,
        minTimeout: 1,
      },
    })
      .then((res) => {
        t.equal(res.status, 500, 'got bad request back on failure')
        t.equal(res.headers.get('x-fetch-attempts'), '2', 'two request attempts')
      })
  })

  t.test('returns 500 error on POST requests', (t) => {
    const srv = tnock(t, HOST)

    srv
      .post('/test')
      .reply(500)

    return fetch(`${HOST}/test`, {
      method: 'POST',
      retry: {
        retries: 3,
        minTimeout: 1,
      },
    })
      .then((res) => {
        t.equal(res.status, 500, 'bad post gives a 500 without retries')
        t.equal(res.headers.get('x-fetch-attempts'), '1', 'one request attempts')
      })
  })

  t.test('does not retry because POST body is stream', (t) => {
    const srv = tnock(t, HOST)
    const stream = new Minipass()

    srv
      .put('/test')
      .reply(500)

    setTimeout(() => {
      stream.write('bleh')
      stream.end()
    }, 50)

    return fetch(`${HOST}/test`, {
      method: 'put',
      body: stream,
      retry: { retries: 5, minTimeout: 1 },
    })
      .then((res) => {
        t.equal(res.status, 500, 'bad put does not retry because body is stream')
        t.equal(res.headers.get('x-fetch-attempts'), '1', 'one request attempts')
      })
  })

  t.test('successfully retries with request body', (t) => {
    const srv = tnock(t, HOST)

    srv
      .put('/put-test')
      .times(4)
      .reply(500)
      .put('/put-test')
      .reply(201, (uri, reqBody) => {
        t.deepEqual(reqBody, 'great success!', 'PUT data match')
        return CONTENT
      })

    return fetch(`${HOST}/put-test`, {
      method: 'PUT',
      body: Buffer.from('great success!'),
      retry: {
        retries: 4,
        minTimeout: 5,
      },
    })
      .then((res) => {
        t.equal(res.status, 201, 'successful response')
        t.equal(res.headers.get('x-fetch-attempts'), '5', 'five request attempts')
        return res.buffer()
      })
      .then((body) => {
        t.deepEqual(body, CONTENT, 'got content after multiple attempts')
      })
  })

  t.end()
})

test('accepts opts.retry shorthands', t => {
  const fetch = mockRequire({})

  t.test('false value for retry', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .reply(500)

    return fetch(`${HOST}/test`, { retry: false })
      .then(res => {
        t.equal(res.status, 500, 'did not retry')
        t.equal(res.headers.get('x-fetch-attempts'), '1', 'one request attempt')
      })
  })

  t.test('numeric value for retry', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .reply(500, '')
      .get('/test')
      .reply(200, CONTENT)

    return fetch(`${HOST}/test`, { retry: 1 })
      .then(res => {
        t.equal(res.status, 200, 'retried once')
        t.equal(res.headers.get('x-fetch-attempts'), '2', 'two request attempts')
        return res.buffer()
      })
      .then((buf) => {
        t.deepEqual(buf, CONTENT, 'successful request')
      })
  })

  t.test('numeric value for retry, with error', (t) => {
    const srv = tnock(t, HOST)

    srv
      .get('/test')
      .twice()
      .reply(500)

    return fetch(`${HOST}/test`, { retry: 1 })
      .then((res) => {
        t.equal(res.status, 500, 'failed on second retry')
        t.equal(res.headers.get('x-fetch-attempts'), '2', 'two request attempts')
      })
  })

  t.end()
})

test('delete cache', (t) => {
  const fetch = mockRequire({})

  t.test('no cacheManager', (t) => {
    fetch.delete(`${HOST}/test`)
    t.end()
  })

  t.test('with cacheManager', (t) => {
    return fetch.delete(`${HOST}/test`, {
      cache: 'default',
      cacheManager: '/path/to/cache',
    })
  })

  t.end()
})

test('pass opts to fetch.Request as well as agent', t => {
  const agent = { this_is_the_agent: true }
  const ca = 'ca'
  const timeout = 'timeout'
  const cert = 'cert'
  const key = 'key'
  const rejectUnauthorized = 'rejectUnauthorized'

  let req = null
  const fetch = requireInject('../index.js', {
    'minipass-fetch': Object.assign(async request => {
      t.equal(request, req, 'got the request object')
      t.end()
      return {
        headers: new Map(),
        status: 200,
        method: 'GET'
      }
    }, require('minipass-fetch'), {
      Request: class Request{ constructor (uri, reqOpts) {
        req = this
        t.equal(uri, 'uri')
        t.match(reqOpts, { agent, ca, timeout, cert, key, rejectUnauthorized })
      }},
    }),
    '../agent.js': (uri, opts) => agent,
  })

  fetch('uri', {
    agent,
    ca,
    timeout,
    cert,
    key,
    strictSSL: rejectUnauthorized,
  })
})

// test('retries non-POST requests on ECONNRESET')
// test('supports automatic agent pooling on unique configs')
