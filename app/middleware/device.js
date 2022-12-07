const utils = require('../middleware/utils')
/********************
 * Private functions *
 ********************/

/**
 * Check if req object header contains valid token
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
const checkToken = req => {
  if (req.headers.authorization === `Bearer ${process.env.DEVICE_TOKEN}`) {
    return true
  }
  return false
}

/********************
 * Public functions *
 ********************/
/**
 * middleware function to check install token
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.requireToken = (req, res, next) => {
  if (checkToken(req)) {
    next()
  } else {
    utils.handleErrorV2(res, utils.buildErrObject(401, 'MISSING_VALID_TOKEN'))
  }
}
