const _ = require('lodash')

module.exports = {
  isValidObjectId(val) {
    const regexp = /^[0-9a-fA-F]{24}$/
    return _.isString(val) && regexp.test(val)
  },
  isValidEmail(val) {
    const regexp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
    return _.isString(val) && regexp.test(val)
  },
  isValidLink(val) {
    const regexp = /^http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
    return _.isString(val) && regexp.test(val)
  },
  isValidHttp(val) {
    const regexp = /^http(s)?:\/\/.*/g
    return _.isString(val) && regexp.test(val)
  }
}
