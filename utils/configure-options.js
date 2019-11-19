'use strict'

const initializeCache = require('./initialize-cache')

module.exports = function configureOptions (_opts) {
  const opts = Object.assign({}, _opts || {})
  opts.method = (opts.method || 'GET').toUpperCase()

  if (opts.retry) {
    if (typeof opts.retry === 'number') {
      opts.retry = { retries: opts.retry }
    } else if (typeof opts.retry === 'string') {
      const value = parseInt(opts.retry, 10)
      if (value) {
        opts.retry = { retries: value }
      } else {
        opts.retry = { retries: 0 }
      }
    } else {
      opts.retry = { retries: 0 }
    }
  } else {
    // opts.retry was falsy; set default
    opts.retry = { retries: 0 }
  }

  if (opts.cacheManager) {
    initializeCache(opts)
  }

  return opts
}
