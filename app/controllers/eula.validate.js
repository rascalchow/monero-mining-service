const { check } = require('express-validator')
const { validationResult } = require('../middleware/utils')

exports.updateUserEula = [
  check('eula')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
