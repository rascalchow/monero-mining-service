const express = require('express')
const router = express.Router()
const trimRequest = require('trim-request')
const passport = require('passport')

const controller = require('../controllers/payment')
const validate = require('../controllers/payment.validate')
const { requireToken } = require('../middleware/device')
const AuthController = require('../controllers/auth')
const CONSTS = require('../consts')
require('../../config/passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})

/*
 * Set current version
 */
router.post(
  '/on-block-reward',
  requireToken,
  trimRequest.all,
  validate.onBlockReward,
  controller.onBlockReward
)

router.post(
  '/withdraw',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  validate.withdraw,
  controller.withdraw
)

router.get('/currencies', controller.listCurrencies)

router.get(
  '/estimate_exchange',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.estimateExchange
)

router.get(
  '/withdraw_status',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.checkWithdrawStatus
)

module.exports = router
