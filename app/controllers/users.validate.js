const { validationResult } = require('../middleware/utils')
const validator = require('validator')
const { check } = require('express-validator')
const validationUtil = require('../../utils/validation')
const _ = require('lodash')
/**
 * Validates create new item request
 */
exports.createItem = [
  check('name')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('email')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isEmail()
    .withMessage('EMAIL_IS_NOT_VALID'),
  check('password')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isLength({
      min: 5
    })
    .withMessage('PASSWORD_TOO_SHORT_MIN_5'),
  check('role')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isIn(['user', 'admin'])
    .withMessage('USER_NOT_IN_KNOWN_ROLE'),
  check('phone')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]

/**
 * Validates update item request
 */
exports.updateItem = [
  check('name')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('email')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isEmail()
    .withMessage('EMAIL_IS_NOT_VALID'),
  // check('password')
  //   .optional()
  //   .not()
  //   .isEmpty()
  //   .withMessage('IS_EMPTY')
  //   .isLength({
  //     min: 5
  //   })
  //   .withMessage('PASSWORD_TOO_SHORT_MIN_5'),
  // check('role')
  //   .optional()
  //   .not()
  //   .isEmpty()
  //   .withMessage('IS_EMPTY')
  //   .isIn(['user', 'admin'])
  //   .withMessage('USER_NOT_IN_KNOWN_ROLE'),
  check('phone')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  // check('status')
  //   .optional()
  //   .not()
  //   .isEmpty()
  //   .withMessage('IS_EMPTY')
  //   .trim(),

  // check('id')
  //   .exists()
  //   .withMessage('MISSING')
  //   .not()
  //   .isEmpty()
  //   .withMessage('IS_EMPTY'),
  check('companyName')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),

  check('application')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  check('contact')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  check('country')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  check('website')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  check('moreInformation')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  check('instantMessenger')
    .optional()
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .trim(),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]

/**
 * Validates get item request
 */
exports.getItem = [
  check('id')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]

/**
 * Validates delete item request
 */
exports.deleteItem = [
  check('id')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
exports.approveUser = [
  check('id')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
exports.rejectUser = [
  check('id')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
