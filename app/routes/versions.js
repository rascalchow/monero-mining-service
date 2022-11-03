const express = require('express')
const router = express.Router()
const trimRequest = require('trim-request')

const controller = require('../controllers/versions')
const validate = require('../controllers/versions.validate')
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})

/*
 * Set current version
 */
router.post(
  '/set-current-version',
  requireAuth,
  trimRequest.all,
  validate.setCurrent,
  controller.setCurrent,
)

/*
 * Get current version
 */
router.get(
  '/get-current-version',
  requireAuth,
  trimRequest.all,
  controller.getCurrent,
)

module.exports = router