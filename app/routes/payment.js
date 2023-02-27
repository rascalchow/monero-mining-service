const express = require('express')
const router = express.Router()
const trimRequest = require('trim-request')

const controller = require('../controllers/payment')
const validate = require('../controllers/payment.validate')
const { requireToken } = require('../middleware/device')

/*
 * Set current version
 */
router.post(
  '/on-block-reward',
  requireToken,
  trimRequest.all,
  validate.onBlockReward,
  controller.onBlockReward
)


module.exports = router
