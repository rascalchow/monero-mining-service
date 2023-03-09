const controller = require('../controllers/profile')
const validate = require('../controllers/profile.validate')
const AuthController = require('../controllers/auth')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')
const CONSTS = require('../consts')

/*
 * Profile routes
 */

/*
 * Get profile route
 */
router.get(
  '/',
  requireAuth,
  AuthController.requireNotDisabled,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  trimRequest.all,
  controller.getProfile
)

/*
 * Update profile route
 */
router.patch(
  '/',
  requireAuth,
  AuthController.requireNotDisabled,
  AuthController.requireNotPending,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  trimRequest.all,
  validate.updateProfile,
  controller.updateProfile
)

router.patch(
  '/payoutCurrency',
  requireAuth,
  AuthController.requireNotDisabled,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  validate.updateCurrency,
  controller.updateCurrency,
)

module.exports = router
