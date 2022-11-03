const { check } = require('express-validator')
const { validationResult } = require('../middleware/utils')

exports.setCurrent = [
  check('version')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .matches('([0-9]+\.)*[0-9]+')
    .withMessage('VERSION_IS_NOT_VALID'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]