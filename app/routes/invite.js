const controller = require('../controllers/invite')
// const validate = require('../controllers/product.validate')
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
 * Get invite route
 */
router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.get
)

/*
 * Post invite route
 */
router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.create
)


/*
 * Get check invite route
 */
router.get(
  '/check-code/:id',
  // requireAuth,
  // AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.checkCode
)

module.exports = router
