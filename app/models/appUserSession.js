const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const AppUserSessionSchema = new mongoose.Schema(
  {
    userKey: {
      type: String,
      required: true,
      unique: true,
    },
    startAt: {
      type: Date,
      default: Date.now,
    },
    endAt: {
      type: Date,
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

AppUserSessionSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AppUserSession', AppUserSessionSchema)
