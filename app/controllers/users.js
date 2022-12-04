const model = require('../models/user')
const appUserModel = require('../models/appUser')
const profileModel = require('../models/userProfile')
const uuid = require('uuid')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')
const db = require('../middleware/db')
const emailer = require('../middleware/emailer')
const { listInitOptions } = require('../middleware/db')
/*********************
 * Private functions *
 *********************/

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async req => {
  return new Promise((resolve, reject) => {
    const user = new model({
      name: req.name,
      email: req.email,
      password: req.password,
      role: req.role,
      phone: req.phone,
      verification: uuid.v4()
    })
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      // Removes properties with rest operator
      const removeProperties = ({
        // eslint-disable-next-line no-unused-vars
        password,
        // eslint-disable-next-line no-unused-vars
        blockExpires,
        // eslint-disable-next-line no-unused-vars
        loginAttempts,
        ...rest
      }) => rest
      resolve(removeProperties(item.toObject()))
    })
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  console.log(req.query)
  try {
    const query = await db.checkQueryString(req.query)
    const sortKey = [
      'name',
      'email',
      'companyName',
      'status',
      'installs',
      'live',
      'liveTime',
      'earnings',
      'referrals',
      'payments'
    ]
    if (query.search) {
      const search = query.search
      delete query.search
      query['$or'] = [
        { name: { $regex: `.*${search}.*` } },
        { email: { $regex: `.*${search}.*` } },
        { companyName: { $regex: `.*${search}.*` } }
      ]
    }
    let sort = null
    sortKey.forEach(key => {
      if (query[key]) {
        sort = { [key]: query[key] }
        delete query[key]
      }
    })
    const processQuery = opt => {
      opt.collation = { locale: 'en' }
      return { ...opt, sort }
    }

    const data = await db.getItems(req, model, query, processQuery)
    res.status(200).json(data)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.getItem(id, model, 'userProfileId'))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    let user = null

    const doesEmailExists = await emailer.emailExistsExcludingMyself(
      id,
      req.email
    )
    if (!doesEmailExists) {
      user = await db.updateItem(id, model, req)
    }

    if (!user) {
      utils.buildErrObject(422, 'USER_NOT_FOUND')
    }
    await user.save()
    res.status(200).json(await db.getItem(id, model, null))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
  try {
    req = matchedData(req)
    const doesEmailExists = await emailer.emailExists(req.email)
    const doesStaffExists = await emailer.staffIdExists(req.staffId)
    if (!doesEmailExists && !doesStaffExists) {
      const item = await createItem(req)
      // emailer.sendRegistrationEmailMessage(locale, item)
      res.status(201).json(item)
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.deleteItem(id, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * User approve function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.approveUser = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.updateItem(id, model, { status: 'active' }))
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.rejectUser = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.updateItem(id, model, { status: 'rejected' }))
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.getInstallsInfo = async (req, res) => {
  const { item } = req.query
  const { id } = req.params
  const ago = handleDuration(JSON.parse(item))
  const query = {
    $exists: true,
    $gte: new Date(ago)
  }
  try {
    const result = await model.find({
      status: 'installed',
      installedAt: query
    })
    return res.status(200).json({
      info: result,
      count: processInstalls(result, JSON.parse(item))
    })
  } catch (error) {
    throw buildErrObject(422, err.message)
  }
}

const processInstalls = (installs, item) => {
  const duration = item.type == 'day' ? item.value : item.value * 30
  const now = new Date()
  let result = []
  for (let i = 0; i < duration; i++) {
    let current = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    let count = installs.filter(it => {
      const { createdAt } = it
      if (
        createdAt.getFullYear() == current.getFullYear() &&
        createdAt.getMonth() == current.getMonth() &&
        createdAt.getDate() == current.getDate()
      ) {
        return true
      }
      return false
    }).length
    result[i] = count
  }
  return result
}

const handleDuration = date => {
  let now = new Date()
  if (date) {
    if (date.type == 'day')
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - date.value
      )
    else if (date.type == 'month')
      return new Date(now.getFullYear(), now.getMonth() - date.value)
    else return now
  }
  return now
}
