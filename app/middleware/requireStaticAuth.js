
const utils = require('../middleware/utils')

module.exports = function (req, res, next) {
  try {
    const auth = req.headers.authorization.split(' ');
    if (auth.length >= 2 && auth[1] === process.env.STATIC_ACCESS_TOKEN) {
      next();
    } else {
      throw new Error('Wrong access token');
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}