const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const UserEulaSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    eula: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

UserEulaSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('UserEula', UserEulaSchema)
