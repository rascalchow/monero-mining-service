const { STEALTHEX: { API_KEY, BASE_URL } } = require('../consts');
const axios = require('axios');

const get = async (uri, query) => {
  return await axios.get(BASE_URL + uri, { params: { api_key: API_KEY, ...query } });
}
const post = async (uri, body) => {
  return await axios.post(BASE_URL + uri, body, { params: { api_key: API_KEY } });
}

/**
 * Process Block Reward function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.availablePairs = async () => {
  return await get('pairs/xmr');
}

exports.transfer = async (address, currency, amount) => {
  const exchange = await post('exchange', {
    currency_from: 'xmr', // Monero token
    currency_to: currency,
    address_to: address,
    amount_from: amount,
  });
  console.log({ exchange })
  if (amount != exchange.expected_amount) {
    throw "Something went wrong!"
  }
  // transfer from process.env.MONERO_MINER_WALLET to exchange.address_from
  // Should be discussed
}