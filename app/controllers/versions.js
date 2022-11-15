const Version = require('../models/version')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')

/********************
 * Private functions *
 ********************/

/**
 * Create or update a item in database
 * @param {string} version - version string
 */
const upsertItem = async (version) => {
  try {
    return await Version.findOneAndUpdate({ version }, { version }, { upsert: true, new: true });
  } catch (error) {
    throw utils.buildErrObject(400, error.message)
  }
}

/**
 * Get most recently updated item from database
 */
const getLatestitem = async () => {
  let doc = null
  try {
    doc = await Version.find({}, {}, { sort: { 'updatedAt': -1 } })
  } catch (error) {
    throw utils.buildErrObject(500, error.message)
  }
  if (!doc) {
    throw utils.buildErrObject(500, 'NO_VERSIONS_ADDED_YET')
  }
  return doc[0]
}

/********************
 * Public functions *
 ********************/

/**
 * Create version function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.setCurrent = async (req, res) => {
  req = matchedData(req)
  try {
    utils.handleSuccess(res, 201, await upsertItem(req.version))
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Get current version function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getCurrent = async (req, res) => {
  try {
    utils.handleSuccess(res, 200, await getLatestitem())
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}
