const RewardBlock = require('../models/rewardBlock')
const AppUserSession = require('../models/appUserSession')
const User = require('../models/user')
const PublisherBalance = require('../models/publisherBalance')
const PublisherReward = require('../models/publisherReward')
const PublisherWithdraw = require('../models/publisherWithdraw')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')

/********************
 * Private functions *
 ********************/

const rewardPublisher = async (publisherId, amount, rewardBlockId, reason, refferalId) => {
  await PublisherBalance.update({
    publisherId,
  }, {
    $inc: { balance: amount }
  });
  await new PublisherReward({
    publisherId,
    amount,
    rewardBlockId,
    reason,
    referralId,
  }).save()
}

/********************
 * Public functions *
 ********************/

/**
 * Process Block Reward function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.onBlockReward = async (req, res) => {
  req = matchedData(req)

  try {
    const lastReward = await RewardBlock.findOne({
    }, null, {
      sort: {
        createdAt: -1
      }
    });
    console.log({ lastReward });
    const lastRewardTime = lastReward ? lastReward.createdAt : new Date(0);

    // 1. Insert to RewardBlock table
    const reward = await RewardBlock.create({ value: req.monero });
    const publisherRewardInRev = reward.value * process.env.MONERO_REV_RATE * 0.75;
    const masterRewardInRev = reward.value * process.env.MONERO_REV_RATE * 0.25;

    // 2. Calculate publishers rewards
    const master = await User.findOne({ isPrimary: true });
    rewardPublisher(master._id, masterRewardInRev, reward._id, 'master', null);


    const availableSessions = await AppUserSession.find({
      $or: [
        { endAt: { $gte: lastRewardTime } },
        { endAt: null }],
      publisherId: { $ne: master._id }
    })
    const publishersLiveTime = {};
    let totalLiveTime = 0;
    availableSessions.forEach(session => {
      const points = ((session.endAt || new Date()).valueOf() - lastRewardTime.valueOf()) -
        Math.max((session.startAt.valueOf() - lastRewardTime.valueOf()), 0);
      publishersLiveTime[session.publisherId] = (publishersLiveTime[session.publisherId] || 0) + points;
      totalLiveTime += points;
    })

    console.log({ publishers: publishersLiveTime })
    console.log({ sessions: availableSessions })

    // 3. Insert Publisher Reward record
    // 4. Update publisher balance
    const updates = [];
    for (pubId in publishersLiveTime) {
      const amount = publisherRewardInRev * publishersLiveTime[pubId] / totalLiveTime;
      updates.push(rewardPublisher(pubId, amount, reward._id, 'livetime', null));
    }
    await Promise.all(updates);

    utils.handleSuccess(res, 201, {})
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Publisher Reward function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.withdraw = async (req, res) => {
  req = matchedData(req)

  try {
    // 1. Get the balance
    const publisher = await User.findById(req.user._id);
    // 2. Update publisher balance
    // 3. Insert publisher record
    // 4. Transfer funds to publisher's Stealthex account
    utils.handleSuccess(res, 201, {})
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}