const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const UserProfileSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true
    },
    companyLogo: {
      type: String
    },
    application: {
      type: String,
      required: true
    },
    currencyName: {
      type: String
    },
    productIcon: {
      type: String
    },
    installer: {
      type: String
    },
    userPercentage: {
      type: Number,
      default: 0.0
    },
    numberOfVirtualCoins: {
      type: Number,
      default: 0
    },
    contact: {
      type: String,
      required: true
    },
    country: {
      type: String
    },
    instantMessenger: {
      type: String
    },
    website: {
      type: String,
      required: true
    },
    moreInformation: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

UserProfileSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('UserProfile', UserProfileSchema)
