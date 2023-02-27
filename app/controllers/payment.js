const RewardBlock = require('../models/rewardBlock')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')

/********************
 * Private functions *
 ********************/


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

  // 1. Deposit reward to Stealex account
  // 2. Calculate publisher rewards
  // 3. Transfer to publishers' account in selected currencies


  try {
    utils.handleSuccess(res, 201, {})
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}
