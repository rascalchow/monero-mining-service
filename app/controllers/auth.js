const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/user')
const UserAccess = require('../models/userAccess')
const Invite = require('../models/invite')
const UserEula = require('../models/userEula')
const AppConfig = require('../models/appConfig')
const ForgotPassword = require('../models/forgotPassword')
const utils = require('../middleware/utils')
const uuid = require('uuid')
const { addHours } = require('date-fns')
const { matchedData } = require('express-validator')
const auth = require('../middleware/auth')
const emailer = require('../middleware/emailer')
const db = require('../middleware/db')
const CONSTS = require('../consts')

const HOURS_TO_BLOCK = 2
const LOGIN_ATTEMPTS = 10
const PUBLISHER_KEY_LENGTH = 8

/*********************
 * Private functions *
 *********************/

/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = (user, duration) => {
  // Gets expiration time
  const expiration =
    Math.floor(Date.now() / 1000) +
    60 * (duration || Number(process.env.JWT_EXPIRATION_IN_MINUTES))

  // returns signed and encrypted token
  return auth.encrypt(
    jwt.sign(
      {
        data: {
          _id: user
        },
        exp: expiration
      },
      process.env.JWT_SECRET
    )
  )
}

/**
 * Generates a random unique publisher key
 */
const generatePubliserKey = async () => {
  const alphaNumerics =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let key = ''
  for (let i = 0; i < PUBLISHER_KEY_LENGTH; i++) {
    key += alphaNumerics.charAt(Math.floor(Math.random() * 62))
  }
  while ((await User.find({ publisherKey: key }).length) > 0) {
    key = ''
    for (let i = 0; i < PUBLISHER_KEY_LENGTH; i++) {
      key += alphaNumerics.charAt(Math.floor(Math.random() * 62))
    }
  }
  return key
}

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = req => {
  let user = {
    _id: req._id,
    name: req.name,
    email: req.email,
    phone: req.phone,
    companyName: req.companyName,
    application: req.application,
    contact: req.contact,
    country: req.country,
    instantMessenger: req.instantMessenger,
    website: req.website,
    moreInformation: req.moreInformation,
    role: req.role,
    publisherKey: req.publisherKey,
    status: req.status,
    verified: req.verified,
    payoutCurrency: req.payoutCurrency || 'xmr'
  }
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== 'production') {
    user = {
      ...user,
      verification: req.verification
    }
  }
  return user
}

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user, duration) => {
  return new Promise((resolve, reject) => {
    const userAccess = new UserAccess({
      email: user.email,
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req),
      country: utils.getCountry(req)
    })
    userAccess.save(err => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      const userInfo = setUserInfo(user)
      // Returns data with access token
      resolve({
        token: generateToken(user._id, duration),
        user: userInfo
      })
    })
  })
}

/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async user => {
  return new Promise((resolve, reject) => {
    user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK)
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(utils.buildErrObject(409, 'BLOCKED_USER'))
      }
    })
  })
}

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLoginAttemptsToDB = async user => {
  return new Promise((resolve, reject) => {
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(true)
      }
    })
  })
}

/**
 * Checks that login attempts are greater than specified in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = user =>
  user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date()

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async user => {
  return new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0
      user.save((err, result) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        }
        if (result) {
          resolve(true)
        }
      })
    } else {
      // User is not blocked, check password (normal behaviour)
      resolve(true)
    }
  })
}

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async user => {
  return new Promise((resolve, reject) => {
    if (user.blockExpires > new Date()) {
      reject(utils.buildErrObject(409, 'BLOCKED_USER'))
    }
    resolve(true)
  })
}

/**
 * Finds user by email
 * @param {string} email - user´s email
 */
const findUser = async email => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      'status loginAttempts blockExpires name email role verified publisherKey verification payoutCurrency isPrimary',
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
        resolve(item)
      }
    )
  })
}
/**
 * Finds user by staffId
 * @param {string} email - user´s email
 */
