const { matchedData } = require('express-validator')
const AppConfig = require('../models/appConfig')
const utils = require('../middleware/utils')
/********************
 * Public functions *
 ********************/

/**
 * Get eula function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getEula = async (_, res) => {
  try {
    const config = await AppConfig.findOne()
    utils.handleSuccess(res, 200, config.eula)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Update eula function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateEula = async (req, res) => {
  try {
    req = matchedData(req)
    const config = await AppConfig.updateOne(
      {},
      { eula: req.eula },
      { new: true }
    )
    utils.handleSuccess(res, 200, config.eula)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Populate config record when server bootstraps
 */
exports.seedAppConfig = async () => {
  try {
    const appConfig = await AppConfig.findOne()
    console.log('\n\n*****************   START   ******************')
    console.log('            Configuring application')
    console.log('*****************    END    ******************\n\n\n')
    if (!appConfig) {
      await AppConfig.create({})
    }
  } catch (err) {
    console.log(err)
  }
}
