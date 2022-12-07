const { matchedData } = require('express-validator')
const AppConfig = require('../models/appConfig')
const utils = require('../middleware/utils')
const CONSTS = require('../consts')

/********************
 * Private functions *
 ********************/

const createDefaultEula = async () => {
  return await AppConfig.create({
    type: 'EULA',
    data: { eula: CONSTS.DEFAULT_EULA_TEMPLATE }
  })
}

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
    const eulaConfig = await AppConfig.findOne({ type: 'EULA' })
    if (!eulaConfig) {
      eulaConfig = await createDefaultEula()
    }

    utils.handleSuccess(res, 200, eulaConfig.data.eula)
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
    let eulaConfig = await AppConfig.findOneAndUpdate(
      { type: 'EULA' },
      { data: { eula: req.eula } },
      { new: true }
    )

    utils.handleSuccess(res, 200, eulaConfig.data.eula)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Populate config record when server bootstraps
 */
exports.seedAppConfig = async () => {
  try {
    const appConfig = await AppConfig.findOne({ type: 'EULA' })
    console.log('\n\n*****************   START   ******************')
    console.log('            Configuring application')
    if (!appConfig) {
      createDefaultEula()
    }
    console.log('*****************    END    ******************\n\n\n')
  } catch (err) {
    console.log(err)
  }
}