const findUserByStaffId = async staffId => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        staffId
      },
      'loginAttempts blockExpires name email role verified verification',
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
        resolve(item)
      }
    )
  })
}

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async userId => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, item) => {
      utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
      resolve(item)
    })
  })
}

/**
 * Adds one attempt to loginAttempts, then compares loginAttempts with the constant LOGIN_ATTEMPTS, if is less returns wrong password, else returns blockUser function
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async user => {
  user.loginAttempts += 1
  await saveLoginAttemptsToDB(user)
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, 'WRONG_PASSWORD'))
    } else {
      resolve(blockUser(user))
    }
    reject(utils.buildErrObject(422, 'ERROR'))
  })
}

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async (req, res) => {
  const id = req.id // invite model id
  const referralCode = req.referral
  if (id) {
    delete req.id
  }
  if (referralCode) {
    delete req.referral
  }

  try {
    // update refUser1Id/refUser2Id
    const invite = await Invite.findById(id)
    const referrerId = invite.referrerId
    req.refUser1Id = mongoose.Types.ObjectId(referrerId)
    const referrer2 = await User.findById(referrerId)

    if (!!referrer2 && referrer2.refUser1Id) {
      req.refUser2Id = mongoose.Types.ObjectId(referrer2.refUser1Id)
    }
    // update referrals
    await User.findByIdAndUpdate(referrerId, {
      $inc: { referrals: 1 }
    })
    // register
    if (!referralCode) {
      throw utils.buildErrObject(400, 'REFERRAL_CODE_DOES_NOT_EXIST')
    }
    if (!id) {
      throw utils.buildErrObject(400, 'REFERRAL_ID_DOES_NOT_EXIST')
    }
    // check if there is referral code in invite collection and not expired
    if (!invite) {
      throw utils.buildErrObject(400, 'NO_REFERRALS')
    }
    if (invite.status === CONSTS.INVITE.STATUS.SIGNUP) {
      throw utils.buildErrObject(400, 'USER_ALREADY_SIGNED_UP')
    }
    if (invite.expired) {
      throw utils.buildErrObject(400, 'REFERRAL_ALREADY_EXPIRED')
    }
    if (invite.code !== referralCode) {
      throw utils.buildErrObject(400, 'REFERRAL_CODE_DOES_NOT_MATCH')
    }
    // if (invite.refereeEmail !== req.email) {
    //   throw utils.buildErrObject(400, 'WRONG_EMAIL')
    // }

    const publisherKey = await generatePubliserKey()
    const user = await User.create({
      ...req,
      staffId: req.staffId,
      verification: uuid.v4(),
      publisherKey,
      installer: utils.crupdateMsi(
        publisherKey,
        req.companyName,
        req.application
      )
    })
    const eulaTemplate = (await AppConfig.findOne({ type: 'EULA' })).data.eula
      .replace(/{{companyName}}/g, req.companyName)
      .replace(/{{productName}}/g, req.application)

    await UserEula.create({
      publisherId: user._id,
      eula: eulaTemplate
    })
    // update invite collection
    await Invite.updateMany(
      { code: referralCode },
      {
        status: CONSTS.INVITE.STATUS.SIGNUP,
        expired: true,
        acceptedAt: new Date()
      }
    )

    return user
  } catch (err) {
    throw utils.buildErrObject(422, err.message)
  }
}

/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
  if (process.env.NODE_ENV !== 'production') {
    userInfo.verification = item.verification
  }
  const data = {
    token: generateToken(item._id),
    user: userInfo
  }
  return data
}

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */
const verificationExists = async id => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        verification: id,
        verified: false
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND_OR_ALREADY_VERIFIED')
        resolve(user)
      }
    )
  })
}

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async user => {
  return new Promise((resolve, reject) => {
    user.verified = true
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve({
        email: item.email,
        verified: item.verified
      })
    })
  })
}

/**
 * Marks a request to reset password as used
 * @param {Object} req - request object
 * @param {Object} forgot - forgot object
 */
