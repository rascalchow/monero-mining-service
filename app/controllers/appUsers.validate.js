const { validationResult } = require('../middleware/utils')
const { check } = require('express-validator')

/**
 * Validates install request
 */
exports.install = [
  check('publisherKey')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .matches('[0-9a-zA-Z]{8}')
    .withMessage('PUBLISHER_KEY_IS_NOT_VALID'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
