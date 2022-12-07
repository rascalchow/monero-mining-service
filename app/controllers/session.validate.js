const { validationResult } = require('../middleware/utils')
const { check } = require('express-validator')

exports.startRunning = [
  check('userKey')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .matches('[0-9A-Z]{8}')
    .withMessage('USER_KEY_IS_NOT_VALID'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
