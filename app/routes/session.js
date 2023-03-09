const express = require('express')
const router = express.Router()
const validate = require('../controllers/session.validate')
const controller = require('../controllers/session')
const trimRequest = require('trim-request')
const { requireToken } = require('../middleware/device')
const AuthController = require('../controllers/auth')
const CONSTS = require('../consts')
const passport = require('passport')

const requireAuth = passport.authenticate('jwt', {
  session: false
})

router.post(
  '/start-running',
  requireToken,
  trimRequest.all,
  validate.startRunning,
  controller.startRunning
)

router.post(
  '/end-running',
  requireToken,
  trimRequest.all,
  controller.endRunning
)

router.get(
  '/livetime/:id',
  requireAuth,
  trimRequest.all,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.ADMIN),
  controller.getLiveTime
)

router.get(
  '/publisher/livetime',
  requireAuth,
  trimRequest.all,
  AuthController.requireApproval,
  AuthController.roleAuthorization(CONSTS.USER.ROLE.PUBLISHER),
  controller.getPublisherLiveTimeStat
)

router.post(
  '/running-now',
  // requireToken,
  // trimRequest.all,
  controller.runningNow
)

module.exports = router
