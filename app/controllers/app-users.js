const { matchedData } = require('express-validator')
const AppUser = require('../models/appUser')
const Version = require('../models/version')
const User = require('../models/user')
const utils = require('../middleware/utils')
const CONSTS = require('../consts')
const db = require('../middleware/db')
const PublisherBalance = require('../models/publisherBalance')
const PublisherReward = require('../models/publisherReward')
const PublisherWithdraw = require('../models/publisherWithdraw')

const USER_KEY_LENGTH = 8
/*********************
 * Private functions *
 *********************/

/**
 * Generates a random unique user key
 */
const generateUserrKey = async () => {
  const alphaNumerics = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let key = ''
  for (let i = 0; i < USER_KEY_LENGTH; i++) {
    key += alphaNumerics.charAt(Math.floor(Math.random() * 36))
  }
  while ((await AppUser.find({ userKey: key }).length) > 0) {
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
const installApp = async req => {
  try {
    const user = await User.findOne({ publisherKey: req.publisherKey })
    if (!user) {
      throw utils.buildErrObject(400, 'UNKNOWN_PUBLISHER_KEY')
    }

    if (req.version) {
      const version = await Version.findOne({ version: req.version })
      if (!version) {
        throw utils.buildErrObject(400, 'VERSION_NUMBER_DOES_NOT_EXIST')
      }
    }

    const appUser = await AppUser.create({
      ...req,
      userKey: await generateUserrKey(),
      publisherKey: user.publisherKey,
      publisherId: user.id
    })

    return appUser
  } catch (error) {
    throw utils.buildErrObject(400, error.message)
  }
}

/**
 * Uninstall a app user
 * @param {ObjectId} id - appUser.id
 */

const uninstall = async req => {
  try {
    const appUser = await AppUser.findOne({ userKey: req.userKey })
    if (!appUser) {
      throw utils.buildErrObject(400, 'USER_KEY_IS_NOT_FOUND')
    }
    if (appUser.status === CONSTS.APP_USER.STATUS.UNINSTALLED) {
      throw utils.buildErrObject(400, 'USER_IS_ALREADY_UNINSTALLED')
    }
    appUser.status = CONSTS.APP_USER.STATUS.UNINSTALLED
    appUser.uninstalledAt = new Date()
    // appUser.installedAt = null
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
  const { device, operatingSystem } = req.body
  try {
    req = matchedData(req)
    req = { ...req, device, operatingSystem }
    const appUser = await installApp(req)
    // increment user installs
    try {
      await User.findOneAndUpdate(
        { publisherKey: req.publisherKey },
        { $inc: { installs: 1 } },
        { upsert: true }
      )
    } catch (error) {
      utils.handleError(res, error)
    }
    utils.handleSuccess(res, 201, appUser)
  } catch (error) {
    utils.handleErrorV2(res, error)
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
    // increment user uninstalls
    try {
      await User.findOneAndUpdate(
        { publisherKey: req.publisherKey },
        { $inc: { uninstalls: 1 } },
        { upsert: true }
      )
    } catch (error) {
      utils.handleError(res, error)
    }

    utils.handleSuccess(res, 203)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Fuction to get  the number of installed/uninstalled apps,  called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAppStats = async (req, res) => {
  try {
    const installed = await AppUser.count({
      publisherId: req.user.id,
      status: CONSTS.APP_USER.STATUS.INSTALLED
    })
    const uninstalled = await AppUser.count({
      publisherId: req.user.id,
      status: CONSTS.APP_USER.STATUS.UNINSTALLED
    })
    const devices = await AppUser.count({
      publisherId: req.user._id
    })
    const totalCount = await User.aggregate([
      {
        $group: {
          _id: null,
          totalLiveTime: { $sum: '$liveTime' },
          totalLive: { $sum: '$live' },
          totalInstalls: { $sum: '$installs' },
          totalUninstalls: { $sum: '$uninstalls' }
        }
      }
    ])
    const {
      totalLiveTime,
      totalLive,
      totalInstalls,
      totalUninstalls
    } = totalCount[0]
    const user = await db.getItem(req.user._id, User)
    const liveTimeRate = totalLiveTime == 0 ? 0 : user.liveTime / totalLiveTime
    const liveRate = totalLive == 0 ? 0 : user.live / totalLive
    const installsRate = totalInstalls == 0 ? 0 : user.installs / totalInstalls
    const uninstallsRate =
      totalUninstalls == 0 ? 0 : user.uninstalls / totalUninstalls;

    var today = new Date(); today.setHours(0, 0, 0, 0);

    const earnings = (await PublisherReward.aggregate([{
      $match: { createdAt: { $gte: today } }
    }, {
      $group: {
        _id: null,
        total: { $sum: "amount" },
      }
    }]))?.total || 0;
    const balance = (await PublisherBalance.findOne({ publisherId: req.user._id }))?.balance || 0;
    const lastPayment = (await PublisherWithdraw.findOne({ publisherId: req.user._id }, null, { sort: { createdAt: -1 } }))?.amount || 0;

    res.status(200).json({
      ...user.toObject(),
      earnings,
      installed,
      uninstalled,
      liveTimeRate,
      liveRate,
      installsRate,
      uninstallsRate,
      devices,
      lastPayment,
      balance,
    })
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Fuction to get  devices
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAppUsers = async (req, res) => {
  const { id } = req.params
  const { role } = req.user
  const query = await db.checkQueryString(req.query)
  if (query.search) {
    const search = query.search
    delete query.search
    if (role == 'admin') {
      query['$or'] = [
        { device: { $regex: `.*${search}.*`, $options: 'i' } },
        { userKey: { $regex: `.*${search}.*`, $options: 'i' } },
        { operatingSystem: { $regex: `.*${search}.*`, $options: 'i' } }
      ]
    } else {
      query['$or'] = [
        { device: { $regex: `.*${search}.*`, $options: 'i' } },
        { operatingSystem: { $regex: `.*${search}.*`, $options: 'i' } }
      ]
    }
  }
  query.publisherId = id
  let sort = null
  CONSTS.APP_USER.SORT_KEY.forEach(key => {
    if (query[key]) {
      sort = { [key]: query[key] }
      delete query[key]
    }
    if (sort == null) sort = { createdAt: -1 }
  })
  const processQuery = opt => {
    opt.collation = { locale: 'en' }
    return { ...opt, sort }
  }
  const data = await db.getItems(req, AppUser, query, processQuery)
  res.status(200).json(data)
}

exports.getInstalledUsers = async (req, res) => {
  const { param, type } = req.query
  const { id } = req.params
  const query = {
    $exists: true,
    $gte: new Date(param[0]),
    $lte: new Date(param[1])
  }
  try {
    const result = await AppUser.find({
      publisherId: id,
      status: type,
      installedAt: query
    })
    return res.status(200).json({
      info: result,
      count: filterAppUserInfo(result, param)
    })
  } catch (error) {
    throw utils.buildErrObject(422, error.message)
  }
}

const filterAppUserInfo = (installs, dates) => {
  const DAY = 86400000
  let duration = Math.round((new Date(dates[1]) - new Date(dates[0])) / DAY)
  const now = new Date()
  let result = []
  for (let i = 0; i < duration; i++) {
    let count = installs.filter(it => {
      let current = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      )
      const { installedAt } = it
      if (
        installedAt.getFullYear() == current.getUTCFullYear() &&
        installedAt.getMonth() == current.getUTCMonth() &&
        installedAt.getDate() == current.getUTCDate()
      ) {
        return true
      }
      return false
    }).length
    result[i] = count
    count = 0
  }
  return result
}

/**
 * Get current live time, date ranged live stats
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getPublisherInstallStats = async (req, res) => {
  const param = req.query
  const id = req.user._id
  const now = new Date()
  const query = {
    $exists: true,
    $gte: new Date(param[0]),
    $lte: new Date(param[1])
  }
  try {
    const chartRes = await AppUser.find({
      publisherId: id,
      status: 'installed',
      installedAt: query
    })
    const { result: processedResultForChart, max } = filterPublisherInstalls(chartRes, param)
    const installsCount = chartRes.length
    const uninstallsCount = await AppUser.count({
      publisherId: id,
      status: 'uninstalled',
      uninstalledAt: query
    })
    res.status(200).json({
      labels: Object.keys(processedResultForChart),
      data: Object.values(processedResultForChart),
      max,
      count: processedResultForChart.length,
      installsCount,
      uninstallsCount,
      retentionRate: (
        ((installsCount - uninstallsCount) / installsCount) *
        100
      ).toFixed(2)
    })
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

const filterPublisherInstalls = (installs, dates) => {
  const DAY = 86400000
  let duration = Math.round((new Date(dates[1]) - new Date(dates[0])) / DAY)
  const now = new Date()
  let result = {}, max = 0;
  for (let i = 0; i < duration; i++) {
    let current = new Date(new Date(dates[0]).valueOf() + i * DAY);
    let count = installs.filter(it => it.installedAt.toDateString() == current.toDateString()).length
    result[getLabel(current, 'month')] = count
    max = Math.max(max, count);
  }
  return { result, max }
}

const getLabel = (date, type) => {
  const timeOpt = {
    hour: 'numeric',
    hour12: false
  }
  const dateOpt = {
    month: 'numeric',
    day: 'numeric'
  }
  if (type == 'day') {
    return new Intl.DateTimeFormat('en-US', timeOpt).format(date)
  } else if (type == 'month') {
    return new Intl.DateTimeFormat('en-US', dateOpt).format(date)
  }
}

