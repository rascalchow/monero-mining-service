const { matchedData } = require('express-validator')
const AppUserSession = require('../models/appUserSession')
const AppUser = require('../models/appUser')
const User = require('../models/user')
const utils = require('../middleware/utils')
const mongoose = require('mongoose')
const moment = require('moment')
const db = require('../middleware/db')
const CONSTS = require('../consts')
/********************
 * Public functions *
 ********************/

/**
 * Post start running function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.startRunning = async (req, res) => {
  try {
    req = matchedData(req)
    let sessions = await AppUserSession.find({ userKey: req.userKey })
    sessions.forEach(async it => {
      if (it.endAt == null) {
        utils.onSessionEnded(it)
      }
    })

    const appUser = await AppUser.findOne({ userKey: req.userKey })
    if (appUser.status == 'uninstalled') {
      throw utils.buildErrObject(400, 'DEVICE_ALREADY_UNINSTALLED')
    }
    req = {
      ...req,
      userId: appUser._id,
      publisherId: appUser.publisherId
    }
    let session = await AppUserSession.create(req)
    // increment live numbers to user
    try {
      await User.findByIdAndUpdate(
        appUser.publisherId,
        { $inc: { live: 1 } },
        { upsert: true }
      )
    } catch (error) {
      utils.handleError(res, error)
    }
    utils.handleSuccess(res, 201, session._id)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Post end running function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.endRunning = async (req, res) => {
  try {
    const sessionId = req.body['sessionId']
    if (sessionId) {
      let session = await AppUserSession.findById(sessionId)
      if (!session) {
        throw utils.buildErrObject(400, 'SESSION_ID_DOES_NOT_EXISTS')
      } else {
        if (session.endAt) {
          throw utils.buildErrObject(400, 'SESSION_IS_ALREADY_ENDED')
        }
        // set duration to terminated session
        utils.onSessionEnded(session)
      }
    } else {
      await AppUserSession.updateMany(
        { userKey: req.userKey, endAt: null },
        { endAt: new Date() }
      )
    }
    utils.handleSuccess(res, 203)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}
/**
 * Post running now function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.runningNow = async (req, res) => {
  const sessionId = req.body['sessionId']
  if (sessionId) {
    //update lastSeen
    try {
      const session = await AppUserSession.findById(sessionId)
      if (session.endAt) {
        throw utils.buildErrObject(422, 'SESSION_ENDED')
      }
      session.lastSeen = new Date()
      session.save()
      res.status(201).json(session)
    } catch (error) {
      utils.handleError(res, error)
    }
  } else {
    throw utils.buildErrObject(400, 'INVALID_REQUEST')
  }
}

/**
 * Get live time function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getLiveTime = async (req, res) => {
  const { param, dataType } = req.query
  const { id } = req.params
  const now = new Date()
  let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
  let allTime = new Date(now.getFullYear(), now.getMonth() - 3)
  const query = {
    $exists: true,
    $gte: new Date(param[0]),
    $lte: new Date(param[1])
  }
  const queryOneDay = {
    $exists: true,
    $gte: yesterday,
    $lte: now
  }
  const queryOneMonth = {
    $exists: true,
    $gte: lastMonth,
    $lte: now
  }
  const queryAll = {
    $exists: true,
    $gte: allTime,
    $lte: now
  }

  try {
    const chartRes = await AppUserSession.find({
      publisherId: id,
      endAt: query
    })
    const processedResult = filterLiveTimeInfo(chartRes, param)
    return res.status(200).json({
      labels: Object.keys(processedResult.data),
      data: Object.values(processedResult.data),
      max: processedResult.max,
      count: processedResult.count
    })
  } catch (error) {
    throw utils.buildErrObject(422, error.message)
  }
}
/**
 * Get current live time, date ranged live stats
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getPublisherLiveTimeStat = async (req, res) => {
  const { param } = req.query
  const id = req.user._id
  const now = new Date()
  let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
  let allTime = new Date(now.getFullYear(), now.getMonth() - 3)
  const query = {
    $exists: true,
    $gte: new Date(param[0]),
    $lte: new Date(param[1])
  }
  try {
    const chartRes = await AppUserSession.find({
      publisherId: id,
      $or: [
        {
          endAt: query
        },
        {
          endAt: {
            $exists: false
          },
          startAt: {
            $lte: new Date(param[1])
          }
        }
      ]
    })
    const processedResultForChart = filterLiveTimeInfo(chartRes, param)
    const activeSessionUserIds = await AppUserSession.aggregate([
      {
        $match: {
          publisherId: id,
          $or: [
            {
              endAt: query
            },
            {
              endAt: {
                $exists: false
              },
              startAt: {
                $lte: new Date(param[1])
              }
            }
          ]
        }
      },
      { $group: { _id: '$userId' } },
      {
        $project: {
          userId: 1
        }
      }
    ])
    const totalActiveUsers = activeSessionUserIds.length
    const current = (await User.findById(id)).live
    
    const todayBegin = new Date(new Date().toDateString())
    const todaySessions = await AppUserSession.find(
      {
          publisherId: id,
          $or: [
            {
              endAt: {
                $exists: true,
                $gte: todayBegin,
              }
            },
            {
              endAt: {
                $exists: false
              }
            }
          ]
      })

    const liveTimeSum = todaySessions.reduce((sum, cur) => {
      let start = Math.max(cur.startAt.valueOf(), todayBegin.valueOf());
      if (cur.endAt) return sum + (cur.endAt.valueOf() - start) / 1000;
      else return sum + (Date.now() - start) / 1000;
    }, 0)

    const appUserQuery = await db.checkQueryString(req.query)
    if (appUserQuery.search) {
      const search = appUserQuery.search
      delete appUserQuery.search
      appUserQuery['$or'] = [
        { device: { $regex: `.*${search}.*`, $options: 'i' } },
        { userKey: { $regex: `.*${search}.*`, $options: 'i' } },
        { operatingSystem: { $regex: `.*${search}.*`, $options: 'i' } }
      ]
    }
    appUserQuery.publisherId = id
    let sort = null
    CONSTS.APP_USER.SORT_KEY.forEach(key => {
      if (appUserQuery[key]) {
        sort = { [key]: appUserQuery[key] }
        delete appUserQuery[key]
      }
      if (sort == null) sort = { createdAt: -1 }
    })
    appUserQuery._id = {
      $in: activeSessionUserIds.map(it => it._id)
    }

    const processQuery = opt => {
      opt.collation = { locale: 'en' }
      return { ...opt, sort }
    }

    const activeUsers = await db.getItems(
      req,
      AppUser,
      appUserQuery,
      processQuery
    )

    res.status(200).json({
      labels: Object.keys(processedResultForChart.data),
      data: Object.values(processedResultForChart.data),
      max: processedResultForChart.max,
      count: processedResultForChart.count,
      current,
      activeUsers,
      totalActiveUsers,
      liveTimeSum
    })
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

const filterLiveTimeInfo = (sessions, dates) => {
  const DAY = 86400000
  sessions.sort((a, b) => {
    return b.duration - a.duration
  })
  const max = sessions[0]?.duration
  let count = 0
  sessions.forEach((install, index) => {
    count = count + install.duration
  })
  let duration = Math.round((new Date(dates[1]) - new Date(dates[0])) / DAY)

  const type = duration == 1 ? 'day' : 'month'
  duration = duration == 1 ? 24 : duration

  let toObject = {}
  sessions.forEach((install, index) => {
    let label = getLabel(install.endAt, type)
    let count = install.duration
    toObject = {
      ...toObject,
      [label]: toObject[label] ? toObject[label] + count : count
    }
  })
  let current = new Date(dates[0])
  let data = {}
  for (let i = 0; i < duration; i++) {
    if (type == 'month') {
      current = new Date(current.setDate(current.getDate() + 1))
    } else if (type == 'day') {
      current = new Date(current.setHours(current.getHours() + 1))
    }
    let label = getLabel(current, type)
    data[label] = toObject[label] ? toObject[label] : 0
  }
  return { data, max, count }
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

// const formatDuration = ty => {
//   console.log('formatDurartion')
//   const now = new Date()
//   let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
//   let lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
//   let all = new Date(now.getFullYear(), now.getMonth() - 3)
//   switch (ty) {
//     case '1day':
//       return [yesterday, now]
//     case '30day':
//       return [lastMonth, now]
//     case 'total':
//       return [all, now]
//     default:
//       return
//   }
// }
