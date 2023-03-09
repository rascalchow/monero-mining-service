const controller = require('../controllers/auth')
const validate = require('../controllers/auth.validate')
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
 * Auth routes
 */

/*
 * Register route
 */
router.post('/register', validate.register, controller.register)

/*
 * Verify route
 */
router.post('/verify', trimRequest.all, validate.verify, controller.verify)

/*
 * Forgot password route
 */
router.post(
  '/forgot',
  trimRequest.all,
  validate.forgotPassword,
  controller.forgotPassword
)

/*
 * Reset password route
 */
router.post(
  '/reset',
  trimRequest.all,
  validate.resetPassword,
  controller.resetPassword
)

/*
 * Get new refresh token
 */
router.get(
  '/token',
  requireAuth,
  AuthController.requireNotDisabled,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  trimRequest.all,
  controller.getRefreshToken
)

/*
 * Login route
 */
router.post('/login', trimRequest.all, validate.login, controller.login)

/*
 * Change password
 */
router.patch(
  '/change-password',
  requireAuth,
  AuthController.requireNotDisabled,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  trimRequest.all,
  validate.changePassword,
  controller.changePassword
)

/*
 * Update item route
 */
router.patch(
  '/profile',
  requireAuth,
  AuthController.requireNotDisabled,
  AuthController.requireNotPending,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  trimRequest.all,
  controller.updateProfile
)

module.exports = router
