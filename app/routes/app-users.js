const controller = require('../controllers/app-users')
const express = require('express')
const router = express.Router()
const validate = require('../controllers/app-users.validate')
const AuthController = require('../controllers/auth')
const CONSTS = require('../consts')
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})

const trimRequest = require('trim-request')

/*
 * AppUser routes
 */

/*
 * Install route
 */
router.post(
  '/install',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  validate.install,
  controller.install
)

/*
 * Uninstall route
 */
router.post(
  '/uninstall',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  validate.uninstall,
  controller.uninstall
)

/*
 * Get installed/uninstalled app counts
 */
router.get(
  '/stats',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  controller.getAppStats
)

module.exports = router
