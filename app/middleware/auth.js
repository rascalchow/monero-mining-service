const crypto = require('crypto')
const algorithm = 'aes-256-ecb'
const secret = process.env.JWT_SECRET
const utils = require('./utils')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

module.exports = {
  /**
   * Checks is password matches
   * @param {string} password - password
   * @param {Object} user - user object
   * @returns {boolean}
   */
  async checkPassword(email, password) {
    try {
      if (await User.checkPassword(email, password)) {
        return true
      }
      return false
    } catch (error) {
      throw utils.buildErrObject(404, 'EMAIL_IS_NOT_REGISTERED')
    }
  },

  /**
   * Encrypts text
   * @param {string} text - text to encrypt
   */
  encrypt(text) {
    const cipher = crypto.createCipher(algorithm, secret)
    let crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex')
    return crypted
  },

  /**
   * Decrypts text
   * @param {string} text - text to decrypt
   */
  decrypt(text) {
    const decipher = crypto.createDecipher(algorithm, secret)
    try {
      let dec = decipher.update(text, 'hex', 'utf8')
      dec += decipher.final('utf8')
      return dec
    } catch (err) {
      return err
    }
  },

  /**
   * Verify token
   * @param {string} token
   */
  verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          reject(err)
        }

        resolve(decoded)
      })
    })
  }
}
