'use strict'

module.exports = function iterableToObject (iter) {
  const obj = {}
  for (let k of iter.keys()) {
    obj[k] = iter.get(k)
  }
  return obj
}
