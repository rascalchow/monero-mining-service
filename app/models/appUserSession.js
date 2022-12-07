const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const AppUserSessionSchema = new mongoose.Schema(
  {
    userKey: {
      type: String,
      required: true
    },
    startAt: {
      type: Date,
      default: Date.now
    },
    endAt: {
      type: Date
    },
    duration:{
      type: Number,
      default:0
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'AppUser',
      required: true
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

AppUserSessionSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AppUserSession', AppUserSessionSchema)
