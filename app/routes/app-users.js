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

const { requireToken } = require('../middleware/device')

/*
 * AppUser routes
 */

/*
 * Install route
 */
router.get(
  '/:id',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  controller.getAppUsers
)

/*
 * Install route
 */
router.post(
  '/install',
  requireToken,
  trimRequest.all,
  validate.install,
  controller.install
)

/*
 * Uninstall route
 */
router.post(
  '/uninstall',
  requireToken,
  trimRequest.all,
  validate.uninstall,
  controller.uninstall
)

/*
 * Get stats of live
 */
router.get(
  '/user/stats',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  controller.getAppStats
)
/*
 * Get stats of live
 */
router.get(
  '/publisher/install',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  controller.getPublisherInstallStats
)

/*
 * App User Installed route
 */
router.get(
  '/installed/:id',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLES),
  controller.getInstalledUsers
)
// /*
//  * Get installed data route
//  */
// router.get(
//   '/appUserInfo/:id',
//   requireAuth,
//   AuthController.requireApproval,
//   AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
//   trimRequest.all,
//   controller.getAppUserInfo
// )
module.exports = router
