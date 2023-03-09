const { validationResult } = require('../middleware/utils')
const validator = require('validator')
const { check } = require('express-validator')
const validationUtil = require('../../utils/validation')

/**
 * Validates update profile request
 */
exports.updateProfile = [
  check('name')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('phone')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),

  (req, res, next) => {
    validationResult(req, res, next)
  }
]

exports.updateCurrency = [
  check('currency')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),

  (req, res, next) => {
    validationResult(req, res, next)
  }
]
