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
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.get
)

router.get(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  controller.getPublisherInvites
)

/*
 * Post invite route
 */
router.post(
  '/',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.create
)

/*
 * Delete invite route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.remove
)

/*
 * Get check invite route
 */
router.get('/check-code/:id', trimRequest.all, controller.checkCode)

/*
 * Get referrals route
 */
router.get(
  '/referrals/:id',
  requireAuth,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  controller.getReferrals
)

/*
 * Get referrals route
 */
router.get(
  '/publisher/referrals',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  trimRequest.all,
  controller.getPublisherReferrals
)

module.exports = router
