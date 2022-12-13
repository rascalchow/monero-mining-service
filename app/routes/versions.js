const express = require('express')
const router = express.Router()
const trimRequest = require('trim-request')

const controller = require('../controllers/versions')
const validate = require('../controllers/versions.validate')
const { requireToken } = require('../middleware/device')

/*
 * Set current version
 */
router.post(
  '/set-current-version',
  requireToken,
  trimRequest.all,
  validate.setCurrent,
  controller.setCurrent
)

/*
 * Get current version
 */
router.get(
  '/get-current-version',
  requireToken,
  trimRequest.all,
  controller.getCurrent
)

module.exports = router
