const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { FILE_UPLOAD_DIR } = require('../consts')
const requestIp = require('request-ip')
const { validationResult } = require('express-validator')
const { session } = require('passport')
const utils = require('../middleware/utils')
const moment = require('moment')
const AppUser = require('../models/appUser')
const User = require('../models/user')
/**
 * Removes extension from file
 * @param {string} file - filename
 */
exports.removeExtensionFromFile = file => {
  return file
    .split('.')
    .slice(0, -1)
    .join('.')
    .toString()
}

/**
 * Gets IP from user
 * @param {*} req - request object
 */
exports.getIP = req => requestIp.getClientIp(req)

/**
 * Gets browser info from user
 * @param {*} req - request object
 */
exports.getBrowserInfo = req => req.headers['user-agent']

/**
 * Gets country from user using CloudFlare header 'cf-ipcountry'
 * @param {*} req - request object
 */
exports.getCountry = req =>
  req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX'

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
exports.handleError = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }
  // Sends error to user
  res.status(err.code || 500).json({
    errors: {
      msg: err.message
    }
  })
}

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
exports.handleErrorV2 = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }
  const statusCode = err.code
  delete err.code
  // Sends error to user
  res.status(statusCode || 500).json({
    success: false,
    err
  })
}

/**
 * Handles response by printing to console in development env and builds and sends an response
 * @param {Object} res - response object
 * @param {Number} statusCode - response status code
 * @param {Object} data - data object

 */
exports.handleSuccess = (res, statusCode, data) => {
  res.status(statusCode || 200).json({
    success: true,
    ...(data ? { data } : {})
  })
}

/**
 * Builds error object
 * @param {number} code - error code
 * @param {string} message - error text
 */
exports.buildErrObject = (code, message) => {
  return {
    code,
    message
  }
}

/**
 * Builds error for validation files
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Object} next - next object
 */
exports.validationResult = (req, res, next) => {
  try {
    validationResult(req).throw()
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase()
    }
    return next()
  } catch (err) {
    return this.handleError(res, this.buildErrObject(422, err.array()))
  }
}

/**
 * Builds success object
 * @param {string} message - success text
 */
exports.buildSuccObject = message => {
  return {
    msg: message
  }
}

/**
 * Checks if given ID is good for MongoDB
 * @param {string} id - id to check
 */
exports.isIDGood = async id => {
  return new Promise((resolve, reject) => {
    const goodID = String(id).match(/^[0-9a-fA-F]{24}$/)
    return goodID
      ? resolve(id)
      : reject(this.buildErrObject(422, 'ID_MALFORMED'))
  })
}

/**
 * Item not found
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemNotFound = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (!item) {
    reject(this.buildErrObject(404, message))
  }
}

/**
 * Item already exists
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemAlreadyExists = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (item) {
    reject(this.buildErrObject(422, message))
  }
}

exports.validateHardware = hardwareId => {
  const regEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/
  return regEx.test(hardwareId)
}

exports.resolveUploadPath = p => {
  return path.join(global.APP_ROOT, FILE_UPLOAD_DIR, p)
}

exports.crupdateMsi = (publisherKey, companyName, productName) => {
  const dirPath = path.join(global.APP_ROOT, FILE_UPLOAD_DIR, publisherKey)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }
  const cmd = path.join(global.APP_ROOT, 'assets/reptool')
  const src = path.join(global.APP_ROOT, 'assets/install.msi')
  const dest = path.join(
    global.APP_ROOT,
    FILE_UPLOAD_DIR,
    publisherKey,
    'install.msi'
  )

  execSync(
    `${cmd} ${src} ${dest} ${publisherKey} ${companyName} ${productName}`
  )
  return path.join(publisherKey, 'install.msi')
}

exports.onSessionEnded = async sess => {
  const start = moment(sess.startAt)
  sess.endAt = new Date()
  const end = moment(sess.endAt)
  const duration = end.diff(start, 'seconds')
  sess.duration = duration
  sess.lastSeen = new Date()
  await sess.save()

  const { userId, publisherId } = sess
  if (!userId || !publisherId) {
    throw utils.buildErrObject(400, 'INVALID_SESSION')
  } else {
    try {
      await AppUser.findByIdAndUpdate(userId, {
        $inc: { liveTime: sess.duration }
      })
      await User.findByIdAndUpdate(publisherId, {
        $inc: { liveTime: sess.duration, live: -1 } //
      })
      const totalLiveTime = (await User.findById(publisherId)).liveTime
      const appUsers = await AppUser.find({ liveTime: { $gt: 0 }, publisherId })
      appUsers.forEach(async appUser => {
        appUser.timeRatio =
          totalLiveTime === 0
            ? 0
            : ((appUser.liveTime * 100) / totalLiveTime).toFixed(2)
        await appUser.save()
      })
    } catch (error) {
      throw utils.buildErrObject(422, error.message)
    }
  }
}