const markResetPasswordAsUsed = async (req, forgot) => {
  return new Promise((resolve, reject) => {
    forgot.used = true
    forgot.ipChanged = utils.getIP(req)
    forgot.browserChanged = utils.getBrowserInfo(req)
    forgot.countryChanged = utils.getCountry(req)
    forgot.save((err, item) => {
      utils.itemNotFound(err, item, reject, 'NOT_FOUND')
      resolve(utils.buildSuccObject('PASSWORD_CHANGED'))
    })
  })
}

/**
 * Updates a user password in database
 * @param {string} password - new password
 * @param {Object} user - user object
 */
const updatePassword = async (password, user) => {
  return new Promise((resolve, reject) => {
    user.password = password
    user.save((err, item) => {
      utils.itemNotFound(err, item, reject, 'NOT_FOUND')
      resolve(item)
    })
  })
}

/**
 * Finds user by email to reset password
 * @param {string} email - user email
 */
const findUserToResetPassword = async email => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND')
        resolve(user)
      }
    )
  })
}

/**
 * Checks if a forgot password verification exists
 * @param {string} id - verification id
 */
const findForgotPassword = async id => {
  return new Promise((resolve, reject) => {
    ForgotPassword.findOne(
      {
        verification: id,
        used: false
      },
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'NOT_FOUND_OR_ALREADY_USED')
        resolve(item)
      }
    )
  })
}

/**
 * Creates a new password forgot
 * @param {Object} req - request object
 */
const saveForgotPassword = async req => {
  return new Promise((resolve, reject) => {
    const forgot = new ForgotPassword({
      email: req.body.email,
      verification: uuid.v4(),
      ipRequest: utils.getIP(req),
      browserRequest: utils.getBrowserInfo(req),
      countryRequest: utils.getCountry(req)
    })
    forgot.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

/**
 * Builds an object with created forgot password object, if env is development or testing exposes the verification
 * @param {Object} item - created forgot password object
 */
const forgotPasswordResponse = item => {
  let data = {
    msg: 'RESET_EMAIL_SENT',
    email: item.email
  }
  if (process.env.NODE_ENV !== 'production') {
    data = {
      ...data,
      verification: item.verification
    }
  }
  return data
}

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) => {
  return new Promise((resolve, reject) => {
    User.findById(data.id, (err, result) => {
      utils.itemNotFound(err, result, reject, 'NOT_FOUND')
      if (data.roles.indexOf(result.role) > -1) {
        return resolve(next())
      }
      return reject(utils.buildErrObject(401, 'UNAUTHORIZED'))
    })
  })
}

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async token => {
  return new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, 'BAD_TOKEN'))
      }
      resolve(decoded.data._id)
    })
  })
}

/**
 * Check is user is approved
 * @param {Object} user - user model instance
 */
const checkUserIsApproved = user => {
  if (user.status === 'active') {
    return true
  }
  throw utils.buildErrObject(401, 'USER_IS_NOT_APPROVED')
}

/**
 * Check is user is approved
 * @param {Object} user - user model instance
 */
const checkUserIsNotPending = user => {
  if (user.status === 'pending') {
    throw utils.buildErrObject(401, 'USER_IS_NOT_APPROVED')
  }
  return true
}

/**
 * Check is user is approved
 * @param {Object} user - user model instance
 */
