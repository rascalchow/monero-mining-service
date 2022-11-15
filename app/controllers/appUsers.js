const { matchedData } = require('express-validator')
const AppUser = require('../models/appUser')
const Version = require('../models/version')
const User = require('../models/user')
const utils = require('../middleware/utils')
const CONSTS = require('../consts')

const USER_KEY_LENGTH = 8
/*********************
 * Private functions *
 *********************/

/**
 * Generates a random unique user key
 */
const generateUserrKey = async () => {

  const alphaNumerics =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let key = ''
  for (let i = 0; i < USER_KEY_LENGTH; i++) {
    key += alphaNumerics.charAt(Math.floor(Math.random() * 36))
  }
  while (await AppUser.find({ userKey: key }).length > 0) {
    let key = ''
    for (let i = 0; i < USER_KEY_LENGTH; i++) {
      key += alphaNumerics.charAt(Math.floor(Math.random() * 36))
    }
  }
  return key
}

/**
 * Add a new appUser in database
 * @param {Object} req - request object
 */
const installAppUser = async req => {
  try {
    const user = await User.findOne({ publisherKey: req.publisherKey })
    if (!user) {
      throw utils.buildErrObject(400, 'UNKNOWN_PUBLISHER_KEY')
    }
    let appUser = await AppUser.findOne({ publisherKey: req.publisherKey })
    if (appUser) {
      if (appUser.status === CONSTS.APP_USER.STATUS.INSTALLED) {
        throw utils.buildErrObject(400, 'USER_ALREADY_INSTALLED')
      }
    }

    if (req.version) {
      const version = await Version.findOne({ version: req.version })
      if (!version) {
        throw utils.buildErrObject(400, 'VERSION_NUMBER_DOES_NOT_EXIST')
      }
    }
    if (appUser) {
      appUser.status = CONSTS.APP_USER.STATUS.INSTALLED
      appUser.installedAt = new Date()
      appUser.uninstalledAt = null
      appUser.version = req.version
      appUser.save()
    } else {
      appUser = await AppUser.create({
        ...req,
        userKey: await generateUserrKey(),
        publisherKey: user.publisherKey,
        publisherId: user.id
      })
    }


    return appUser
  } catch (error) {
    throw utils.buildErrObject(400, error.message)
  }

}

/**
 * Uninstall a app user
 * @param {ObjectId} id - appUser.id
 */

const uninstall = async (req) => {
  try {
    const appUser = await AppUser.findOne({ userKey: req.userKey })
    if (!appUser) {
      throw utils.buildErrObject(400, 'APP_KEY_IS_NOT_FOUND')
    }
    if (appUser.status === CONSTS.APP_USER.STATUS.UNINSTALLED) {
      throw utils.buildErrObject(400, 'APP_USER_IS_ALREADY_UNINSTALLED')
    }
    appUser.status = CONSTS.APP_USER.STATUS.UNINSTALLED
    appUser.uninstalledAt = new Date()
    appUser.installedAt = null
    await appUser.save()
  } catch (error) {
    throw utils.buildErrObject(error.code || 500, error.message)
  }
}


/********************
 * Public functions *
 ********************/

/**
 * Install function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.install = async (req, res) => {
  try {
    req = matchedData(req)
    const appUser = await installAppUser(req)

    utils.handleResponse(res, 201, { data: appUser })
  } catch (error) {
    utils.handleResponse(res, error.code, { err: error })
  }
}

/**
 * Uninstall function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.uninstall = async (req, res) => {
  try {
    req = matchedData(req)
    await uninstall(req)
    utils.handleResponse(res, 203, {})
  } catch (error) {
    utils.handleResponse(res, error.code, { err: error })
  }
}
