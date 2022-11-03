const { matchedData } = require('express-validator')
const AppUser = require('../models/appUser')
const User = require('../models/user')
const utils = require('../middleware/utils')


/**
 * Add a new appUser in database
 * @param {Object} req - request object
 */
const installAppUser = async req => {
  let user = null
  try {
    user = await User.findOne({ publisherKey: req.publisherKey })
  } catch (err) {
    throw utils.buildErrObject(500, 'DB_ERROR')
  }
  if (!user) {
    throw utils.buildErrObject(400, 'UNKNOWN_PUBLISHER_KEY')
  }
  try {
    const appUser = await AppUser.create({
      ...req,
      publisherId: user.id
    })
    return appUser
  } catch (error) {
    throw utils.buildErrObject(400, err.message)
  }

}

/**
 * Uninstall a app user
 * @param {ObjectId} id - appUser.id
 */

const uninstall = async (id) => {
  let appUser = null
  try {
    appUser = await AppUser.findByIdAndUpdate(id, { status: 'uninstalled', }, { new: true })
  } catch (error) {
    throw utils.buildErrObject(500, error.message)
  }
  if (appUser) {
    return appUser
  } else {
    throw utils.buildErrObject(500, 'APP_USER_ID_IS_INVALID')
  }
}


/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.install = async (req, res) => {
  try {
    req = matchedData(req)
    const appUser = await installAppUser(req)
    res.status(201).json(appUser)
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.uninstall = async (req, res) => {
  try {
    const appUser = await uninstall(req.params.id)
    res.status(200).json(appUser)
  } catch (error) {
    utils.handleError(res, error)
  }

}
