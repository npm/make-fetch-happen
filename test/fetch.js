'use strict'

const Minipass = require('minipass')
const t = require('tap')
const nock = require('nock')
const fetch = require('../lib/index.js')
const { Headers, FetchError } = fetch

const CONTENT = Buffer.from('hello, world!', 'utf8')
const HOST = 'https://make-fetch-happen.npm'
const HTTPHOST = 'http://registry.npm.test.org'

nock.disableNetConnect()
t.beforeEach(() => nock.cleanAll())

t.test('requests remote content', async t => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT)

  const res = await fetch(`${HOST}/test`)
  t.equal(res.status, 200, 'successful status code')
  t.same(res.headers.get('x-fetch-attempts'), '1', 'sets the correct header')
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'request succeeded')
  t.ok(srv.isDone())
})

t.test('supports http', async t => {
  const srv = nock('http://foo.npm')
    .get('/test')
    .reply(200, CONTENT)

  const res = await fetch('http://foo.npm/test')
  t.equal(res.url, 'http://foo.npm/test', 'http request url')
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'request succeeded')
  t.ok(srv.isDone())
})

t.test('supports https', async t => {
  const srv = nock('https://foo.npm')
    .get('/test')
    .reply(200, CONTENT)

  const res = await fetch('https://foo.npm/test')
  t.equal(res.url, 'https://foo.npm/test', 'https request url')
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'request succeeded')
  t.ok(srv.isDone())
})

t.test('500-level responses not thrown', async t => {
  t.test('500 response', async (t) => {
    const srv = nock(HOST)
      .get('/test-500')
      .reply(500)

    const res = await fetch(`${HOST}/test-500`, { retry: { retries: 0 } })
    t.equal(res.status, 500, 'got regular response w/ errcode 500')
    t.ok(srv.isDone())
  })

  t.test('543 response', async (t) => {
    const srv = nock(HOST)
      .get('/test-543')
      .reply(543)

    const res = await fetch(`${HOST}/test-543`, { retry: { retries: 0 } })
    t.equal(res.status, 543, 'got regular response w/ errcode 543, as given')
    t.ok(srv.isDone())
  })
})

