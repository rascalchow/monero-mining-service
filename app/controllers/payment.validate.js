const { check } = require('express-validator')
const { validationResult } = require('../middleware/utils')

exports.onBlockReward = [
  check('monero')
    .exists()
    .withMessage('MISSING'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]

exports.withdraw = [
  check('payoutAddress')
    .exists()
    .withMessage('MISSING'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
