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

  // 0. Insert to RewardBlock table
  // 1. Deposit reward to Stealex account
  // 2. Calculate publishers rewards
  // 3. Increse publishers balance in PublisherBalance
  // 4. Update publisher balance


  try {
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

  // 1. Calculate the balance
  // 2. Update publisher balance
  // 3. Insert publisher record
  // 4. Transfer funds to publisher's Stealthex account

  try {
    utils.handleSuccess(res, 201, {})
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}