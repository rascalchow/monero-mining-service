const mongoose = require('mongoose')
const utils = require('../middleware/utils')
const { matchedData } = require('express-validator')
const model = require('../models/invite')
const User = require('../models/user')
const { INVITE } = require('../consts')
const db = require('../middleware/db')
const CONSTS = require('../consts')

const REFERRAL_CODE_LENGTH = 6

/**
 * Generates a random unique referral code
 */
const generateCode = async () => {
  const alphaNumerics =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let key = ''
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    key += alphaNumerics.charAt(Math.floor(Math.random() * 62))
  }
  while ((await model.find({ code: key }).length) > 0) {
    key = ''
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      key += alphaNumerics.charAt(Math.floor(Math.random() * 62))
    }
  }
  return key
}

const createItem = async req => {
  return new Promise((resolve, reject) => {
    const invite = new model({
      referrerId: req.referrerId,
      refereeEmail: req.refereeEmail,
      code: req.code
    })
    invite.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

/**
 * Get invites function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.get = async (req, res) => {
  const id = req.user._id
  const query = await db.checkQueryString(req.query)
  if (query.search) {
    const search = query.search
    delete query.search
    query.$or = [{ refereeEmail: { $regex: `.*${search}.*`, $options: 'i' } }]
  }
  query.referrerId = id
  let sort = null
  INVITE.SORT_KEY.forEach(key => {
    if (query[key]) {
      sort = { [key]: query[key] }
      delete query[key]
    }
    if (sort === null) {
      sort = { createdAt: -1 }
    }
  })
  const processQuery = opt => {
    opt.collation = { locale: 'en' }
    return { ...opt, sort }
  }
  const data = await db.getItems(req, model, query, processQuery)
  res.status(200).json(data)
}

/**
 * Get invites function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getPublisherInvites = async (req, res) => {
  const { id } = req.params
  const query = await db.checkQueryString(req.query)
  if (query.search) {
    const search = query.search
    delete query.search
    query.$or = [{ refereeEmail: { $regex: `.*${search}.*`, $options: 'i' } }]
  }
  query.referrerId = id
  let sort = null
  INVITE.SORT_KEY.forEach(key => {
    if (query[key]) {
      sort = { [key]: query[key] }
      delete query[key]
    }
    if (sort === null) {
      sort = { createdAt: -1 }
    }
  })
  const processQuery = opt => {
    opt.collation = { locale: 'en' }
    return { ...opt, sort }
  }
  const data = await db.getItems(req, model, query, processQuery)
  res.status(200).json(data)
}

/**
 * Post invite function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.create = async (req, res) => {
  const email = req.body
  try {
    // check if the email is already signed up
    const user = await User.findOne(email)
    if (user) {
      throw utils.buildErrObject(422, 'USER_ALREADY_REGISTERED')
    }
    // generate referral code and create invite after checking if you already invited
    const invite = await model.findOne({
      refereeEmail: email.email,
      referrerId: mongoose.Types.ObjectId(req.user._id)
    })
    if (invite) {
      throw utils.buildErrObject(422, 'YOU_ALREADY_INVITED')
    }
    const newReq = {
      referrerId: req.user._id,
      refereeEmail: email.email,
      code: await generateCode()
    }
    const newInvite = await createItem(newReq)
    res.status(200).json(newInvite)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Delete invite function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.remove = async (req, res) => {
  const { id } = req.params
  try {
    req = matchedData(req)
    const invite = await model.findById(id)
    const publisherId = invite.referrerId
    // check if the referree has already signed up
    if (invite.expired || invite.status !== 'invited' || !!invite.acceptedAt) {
      throw utils.buildErrObject(400, 'REFERREE_HAS_ALREADY_SIGNED_UP')
    }
    // delete
    await db.deleteItem(id, model)
    // await User.findByIdAndUpdate(publisherId, {
    //   $inc: { referrals: -1 }
    // })
    res.status(200).json({ publisherId })
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * check invite code in database
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.checkCode = async (req, res) => {
  const { id } = req.params
  try {
    const invite = (await model.findById(id)) ?? {}
    if (
      invite.expired === true ||
      invite.status !== 'invited' ||
      !!invite.acceptedAt
    ) {
      utils.handleErrorV2(res, 'USER_HAS_ALREADY_SIGNED_UP')
    } else {
      const refereeEmail = invite.refereeEmail
      const referrerId = invite.referrerId
      const referrer = await User.findById(referrerId).select(
        'name email phone companyName application contact country instantMessenger website moreInformation'
      )
      utils.handleSuccess(res, 201, {
        _id: referrer._id,
        email: referrer.email,
        name: referrer.name,
        phone: referrer.phone,
        companyName: referrer.companyName,
        application: referrer.application,
        contact: referrer.contact,
        country: referrer.country,
        instantMessenger: referrer.instantMessenger,
        website: referrer.website,
        moreInformation: referrer.moreInformation,
        refereeEmail
      })
    }
  } catch (error) {
    utils.handleErrorV2(res, 'INVALID_URL')
  }
}

/**
 * get referrals in database
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.getReferrals = async (req, res) => {
  const { id } = req.params
  const query = await db.checkQueryString(req.query)
  if (query.search) {
    const search = query.search
    delete query.search
    query.$or = [{ companyName: { $regex: `.*${search}.*`, $options: 'i' } }]
  }
  query.refUser1Id = id

  let sort = null
  CONSTS.INVITE.REFERRALS_SORT_KEY.forEach(key => {
    if (query[key] && key !== 'status') {
      sort = { [key]: query[key] }
      delete query[key]
    }
  })
  const processQuery = opt => {
    opt.collation = { locale: 'en' }
    if (!!query && query.stat) {
      sort = { ...sort, status: query.stat }
      delete query.stat
    }
    if (sort === null) {
      sort = { createdAt: -1 }
    }
    return { ...opt, sort }
  }
  const data = await db.getItems(req, User, query, processQuery)
  res.status(200).json(data)
}

exports.getPublisherReferrals = async (req, res) => {
  const id = req.user._id
  const query = await db.checkQueryString(req.query)
  if (query.search) {
    const search = query.search
    delete query.search
    query.$or = [{ companyName: { $regex: `.*${search}.*`, $options: 'i' } }]
  }
  query.refUser1Id = id

  let sort = null
  CONSTS.INVITE.REFERRALS_SORT_KEY.forEach(key => {
    if (query[key] && key !== 'status') {
      sort = { [key]: query[key] }
      delete query[key]
    }
  })
  /**
   * TODO: Commissions Will be calculated by 5% for one-level referrer, 2.5% for two-level referrer.
   */
  const processQuery = opt => {
    opt.collation = { locale: 'en' }
    if (!!query && query.stat) {
      sort = { ...sort, status: query.stat }
      delete query.stat
    }
    if (sort === null) {
      sort = { createdAt: -1 }
    }
    return { ...opt, sort }
  }
  const data = await db.getItems(req, User, query, processQuery)
  res.status(200).json(data)
}
