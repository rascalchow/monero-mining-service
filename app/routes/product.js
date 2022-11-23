const controller = require('../controllers/product')
const validate = require('../controllers/product.validate')
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
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.get
)

/*
 * Update profile route
 */
router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  validate.update,
  controller.update
)

module.exports = router
