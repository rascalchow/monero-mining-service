const express = require('express')
const router = express.Router()
const controller = require('../controllers/settings')
const validate = require('../controllers/settings.validate')
const { roleAuthorization } = require('../controllers/auth')

require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})

const trimRequest = require('trim-request')
const CONSTS = require('../consts')

/*
 * App config routes
 */

/*
 * update eula route
 */
router.get(
  '/eula',
  requireAuth,
  roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  controller.getEula
)

/*
 * update eula route
 */
router.patch(
  '/eula',
  requireAuth,
  roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  trimRequest.all,
  validate.updateEula,
  controller.updateEula
)

module.exports = router
