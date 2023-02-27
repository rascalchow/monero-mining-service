const { STEALTH: { API_KEY, BASE_URL } } = require('../consts');
const axios = require('axios');

const get = async (uri, query) => {
  return await axios.get(BASE_URL + uri, { params: { api_key: API_KEY, ...query } });
}

/**
 * Process Block Reward function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.availablePairs = async () => {
  return await get('pairs/xmr');
}
