'use strict'

const events = require('events')
const ssri = require('ssri')
const t = require('tap')

const CachingMinipassPipeline = require('../lib/pipeline.js')

t.test('caches events and emits them again for new listeners', async (t) => {
  const INTEGRITY = ssri.fromData('foobarbazbuzz')
  const integrityStream = ssri.integrityStream()
  const pipeline = new CachingMinipassPipeline({ events: ['integrity', 'size'] }, integrityStream)
  integrityStream.on('size', s => pipeline.emit('size', s))
  integrityStream.on('integrity', i => pipeline.emit('integrity', i))

  pipeline.write('foobarbazbuzz')
  pipeline.resume()
  // delay ending the stream so the early listeners will get the first events
  setImmediate(() => pipeline.end())

  const [earlySize, earlyIntegrity] = await Promise.all([
    events.once(pipeline, 'size').then(res => res[0]),
    events.once(pipeline, 'integrity').then(res => res[0]),
  ])

  // now wait for the stream itself to have ended
  await pipeline.promise()

  // and add new listeners
  const [lateSize, lateIntegrity] = await Promise.all([
    events.once(pipeline, 'size').then(res => res[0]),
    events.once(pipeline, 'integrity').then(res => res[0]),
  ])

  // and make sure we got the same results
  t.equal(earlySize, 13, 'got the right size')
  t.same(earlyIntegrity, INTEGRITY, 'got the right integrity')
  t.same(earlySize, lateSize, 'got the same size early and late')
  t.same(earlyIntegrity, lateIntegrity, 'got the same integrity early and late')
})