t.test('calls opts.onRetry', async t => {
  t.test('when request is retriable', async (t) => {
    const srv = nock(HOST)
      .get('/test-onretry')
      .reply(500)
      .get('/test-onretry')
      .reply(200)

    let retryNotification = 0
    let calledOnRetry = false

    const res = await fetch(`${HOST}/test-onretry`, {
      retry: {
        retries: 1,
      },
      onRetry: () => {
        calledOnRetry = true
        retryNotification++
      },
    })
    t.same(res.headers.get('x-fetch-attempts'), '2', 'set the appropriate header')
    t.equal(calledOnRetry, true, 'should have called onRetry')
    t.equal(retryNotification, 1, 'should have called method once')
    t.ok(srv.isDone())
  })

  t.test('when request is retriable; and caught', async (t) => {
    const srv = nock(HOST)
      .get('/catch-retry')
      .replyWithError({
        message: 'retry please',
        code: 'ECONNRESET',
      })
      .get('/catch-retry')
      .reply(200, CONTENT)

    let calledOnRetry = false

    const res = await fetch(`${HOST}/catch-retry`, {
      retry: {
        retries: 1,
      },
      onRetry: (err) => {
        t.equal(
          err.message,
          `request to ${HOST}/catch-retry failed, reason: retry please`,
          'correct error message'
        )
        t.equal(err.code, 'ECONNRESET', 'correct error code')
        calledOnRetry = true
      },
    })
    t.equal(res.headers.get('x-fetch-attempts'), '2', 'set the appropriate header')
    t.equal(calledOnRetry, true, 'should have called onRetry')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request succeeded')
    t.ok(srv.isDone())
  })

  t.test('onRetry not supplied', async (t) => {
    const srv = nock(HOST)
      .get('/catch-retry')
      .replyWithError({
        message: 'retry please',
        code: 'ECONNRESET',
      })
      .get('/catch-retry')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/catch-retry`, {
      retry: {
        retries: 1,
      },
      onRetry: null,
    })
    t.equal(res.status, 200, 'successful status code')
    t.equal(res.headers.get('x-fetch-attempts'), '2', 'set the appropriate header')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request succeeded')
    t.ok(srv.isDone())
  })
})

t.test('custom headers', async t => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      foo: (req) => {
        t.equal(req.headers.test[0], 'ayy', 'got request header')
        return 'bar'
      },
    })

  const res = await fetch(`${HOST}/test`, { headers: { test: 'ayy' } })
  t.equal(res.headers.get('foo'), 'bar', 'got response header')
  t.ok(srv.isDone())
})

t.test('custom headers (class)', async t => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT, {
      foo: (req) => {
        t.equal(req.headers.test[0], 'ayy', 'got request header')
        return 'bar'
      },
    })

  const res = await fetch(`${HOST}/test`, { headers: new Headers({ test: 'ayy' }) })
  t.equal(res.headers.get('foo'), 'bar', 'got response header')
  t.ok(srv.isDone())
})

t.test('supports redirect logic', async t => {
  t.test('simple redirect', async (t) => {
    const srv = nock(HOST)
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/redirect`)
    t.equal(res.redirected, true, 'should have been redirected')
    t.equal(res.url, `${HOST}/test`, 'should be from redirected url')
    t.equal(res.status, 200, 'got the final status')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'final req gave right body')
    t.ok(srv.isDone())
  })

  t.test('set manual redirect', async (t) => {
    const srv = nock(HOST)
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    const res = await fetch(`${HOST}/redirect`, { redirect: 'manual' })
    t.equal(res.redirected, false, 'should not have been redirected')
    t.equal(res.url, `${HOST}/redirect`, 'should be from original url')
    t.equal(res.status, 301, 'did not follow redirect')
    const buf = await res.buffer()
    t.equal(buf.length, 0, 'empty body')
    t.ok(srv.isDone())
  })

  t.test('supports error redirect flag', async (t) => {
    const srv = nock(HOST)
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    await t.rejects(
      fetch(`${HOST}/redirect`, { redirect: 'error' }),
      {
        message: 'redirect mode is set to error: https://make-fetch-happen.npm/redirect',
        code: 'ENOREDIRECT',
      }
    )
    t.ok(srv.isDone())
  })

  t.test('throws error when redirect location is missing', async (t) => {
    const srv = nock(HOST)
      .get('/redirect')
      .reply(301)

    const err = await fetch(`${HOST}/redirect`).catch(reqErr => reqErr)
    t.type(err, FetchError)
    t.equal(err.code, 'EINVALIDREDIRECT')
    t.ok(srv.isDone())
  })

  t.test('bad location header information', async (t) => {
    const srv = nock(HOST)
      .get('/redirect')
      .reply(301, '', { Location: 'ftp://nope' })

    await t.rejects(
      fetch(`${HOST}/redirect`)
    )
    t.ok(srv.isDone())
  })
})

