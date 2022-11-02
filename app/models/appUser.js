const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const AppUserSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: CONSTS.APP_USER.STATUSES,
      default: CONSTS.APP_USER.STATUS.INSTALLED
    },

    publisherKey: {
      type: String,
      required: true
    },
    publisherId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

AppUserSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AppUser', AppUserSchema)
