const controller = require('../controllers/users')
const validate = require('../controllers/users.validate')
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
 * Users routes
 */

/*
 * Get items route
 */
router.get(
  '/',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  controller.getItems
)

/*
 * Get installed data route
 */
router.get(
  '/appUserInfo/:id',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  controller.getAppUserInfo
)

router.get(
  '/',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  controller.getItems
)

/*
 * Create new item route
 */
router.post(
  '/',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.createItem,
  controller.createItem
)

/*
 * Get item route
 */
router.get(
  '/:id',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.getItem,
  controller.getItem
)

/*
 * Update item route
 */
router.patch(
  '/:id',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.updateItem,
  controller.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)

router.post(
  '/:id/approve',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.approveUser,
  controller.approveUser
)

router.post(
  '/:id/reject',
  requireAuth,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.rejectUser,
  controller.rejectUser
)

module.exports = router
