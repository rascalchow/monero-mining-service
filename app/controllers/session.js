const { matchedData } = require('express-validator')
const AppUserSession = require('../models/appUserSession')
const utils = require('../middleware/utils')
/********************
 * Private functions *
 ********************/


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
    if (session) {
      if (session.startAt) {
        console.log(session.startAt)
        throw utils.buildErrObject(400, 'SESSION_IS_ALREADY_STARTTED')
      } else {
        session.startAt = new Date()
        session.endAt = null
        await session.save()
        utils.handleSuccess(res, 203, session._id)
      }
    } else {
      session = await AppUserSession.create(req)
      utils.handleSuccess(res, 201, session._id)
    }

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
      session.startAt = null
      await session.save()
      utils.handleSuccess(res, 203)
    }
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}