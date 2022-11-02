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
    application: {
      type: String,
      required: true
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
    },
    eula: {
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