const checkUserIsNotInActive = user => {
  if (user.status === 'inactive') {
    throw utils.buildErrObject(401, 'USER_IS_INACTIVE')
  }
  return true
}
/********************
 * Public functions *
 ********************/

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.login = async (req, res) => {
  try {
    const data = matchedData(req)
    const user = await findUser(data.email)
    checkUserIsNotInActive(user)
    await userIsBlocked(user)
    await checkLoginAttemptsAndBlockExpires(user)
    const isPasswordMatch = await auth.checkPassword(data.email, data.password)

    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch(user))
    } else {
      // all ok, register access and return token
      user.loginAttempts = 0
      await saveLoginAttemptsToDB(user)
      const temp = await saveUserAccessAndReturnToken(req, user)

      res.status(200).json(temp)
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Register function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.register = async (req, res) => {
  try {
    req = matchedData(req)
    const doesEmailExists = await emailer.emailExists(req.email)

    if (!doesEmailExists) {
      const item = await registerUser(req)
      const userInfo = setUserInfo(item)
      const response = returnRegisterToken(item, userInfo)

      res.status(201).json(response)
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
  try {
    req = matchedData(req)
    const user = await verificationExists(req.id)
    res.status(200).json(await verifyUser(user))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Forgot password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    const data = matchedData(req)
    await findUser(data.email)
    const item = await saveForgotPassword(req)
    emailer.sendResetPasswordEmailMessage(item)
    res.status(200).json(forgotPasswordResponse(item))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Reset password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const data = matchedData(req)
    const forgotPassword = await findForgotPassword(data.id)
    const user = await findUserToResetPassword(forgotPassword.email)
    await updatePassword(data.password, user)
    const result = await markResetPasswordAsUsed(req, forgotPassword)
    res.status(200).json(result)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getRefreshToken = async (req, res) => {
  try {
    const tokenEncrypted = req.headers.authorization
      .replace('Bearer ', '')
      .trim()
    let userId = await getUserIdFromToken(tokenEncrypted)
    userId = await utils.isIDGood(userId)
    const user = await findUserById(userId)
    const token = await saveUserAccessAndReturnToken(req, user)
    // Removes user info from response
    res.status(200).json(token)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Change pwd function called by route
 */
exports.changePassword = async (req, res, next) => {
  try {
    const data = matchedData(req)
    await updatePassword(data.password, req.user)
    utils.handleSuccess(res, 204)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Roles authorization function called by route
 * @param {Array} roles - roles specified on the route
 */
exports.roleAuthorization = roles => async (req, res, next) => {
  try {
    const data = {
      id: req.user._id,
      roles
    }
    await checkPermissions(data, next)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Approval function called by route
 */
exports.requireApproval = (req, res, next) => {
  try {
    checkUserIsApproved(req.user)
    return next()
  } catch (error) {
    return utils.handleError(res, error)
  }
}

exports.requireNotDisabled = (req, res, next) => {
  try {
    checkUserIsNotInActive(req.user)
    return next()
  } catch (error) {
    return utils.handleError(res, error)
  }
}

exports.requireNotPending = (req, res, next) => {
  try {
    checkUserIsNotPending(req.user)
    return next()
  } catch (error) {
    return utils.handleError(res, error)
  }
}

/**
 * Seed admin user
 */
exports.seedAdminUser = async () => {
  try {
    const USER = {
      email: 'admin@nurev.com',
      name: 'Admin',
      password: 'NureVAdmin!2#',
      verification: uuid.v4(),
      role: CONSTS.USER.ROLE.ADMIN,
      status: CONSTS.USER.STATUS.ACTIVE,
      publisherKey: '00000000',
      companyName: 'Nurev',
      application: 'Nurev',
      contact: 'Nurev',
      website: 'Nurev',
      refUser1Id: mongoose.Types.ObjectId()
    }
    const user = await User.findOne({
      email: USER.email
    })

    if (!user) {
      const newUser = new User(USER)
      await newUser.save()
    }
  } catch (err) {
    console.log(err)
  }
}

/**
 * Gets profile from database by id
 * @param {string} id - user id
 */
const getProfileFromDB = async id => {
  return new Promise((resolve, reject) => {
    User.findById(
      id,
      '-updatedAt -createdAt',
      { populate: 'userProfileId' },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND')
        resolve(user)
      }
    )
  })
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateProfile = async (req, res) => {
  try {
    const id = req.user._id
    const { email } = req.body
    let user = null
    const doesEmailExists = await emailer.emailExistsExcludingMyself(id, email)
    if (!doesEmailExists) {
      req.body.status = CONSTS.USER.STATUS.PENDING
      user = await db.updateItem(id, User, req.body)
    }
    if (!user) {
      utils.buildErrObject(422, 'USER_NOT_FOUND')
    }
    await user.save()
    res.status(200).json(await getProfileFromDB(id))
  } catch (error) {
    utils.handleError(res, error)
  }
}
