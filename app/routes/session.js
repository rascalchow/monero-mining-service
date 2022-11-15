const express = require('express')
const router = express.Router()
const validate = require('../controllers/session.validate')
const controller = require('../controllers/session')
const trimRequest = require('trim-request')
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})

router.post(
  '/start-running',
  requireAuth,
  trimRequest.all,
  validate.startRunning,
  controller.startRunning
)

router.post(
  '/end-running',
  requireAuth,
  trimRequest.all,
  validate.endRunning,
  controller.endRunning
)

module.exports = router
