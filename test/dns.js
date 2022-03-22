const t = require('tap')

const dns = require('../lib/dns.js')
const DEFAULT_OPTS = { ttl: 5 * 60 * 1000 }

t.afterEach(() => dns.lookupCache.clear())

t.test('supports no options passed', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    t.match(options, dns.defaultOptions, 'applied default options')
    process.nextTick(callback, null, '127.0.0.1', 4)
  }
  const lookup = dns.getLookup({ ...DEFAULT_OPTS, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  })
})

t.test('supports family passed directly as options', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    t.match(options, { ...dns.defaultOptions, family: 4 }, 'kept family setting')
    process.nextTick(callback, null, '127.0.0.1', 4)
  }
  const lookup = dns.getLookup({ ...DEFAULT_OPTS, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', 4, (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  })
})

t.test('reads from cache', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    t.match(options, dns.defaultOptions, 'applied default options')
    process.nextTick(callback, null, '127.0.0.1', 4)
  }
  const lookup = dns.getLookup({ ...DEFAULT_OPTS, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  }).then(() => new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was still only called once')
      resolve()
    })
  }))
})

t.test('does not cache errors', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    if (lookupCalled === 1) {
      process.nextTick(callback, new Error('failed'))
      return
    }

    t.match(options, dns.defaultOptions, 'applied default options')
    process.nextTick(callback, null, '127.0.0.1', 4)
  }
  const lookup = dns.getLookup({ ...DEFAULT_OPTS, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.match(err, { message: 'failed' }, 'got the error')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  }).then(() => new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 2, 'lookup was now called twice')
      resolve()
    })
  })).then(() => new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 2, 'lookup was still only called twice')
      resolve()
    })
  }))
})

t.test('varies when options change', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    if (lookupCalled === 1) {
      t.match(options, dns.defaultOptions, 'applied default options')
      process.nextTick(callback, null, '127.0.0.1', 4)
    } else {
      t.match(options, { ...dns.defaultOptions, family: 6 }, 'kept family from second lookup')
      process.nextTick(callback, null, '::1', 6)
    }
  }
  const lookup = dns.getLookup({ ...DEFAULT_OPTS, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  }).then(() => new Promise((resolve) => {
    lookup('localhost', { family: 6 }, (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '::1', 'got address')
      t.equal(family, 6, 'got family')
      t.equal(lookupCalled, 2, 'lookup was called twice')
      resolve()
    })
  }))
})

t.test('lookup can return all results', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    t.match(options, { ...dns.defaultOptions, all: true }, 'applied default options')
    process.nextTick(callback, null, [{
      address: '127.0.0.1', family: 4,
    }, {
      address: '::1', family: 6,
    }])
  }
  const lookup = dns.getLookup({ ...DEFAULT_OPTS, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', { all: true }, (err, addresses) => {
      t.equal(err, null, 'no error')
      t.match(addresses, [{
        address: '127.0.0.1', family: 4,
      }, {
        address: '::1', family: 6,
      }], 'got all addresses')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  }).then(() => new Promise((resolve) => {
    lookup('localhost', { all: true }, (err, addresses) => {
      t.equal(err, null, 'no error')
      t.match(addresses, [{
        address: '127.0.0.1', family: 4,
      }, {
        address: '::1', family: 6,
      }], 'got all addresses')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  }))
})

t.test('respects ttl option', async (t) => {
  let lookupCalled = 0
  const fakeLookup = (hostname, options, callback) => {
    lookupCalled += 1
    t.match(options, dns.defaultOptions, 'applied default options')
    process.nextTick(callback, null, '127.0.0.1', 4)
  }
  const lookup = dns.getLookup({ ttl: 10, lookup: fakeLookup })

  return new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was called once')
      resolve()
    })
  }).then(() => new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 1, 'lookup was still only called once')
      // delay before the next request to allow the ttl to invalidate
      setTimeout(resolve, 15)
    })
  })).then(() => new Promise((resolve) => {
    lookup('localhost', (err, address, family) => {
      t.equal(err, null, 'no error')
      t.equal(address, '127.0.0.1', 'got address')
      t.equal(family, 4, 'got family')
      t.equal(lookupCalled, 2, 'lookup was now called twice')
      resolve()
    })
  }))
})
