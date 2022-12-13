const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const AppUserSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: CONSTS.APP_USER.STATUSES,
      default: CONSTS.APP_USER.STATUS.INSTALLED
    },
    userKey: {
      type: String,
      required: true,
      unique: true
    },
    version: {
      type: String
    },
    device: {
      type: String
    },
    operatingSystem: {
      type: String
    },
    liveTime: {
      type: Number,
      default: 0
    },
    timeRatio: {
      type: Number,
      default: 0
    },
    currencyEarned: {
      type: Number,
      default: 0
    },
    currencySpent: {
      type: Number,
      default: 0
    },
    publisherKey: {
      type: String,
      required: true
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    device:{
      type: String,
    },
    operatingSystem:{
      type:String
    },
    publisherId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    installedAt: {
      type: Date,
      default: Date.now
    },
    uninstalledAt: {
      type: Date
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

AppUserSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AppUser', AppUserSchema)