t.test('supports protocol switching on redirect', async (t) => {
  t.test('redirect to https', async (t) => {
    const httpSrv = nock(HTTPHOST)
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    const httpsSrv = nock(HOST)
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HTTPHOST}/redirect`)
    t.equal(res.url, `${HOST}/test`, 'response should be from https')
    t.equal(res.redirected, true, 'response should have been redirected')
    t.equal(res.status, 200, 'got the final status')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'final req gave right body')
    t.ok(httpSrv.isDone())
    t.ok(httpsSrv.isDone())
  })

  t.test('manually redirect to https', async (t) => {
    const httpSrv = nock(HTTPHOST)
      .get('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })

    const res = await fetch(`${HTTPHOST}/redirect`, { redirect: 'manual' })
    t.equal(res.status, 301, 'did not follow redirect with manual mode')
    const buf = await res.buffer()
    t.equal(buf.length, 0, 'empty body')
    t.ok(httpSrv.isDone())
  })
})

t.test('removes authorization header if changing hostnames', async (t) => {
  const httpSrv = nock(HTTPHOST, {
    reqheaders: {
      authorization: 'test',
    },
  })
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  const httpsSrv = nock(HOST, {
    reqheaders: {
      authorization: 'test',
    },
  })
    .get('/test')
    .reply(200, () => {
      t.equal(true, false, 'meaningful failure, this should never be executed')
      return CONTENT
    })

  await t.rejects(
    fetch(`${HTTPHOST}/redirect`, { headers: { authorization: 'test' } }),
    {
      code: 'ERR_NOCK_NO_MATCH', // this is the error nock throws due to the missing header
    }
  )
  t.ok(httpSrv.isDone())
  t.notOk(httpsSrv.isDone(), 'redirect request does not happen')
})

t.test('removes cookie header if changing hostnames', async (t) => {
  const httpSrv = nock(HTTPHOST, {
    reqheaders: {
      cookie: 'test=true',
    },
  })
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  const httpsSrv = nock(HOST, {
    reqheaders: {
      cookie: 'test=true',
    },
  })
    .get('/test')
    .reply(200, () => {
      t.equal(true, false, 'meaningful failure, this should never be executed')
      return CONTENT
    })

  await t.rejects(
    fetch(`${HTTPHOST}/redirect`, { headers: { cookie: 'test=true' } }),
    {
      code: 'ERR_NOCK_NO_MATCH', // this is the error nock throws due to the missing header
    }
  )
  t.ok(httpSrv.isDone())
  t.notOk(httpsSrv.isDone(), 'redirect request does not happen')
})

t.test('supports passthrough of options on redirect', async (t) => {
  const httpSrv = nock(HTTPHOST)
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  const httpsSrv = nock(HOST)
    .get('/test')
    .matchHeader('x-test', 'test')
    .reply(200, CONTENT, {
      'test-header': (req, res, body) => {
        t.ok(req.headers['x-test'].length)
        t.equal(req.headers['x-test'][0], 'test', 'headers from redriect')
        return 'truthy'
      },
    })

  const res = await fetch(`${HTTPHOST}/redirect`, { headers: { 'x-test': 'test' } })
  t.equal(res.status, 200, 'successful status code')
  t.equal(res.redirected, true, 'request was redirected')
  t.equal(res.headers.get('test-header'), 'truthy', 'should get test header')
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'request succeeded')
  t.ok(httpSrv.isDone())
  t.ok(httpsSrv.isDone())
})

t.test('supports redirects from POST requests', async (t) => {
  t.test('supports 301 redirects', async (t) => {
    const srv = nock(HOST)
      .post('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/redirect`, {
      method: 'POST',
      body: 'test',
    })
    t.equal(res.status, 200, 'successful status code')
    t.equal(res.redirected, true, 'request was redirected')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request succeeded')
    t.ok(srv.isDone())
  })

  t.test('can cache target of 301 redirect', async (t) => {
    const dir = t.testdir()
    const srv = nock(HOST)
      .post('/redirect')
      .reply(301, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT, {
        'content-length': CONTENT.length,
        'cache-control': 'max-age=300',
        etag: '"beefcafe"',
      })

    const res = await fetch(`${HOST}/redirect`, {
      cachePath: dir,
      method: 'POST',
      body: 'test',
    })

    t.equal(res.status, 200, 'successful status code')
    t.equal(res.redirected, true, 'request was redirected')
    t.equal(res.headers.get('x-local-cache-status'), 'miss', 'adds cache related header')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request succeeded')
    // done with nock at this point, next request reads from cache
    t.ok(srv.isDone())

    const secondRes = await fetch(`${HOST}/test`, {
      cachePath: dir,
    })
    t.equal(secondRes.status, 200, 'successful status code')
    t.equal(secondRes.headers.get('x-local-cache-status'), 'hit', 'read from cache')
  })

  t.test('supports 302 redirects', async (t) => {
    const srv = nock(HOST)
      .post('/redirect')
      .reply(302, '', { Location: `${HOST}/test` })
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/redirect`, {
      method: 'POST',
      body: 'test',
    })
    t.equal(res.status, 200, 'successful status code')
    t.equal(res.redirected, true, 'request was redirected')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request succeeded')
    t.ok(srv.isDone())
  })
})

t.test('throws error if follow is less than request count', async (t) => {
  const srv = nock(HOST)
    .get('/redirect')
    .reply(301, '', { Location: `${HOST}/test` })

  await t.rejects(fetch(`${HOST}/redirect`, { follow: 0 }),
    {
      message: 'maximum redirect reached at: https://make-fetch-happen.npm/redirect',
      code: 'EMAXREDIRECT',
    }
  )
  t.ok(srv.isDone())
})

t.test('supports streaming content', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .reply(200, CONTENT)

  const res = await fetch(`${HOST}/test`)
  t.equal(res.status, 200, 'successful status code')
  const buf = []
  let bufLen = 0
  res.body.on('data', d => {
    buf.push(d)
    bufLen += d.length
  })
  await res.body.promise()
  const body = Buffer.concat(buf, bufLen)
  t.same(body, CONTENT, 'streamed body ok')
  t.ok(srv.isDone())
})

t.test('supports proxy configurations', { skip: true }, async (t) => {
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
  const res = await fetch('http://npm.im/make-fetch-happen', {
    proxy: 'http://localhost:9854',
    retry: {
      retries: 0,
    },
  })
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'request succeeded')
})

t.test('supports custom agent config', async (t) => {
  const srv = nock(HOST, { date: new Date().toISOString() })
    .get('/test')
    .reply(200, function () {
      t.equal(this.req.headers.connection[0], 'close', 'one-shot agent!')
      return CONTENT
    })

  const res = await fetch(`${HOST}/test`, { agent: false })
  t.equal(res.status, 200)
  const buf = await res.buffer()
  t.same(buf, CONTENT, 'request succeeded')
  t.ok(srv.isDone())
})

t.test('handles 15 concurrent requests', async (t) => {
  const srv = nock(HOST)
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
  const results = await Promise.all(requests)
  t.same(results, expected, 'all requests resolved successfully')
  t.ok(srv.isDone())
})

t.test('handle integrity options', async (t) => {
  /* eslint-disable-next-line max-len */
  const integrity = 'sha512-MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw=='
  const data = 'hello world'

  t.test('valid integrity value', async (t) => {
    const srv = nock(HOST)
      .get('/integrity')
      .twice()
      .reply(200, data)

    const firstRes = await fetch(`${HOST}/integrity`, { integrity })
    t.equal(firstRes.status, 200, 'successful status code')
    t.ok(Minipass.isStream(firstRes.body), 'body is a stream')
    const firstBuf = await firstRes.buffer()
    t.same(firstBuf.toString(), data, 'request succeeded')

    const secondRes = await fetch(`${HOST}/integrity`, { integrity })
    t.equal(secondRes.status, 200, 'successful status code')
    t.ok(Minipass.isStream(secondRes.body), 'body is a stream')
    const secondBuf = await secondRes.buffer()
    t.same(secondBuf.toString(), data, 'request succeeded')
    t.ok(srv.isDone())
  })

  // TODO: have isaac make this test work
  t.test('valid integrity value', { skip: true }, async (t) => {
    const srv = nock(HOST)
      .get('/integrity')
      .reply(200, data)

    /* eslint-disable-next-line max-len */
    const badIntegrity = 'sha512-MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXJJ=='

    const res = await fetch(`${HOST}/integrity`, { integrity: badIntegrity })
    t.equal(res.status, 200, 'successful status code')
    t.ok(Minipass.isStream(res.body), 'body is a stream')
    const buf = await res.buffer()
    t.same(buf.toString(), data, 'request succeeded')
    t.ok(srv.isDone())
  })
})

t.test('supports opts.timeout for controlling request timeout time', async (t) => {
  const srv = nock(HOST)
    .get('/test')
    .delay(10)
    .reply(200, CONTENT)

  await t.rejects(
    fetch(`${HOST}/test`, { timeout: 1, retry: { retries: 0 } }),
    {
      code: 'FETCH_ERROR',
      type: 'request-timeout',
    }
  )
  t.ok(srv.isDone())
})

t.test('retries non-POST requests on timeouts', async (t) => {
  t.test('retries request', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .delay(100)
      .times(4)
      .reply(200)
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/test`, {
      timeout: 10,
      retry: {
        retries: 4,
        minTimeout: 5,
      },
    })
    t.equal(res.headers.get('x-fetch-attempts'), '5', 'fetched five times')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request retried until success')
    t.ok(srv.isDone())
  })

  t.test('throws if not enough retries', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .delay(100)
      .times(2)
      .reply(200)

    await t.rejects(
      fetch(`${HOST}/test`, {
        timeout: 10,
        retry: { retries: 1, minTimeout: 1 },
      }),
      {
        type: 'request-timeout',
      }
    )
    t.ok(srv.isDone())
  })
})

