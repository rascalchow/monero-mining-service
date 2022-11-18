const controller = require('../controllers/appUsers')
const express = require('express')
const router = express.Router()
const validate = require('../controllers/appUsers.validate')
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
  validate.uninstall,
  controller.uninstall
)

module.exports = router
