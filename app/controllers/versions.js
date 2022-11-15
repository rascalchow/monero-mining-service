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
    utils.handleResponse(res, 201, { data: await upsertItem(req.version) })
  } catch (error) {
    utils.handleResponse(res, error.code, { err: error })
  }
}

/**
 * Get current version function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getCurrent = async (req, res) => {
  try {
    utils.handleResponse(res, 200, { data: await getLatestitem() })
  } catch (error) {
    utils.handleResponse(res, error.code, { err: error })
  }
}
