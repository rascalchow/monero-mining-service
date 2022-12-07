const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const ProfileInfoSchema = new mongoose.Schema(
  {
    installs: {
      type: Number,
      default: 0
    },
    uninstalls: {
      type: Number,
      default: 0
    },
    live: {
      type: Number,
      default: 0
    },
    liveTime: {
      type: Number,
      default: 0
    },
    earnings: {
      type: Number,
      default: 0
    },
    referrals: {
      type: Number,
      default: 0
    },
    payments: {
      type: Number,
      default: 0
    },
    publisherId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ProfileInfoSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('ProfileInfo', ProfileInfoSchema)
