const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const PublisherBalanceSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.ObjectId,
      required: true
    },
    balance: {
      // newly added rev balance
      type: Number,
      default: 0
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

PublisherBalanceSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('PublisherBalance', PublisherBalanceSchema)
