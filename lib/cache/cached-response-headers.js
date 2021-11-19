
// allow list for response headers that will be written to the cache index
// note: we must not store the real response's age header, or when we load
// a cache policy based on the metadata it will think the cached response
// is always stale
const CACHED_RESPONSE_HEADERS = [
  'cache-control',
  'content-encoding',
  'content-language',
  'content-type',
  'date',
  'etag',
  'expires',
  'last-modified',
  'location',
  'pragma',
  'vary',
]

module.exports = CACHED_RESPONSE_HEADERS
