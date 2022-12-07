const controller = require('../controllers/eula')
const validate = require('../controllers/eula.validate')
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

router.get(
  '/',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.getUserEula
)

router.patch(
  '/',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  validate.updateUserEula,
  controller.updateUserEula
)

module.exports = router
