const RewardBlock = require('../models/rewardBlock')
const AppUserSession = require('../models/appUserSession')
const User = require('../models/user')
const PublisherBalance = require('../models/publisherBalance')
const PublisherReward = require('../models/publisherReward')
const PublisherWithdraw = require('../models/publisherWithdraw')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')
const { transfer, availableCurrenciesWithXMR, estimateExchange } = require('../services/stealthexApi')
const { STEALTHEX: { MONERO_REV_RATE } } = require('../consts');
const monerojs = require("monero-javascript");
const { MoneroNetworkType } = monerojs;
/********************
 * Private functions *
 ********************/

const rewardPublisher = async (publisherId, amount, rewardBlockId, reason, referralId) => {
  await PublisherBalance.updateOne({
    publisherId,
  }, {
    $inc: { balance: amount }
  }, { upsert: true });
  await PublisherReward.create({
    publisherId,
    amount,
    rewardBlockId,
    reason,
    referralId,
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Process Block Reward function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
// 47pD7i1m8YW53KkTJ8XEAf3Zk3c9hfe3S9CS4zG596eBNLHzQHN5AkdZ6rhH6MJjU6Ck5sXRq7v1T7UWZsuYRmtA1A2owBw
// BceiPLaX7YDevCfKvgXFq8Tk1BGkQvtfAWCWJGgZfb6kBju1rDUCPzfDbHmffHMC5AZ6TxbgVVkyDFAnD2AVzLNp37DFz32
exports.onBlockReward = async (req, res) => {
  let walletRpc = await monerojs.connectToWalletRpc("http://localhost:28084", "rpc", "euphoria");
  try {
    await walletRpc.openWallet("nurev2", "password");
  } catch (e) {
    res.status(200).send('fail')
  }
  let primaryAddress = await walletRpc.getPrimaryAddress(); // 555zgduFhmKd2o8rPUz...
  let mnemonic = await walletRpc.getMnemonic(); // 555zgduFhmKd2o8rPUz...
  let balance = await walletRpc.getBalance();               // 533648366742
  let txs = await walletRpc.getTxs();

  let createdTx = await walletRpc.createTx({
    accountIndex: 0,
    address: receipant
    amount: new monerojs.BigInteger("5000000"), // amount to transfer in atomic units
    relay: false // create transaction and relay to the network if true
  });
  let fee = createdTx.getFee(); // "Are you sure you want to send... ?"
  await walletRpc.relayTx(createdTx); // relay the transaction


  utils.handleSuccess(res, 201, { primaryAddress, mnemonic, balance })

  await walletRpc.close();
  return;

  req = matchedData(req)

  try {
    const lastReward = await RewardBlock.findOne({
    }, null, {
      sort: {
        createdAt: -1
      }
    });
    const lastRewardTime = lastReward ? lastReward.createdAt : new Date(0);

    // 1. Insert to RewardBlock table
    const reward = await RewardBlock.create({ value: req.monero });
    const publisherRewardInRev = reward.value * MONERO_REV_RATE * 0.75;
    let masterRewardInRev = reward.value * MONERO_REV_RATE * 0.25;

    // 2. Calculate publishers rewards

    const master = await User.findOne({ isPrimary: true });
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


    // 3. Insert Publisher Reward record
    // 4. Update publisher balance
    if (totalLiveTime == 0) { // Just in case new block is mined without app running
      masterRewardInRev = reward.value * MONERO_REV_RATE;
    } else {
      const rewardPromises = [];
      for (pubId in publishersLiveTime) {
        let amount = publisherRewardInRev * publishersLiveTime[pubId] / totalLiveTime;
        rewardPromises.push(rewardPublisher(pubId, amount, reward._id, 'livetime', null));
        const pub = await User.findById(pubId);
        if (pub.refUser1Id) {
          rewardPromises.push(rewardPublisher(pub.refUser1Id, amount * 0.05, reward._id, 'affiliate', pubId));
          masterRewardInRev -= amount * 0.05;
        }
        if (pub.refUser2Id) {
          rewardPromises.push(rewardPublisher(pub.refUser2Id, amount * 0.025, reward._id, 'affiliate', pubId));
          masterRewardInRev -= amount * 0.025;
        }
      }
      await Promise.all(rewardPromises);
    }

    rewardPublisher(master._id, masterRewardInRev, reward._id, 'master', null);


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
    const publisher = req.user;
    const balance = (await PublisherBalance.findOne({ publisherId: publisher._id }))?.balance || 0;
    if (balance == 0) throw "No balance to withdraw";

    // 2. Update publisher balance
    await PublisherBalance.updateMany({ publisherId: publisher._id }, { balance: 0 });
    // 3. Insert publisher record
    await PublisherWithdraw.create({ publisherId: publisher._id, balance });
    // 4. Transfer funds to publisher's Stealthex account
    await transfer(req.payoutAddress, publisher.payoutCurrency, balance);
    utils.handleSuccess(res, 201, {})
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

exports.listCurrencies = async (req, res) => {
  req = matchedData(req)

  try {
    const currencies = await availableCurrenciesWithXMR();
    utils.handleSuccess(res, 201, currencies)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

exports.estimateExchange = async (req, res) => {
  req = matchedData(req)

  try {
    const publisher = req.user;
    const balance = (await PublisherBalance.findOne({ publisherId: publisher._id }))?.balance || 0;
    const amount = await estimateExchange('xmr', publisher.payoutCurrency, balance);
    utils.handleSuccess(res, 201, amount)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }

}