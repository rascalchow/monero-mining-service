const { matchedData } = require('express-validator')
const AppUserSession = require('../models/appUserSession')
const AppUser = require('../models/appUser')
const User = require('../models/user')
const utils = require('../middleware/utils')
const mongoose = require('mongoose')
const moment = require('moment')
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
        it.endAt = new Date()
        onSessionEnded(it)
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
        session.endAt = new Date()
        // set duration to terminated session
        onSessionEnded(session)
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
      await AppUserSession.findByIdAndUpdate(
        { sessionId },
        {
          lastSeen: new Date()
        }
      )
    } catch (error) {
      utils.handleError(res, error)
    }
  } else {
    //find all sessions lastSeen is older than 10 mins
    //and update duration
    // const lastTime = moment()
    //   .subtract(10, 'minutes')
    //   .toISOString()
    // const terminatedSessions = await AppUserSession.find({
    //   lastSeen: { $lt: lastTime }
    // })
    // terminatedSessions.forEach(async session => {
    //   onSessionEnded(session)
    // })
    throw utils.buildErrObject(400, 'INVALID_REQUEST')
  }
}

const onSessionEnded = async session => {
  const start = moment(session.startAt)
  const end = moment(session.endAt)
  const duration = end.diff(start, 'seconds')
  session.duration = duration
  await session.save()

  const { userId, publisherId } = session
  if (!userId || !publisherId) {
    throw utils.buildErrObject(400, 'INVALID_SESSION')
  } else {
    try {
      // const totalLiveTime = (await AppUser.aggregate([{$group: {_id:null, total:{$sum:"$liveTime"}}}]))[0]['total']
      await AppUser.findByIdAndUpdate(userId, {
        $inc: { liveTime: session.duration }
      })
      await User.findByIdAndUpdate(publisherId, {
        $inc: { liveTime: session.duration, live: -1 } //
      })
      const totalLiveTime = (await User.findById(publisherId)).liveTime
      let appUsers = await AppUser.find({ liveTime: { $gt: 0 } })
      appUsers.forEach(async appUser => {
        appUser.timeRatio =
          totalLiveTime == 0
            ? 0
            : Math.round((appUser.liveTime * 100) / totalLiveTime)
        await appUser.save()
      })
    } catch (error) {
      throw utils.buildErrObject(422, error.message)
    }
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
    if (dataType == 'CHART') {
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
    } else if (dataType == 'STATIC') {
      const staticRes = await AppUserSession.aggregate().facet({
        daily: [
          {
            $match: {
              $and: [
                { publisherId: mongoose.Types.ObjectId(id) },
                { endAt: queryOneDay }
              ]
            }
          }
        ],
        monthly: [
          {
            $match: {
              $and: [
                { publisherId: mongoose.Types.ObjectId(id) },
                { endAt: queryOneMonth }
              ]
            }
          }
        ],
        all: [
          {
            $match: {
              $and: [
                { publisherId: mongoose.Types.ObjectId(id) },
                { endAt: queryAll }
              ]
            }
          }
        ]
      })
      const { daily, monthly, all } = staticRes[0]
      const dailyInfo = filterLiveTimeInfo(daily, [yesterday, now])
      const monthlyInfo = filterLiveTimeInfo(monthly, [lastMonth, now])
      const allInfo = filterLiveTimeInfo(all, [allTime, now])
      const data = {
        daily: {
          labels: Object.keys(dailyInfo.data),
          data: Object.values(dailyInfo.data),
          max: dailyInfo.max,
          count: dailyInfo.count
        },
        monthly: {
          labels: Object.keys(monthlyInfo.data),
          data: Object.values(monthlyInfo.data),
          max: monthlyInfo.max,
          count: monthlyInfo.count
        },
        all: {
          labels: Object.keys(allInfo.data),
          data: Object.values(allInfo.data),
          max: allInfo.max,
          count: allInfo.count
        }
      }
      return res.status(200).json(data)
    } else {
      throw utils.buildErrObject(400, 'BAD_REQUEST_OF_TYPE')
    }
  } catch (error) {
    throw utils.buildErrObject(422, error.message)
  }
}

const filterLiveTimeInfo = (installs, dates) => {
  const DAY = 86400000
  installs.sort((a, b) => {
    return b.duration - a.duration
  })
  const max = installs[0]?.duration
  let count = 0
  installs.forEach((install, index) => {
    count = count + install.duration
  })
  let duration = Math.round((new Date(dates[1]) - new Date(dates[0])) / DAY)

  const type = duration == 1 ? 'day' : 'month'
  duration = duration == 1 ? 24 : duration

  let toObject = {}
  installs.forEach((install, index) => {
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