t.test('retries non-POST requests on 500 errors', async (t) => {
  t.test('retries request', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .times(4)
      .reply(500)
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/test`, {
      retry: {
        retries: 4,
        minTimeout: 5,
      },
    })
    t.equal(res.headers.get('x-fetch-attempts'), '5', 'five request attempts')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'request retried until success')
    t.ok(srv.isDone())
  })

  t.test('returns 500 if at max retries', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .twice()
      .reply(500)

    const res = await fetch(`${HOST}/test`, {
      retry: {
        retries: 1,
        minTimeout: 1,
      },
    })
    t.equal(res.status, 500, 'got bad request back on failure')
    t.equal(res.headers.get('x-fetch-attempts'), '2', 'two request attempts')
    t.ok(srv.isDone())
  })

  t.test('returns 500 error on POST requests', async (t) => {
    const srv = nock(HOST)
      .post('/test')
      .reply(500)

    const res = await fetch(`${HOST}/test`, {
      method: 'POST',
      retry: {
        retries: 3,
        minTimeout: 1,
      },
    })
    t.equal(res.status, 500, 'bad post gives a 500 without retries')
    t.equal(res.headers.get('x-fetch-attempts'), '1', 'one request attempts')
    t.ok(srv.isDone())
  })

  t.test('does not retry because POST body is stream', async (t) => {
    const srv = nock(HOST)
      .put('/test')
      .reply(500)

    const stream = new Minipass()
    setTimeout(() => {
      stream.write('bleh')
      stream.end()
    }, 50)

    const res = await fetch(`${HOST}/test`, {
      method: 'put',
      body: stream,
      retry: { retries: 5, minTimeout: 1 },
    })
    t.equal(res.status, 500, 'bad put does not retry because body is stream')
    t.equal(res.headers.get('x-fetch-attempts'), '1', 'one request attempts')
    t.ok(srv.isDone())
  })

  t.test('successfully retries with request body', async (t) => {
    const srv = nock(HOST)
      .put('/put-test')
      .times(4)
      .reply(500)
      .put('/put-test')
      .reply(201, (uri, reqBody) => {
        t.same(reqBody, 'great success!', 'PUT data match')
        return CONTENT
      })

    const res = await fetch(`${HOST}/put-test`, {
      method: 'PUT',
      body: Buffer.from('great success!'),
      retry: {
        retries: 4,
        minTimeout: 5,
      },
    })
    t.equal(res.status, 201, 'successful response')
    t.equal(res.headers.get('x-fetch-attempts'), '5', 'five request attempts')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'got content after multiple attempts')
    t.ok(srv.isDone())
  })
})

t.test('accepts opts.retry shorthands', async (t) => {
  t.test('false value for retry', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .reply(500)

    const res = await fetch(`${HOST}/test`, { retry: false })
    t.equal(res.status, 500, 'did not retry')
    t.equal(res.headers.get('x-fetch-attempts'), '1', 'one request attempt')
    t.ok(srv.isDone())
  })

  t.test('numeric value for retry', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .reply(500, '')
      .get('/test')
      .reply(200, CONTENT)

    const res = await fetch(`${HOST}/test`, { retry: 1 })
    t.equal(res.status, 200, 'retried once')
    t.equal(res.headers.get('x-fetch-attempts'), '2', 'two request attempts')
    const buf = await res.buffer()
    t.same(buf, CONTENT, 'successful request')
    t.ok(srv.isDone())
  })

  t.test('numeric value for retry, with error', async (t) => {
    const srv = nock(HOST)
      .get('/test')
      .twice()
      .reply(500)

    const res = await fetch(`${HOST}/test`, { retry: 1 })
    t.equal(res.status, 500, 'failed on second retry')
    t.equal(res.headers.get('x-fetch-attempts'), '2', 'two request attempts')
    t.ok(srv.isDone())
  })
})

// TODO this task is suuuuuuper hacky, if we want to keep it
// it needs to be very much less hacky
/*
t.test('pass opts to fetch.Request as well as agent', async (t) => {
  const agent = { this_is_the_agent: true }
  const ca = 'ca'
  const timeout = 'timeout'
  const cert = 'cert'
  const key = 'key'
  const rejectUnauthorized = 'rejectUnauthorized'

  let req = null
  const fetch = t.mock('../lib/index.js', {
    'minipass-fetch': Object.assign(async request => {
      t.equal(request, req, 'got the request object')
      return {
        headers: new Map(),
        status: 200,
        method: 'GET',
      }
    }, require('minipass-fetch'), {
      Request: class Request {
        constructor (request, reqOpts) {
          req = this
          this.headers = new Map()
          t.match(reqOpts, { agent, ca, timeout, cert, key, rejectUnauthorized })
        }
      },
    }),
    '../lib/agent.js': (uri, opts) => agent,
  })

  await fetch(`${HOST}/test`, {
    agent,
    ca,
    timeout,
    cert,
    key,
    strictSSL: rejectUnauthorized,
  })
})
*/

// test('retries non-POST requests on ECONNRESET')
// test('supports automatic agent pooling on unique configs')
