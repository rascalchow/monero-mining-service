const fs = require('fs')
const path = require('path')
const utils = require('../middleware/utils')
const { matchedData } = require('express-validator')
const uuid = require('uuid')
const model = require('../models/invite')
const { INVITE } = require('../consts')
const db = require('../middleware/db')

/**
 * Get profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.get = async (req, res) => {
  const id = req.user._id
  const query = await db.checkQueryString(req.query)
  if (query.search) {
    const search = query.search
    delete query.search
    query['$or'] = [
      { refereeEmail: { $regex: `.*${search}.*`, $options: 'i' } }
    ]
  }
  query.referrerId = id
  let sort = null
  INVITE.SORT_KEY.forEach(key => {
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
}
