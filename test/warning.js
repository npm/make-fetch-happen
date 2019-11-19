'use strict'

const Fetch = require('minipass-fetch')
const { test } = require('tap')

const setWarning = require('../warning')

test('setWarning', (t) => {
  const code = 999
  const message = { hello: 'world' }
  const url = 'https://google.com'

  t.test('validate append headers', (t) => {
    const date = JSON.stringify(new Date().toUTCString())
    const replace = false

    const headers = new Fetch.Headers()
    const req = new Fetch.Request(url, { headers })

    const origHeaderAppend = req.headers.append

    req.headers.append = (...args) => {
      const expectedValue = `999 google.com {"hello":"world"} ${date}`

      t.equal('Warning', args[0])
      t.same(expectedValue, args[1])
      return origHeaderAppend.call(headers, ...args)
    }

    setWarning(req, code, message, replace)

    req.headers.append = origHeaderAppend
    t.end()
  })

  t.test('validate set headers', (t) => {
    const date = JSON.stringify(new Date().toUTCString())
    const replace = true

    const headers = new Fetch.Headers({ 'Warning': 'world' })
    const req = new Fetch.Request(url, { headers })

    const origHeaderSet = req.headers.set

    req.headers.set = (...args) => {
      const expectedValue = `999 google.com {"hello":"world"} ${date}`

      t.equal('Warning', args[0])
      t.same(expectedValue, args[1])
      return origHeaderSet.call(headers, ...args)
    }

    setWarning(req, code, message, replace)

    req.headers.set = origHeaderSet
    t.end()
  })

  t.end()
})
