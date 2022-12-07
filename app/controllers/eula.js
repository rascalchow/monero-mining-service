const UserEula = require('../models/userEula')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')

/**
 * Update user EULA function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getUserEula = async (req, res) => {
  try {
    const userEula = await UserEula.findOne({ publisherId: req.user._id })
    utils.handleSuccess(res, 200, userEula)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Update user EULA function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateUserEula = async (req, res) => {
  try {
    const data = matchedData(req)
    const userEula = await UserEula.findOneAndUpdate(
      { publisherId: req.user._id },
      { eula: data.eula },
      { new: true }
    )
    utils.handleSuccess(res, 201, userEula)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}
