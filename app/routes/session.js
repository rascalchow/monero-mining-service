const express = require('express')
const router = express.Router()
const validate = require('../controllers/session.validate')
const controller = require('../controllers/session')
const trimRequest = require('trim-request')
const { requireToken } = require('../middleware/device')

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

module.exports = router
