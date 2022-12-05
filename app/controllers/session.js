const { matchedData } = require('express-validator')
const AppUserSession = require('../models/appUserSession')
const utils = require('../middleware/utils')
const mongoose = require('mongoose')
/********************
 * Public functions *
 ********************/

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.startRunning = async (req, res) => {
  try {
    req = matchedData(req)
    await AppUserSession.updateMany(
      { userKey: req.userKey, endAt: null },
      { endAt: new Date() }
    )

    session = await AppUserSession.create(req)
    utils.handleSuccess(res, 201, session._id)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.endRunning = async (req, res) => {
  try {
    req = matchedData(req)
    if (req.sessionId) {
      let session = await AppUserSession.findById(req.sessionId)
      if (!session) {
        throw utils.buildErrObject(400, 'SESSION_ID_DOES_NOT_EXISTS')
      } else {
        if (session.endAt) {
          throw utils.buildErrObject(400, 'SESSION_IS_ALREADY_ENDED')
        }
        session.endAt = new Date()
        await session.save()
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
    }
  } catch (error) {
    throw buildErrObject(422, err.message)
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
