const { matchedData } = require('express-validator')
const AppUserSession = require('../models/appUserSession')
const utils = require('../middleware/utils')

/********************
 * Public functions *
 ********************/

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.startRunning = async (req, res) => {
  try {
    req = matchedData(req)
    let session = await AppUserSession.findOne({ userKey: req.userKey })
    if (session && !session.endAt) {
      session.remove()
    }
    session = await AppUserSession.create(req)
    utils.handleSuccess(res, 201, session._id)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.endRunning = async (req, res) => {
  try {
    req = matchedData(req)
    let session = await AppUserSession.findById(req.sessionId)
    if (!session) {
      throw utils.buildErrObject(400, 'SESSION_ID_DOES_NOT_EXISTS')
    } else {
      if (session.endAt) {
        throw utils.buildErrObject(400, 'SESSION_IS_ALREADY_ENDED')
      }
      session.endAt = new Date()
      await session.save()
      utils.handleSuccess(res, 203)
    }
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}
