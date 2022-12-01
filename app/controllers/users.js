const model = require('../models/user')
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
  try {
    const query = await db.checkQueryString(req.query)
    let search = ''
    if (query.search) {
      search = query.search
      delete query.search
    }

    const sortKey = ['name', 'email', 'companyName', 'status']
    let sort = null
    sortKey.forEach(key => {
      if (query[key]) {
        sort = { [key]: query[key] }
        delete query[key]
      }
    })
    const processQuery = opt => {
      opt.populate = ['userProfileId']
      return opt
    }
    const options = await listInitOptions(req)
    const processedOpt = processQuery ? processQuery(options) : options
    const allUsers = await model
      .find(query)
      .populate('userProfileId')
      .sort(processedOpt.sort)
      
    //** Sort Users
    sortKey.forEach(key => {
      if (sort && sort[key] == 'asc') {
        allUsers.sort((a, b) => {
          if (key == 'name' || key == 'email' || key == 'status')
            return a[key].toLowerCase().localeCompare(b[key].toLowerCase())
          else
            return a['userProfileId'][key]
              .toLowerCase()
              .localeCompare(b['userProfileId'][key].toLowerCase())
        })
      } else if (sort && sort[key] == 'desc') {
        allUsers.sort((a, b) => {
          if (key == 'name' || key == 'email' || key == 'status')
            return b[key].toLowerCase().localeCompare(a[key].toLowerCase())
          else
            return b['userProfileId'][key]
              .toLowerCase()
              .localeCompare(a['userProfileId'][key].toLowerCase())
        })
      }
    })
    //**/

    //** Filter Searched Users
    let filteredUsers = allUsers
    if (search !== '') {
      const reg = new RegExp(`${search}`)
      filteredUsers = allUsers.filter((user, index) => {
        if (
          reg.test(user.name) ||
          reg.test(user.email) ||
          (user.userProfileId && reg.test(user.userProfileId.companyName))
        ) {
          return true
        }
        return false
      })
    }
    //**/

    const result = processUsers(filteredUsers, processedOpt)
    // const data = (await db.getItems(req, model, query, processQuery))
    res.status(200).json(result)
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
  var profileInfo = req.body
  delete profileInfo.name
  delete profileInfo.email

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
      let profileId = user.userProfileId
      var userProfile = await db.updateItem(
        profileId,
        profileModel,
        profileInfo
      )
    }

    if (!user) {
      utils.buildErrObject(422, 'USER_NOT_FOUND')
    }
    if (!userProfile) {
      utils.buildErrObject(422, 'USER_PROFILE_NOT_FOUND')
    }

    // if (req.password) {
    //   user.password = req.password
    // }

    await user.save()
    await userProfile.save()

    // res.status(200).json(user)
    res.status(200).json(await db.getItem(id, model, 'userProfileId'))
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

const processUsers = (users, opt) => {
  let totalDocs = users.length
  let limit = opt.limit
  let totalPages = Math.ceil(totalDocs / limit)
  let page = opt.page
  // let pagingCounter = 1
  let hasPrevPage = page > 1 ? true : false
  let hasNextPage = page < totalPages ? true : false
  let prevPage = hasPrevPage ? page - 1 : null
  let nextPage = hasNextPage ? page + 1 : null

  return {
    docs: users.splice((page - 1) * limit, limit),
    totalDocs,
    limit,
    totalPages,
    page,
    hasPrevPage,
    hasNextPage,
    nextPage,
    prevPage
  }
}
