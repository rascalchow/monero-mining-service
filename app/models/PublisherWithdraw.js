const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const PublisherWithdrawSchema = new mongoose.Schema(
  {
    publisherId: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true
  }
)

PublisherWithdrawSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('PublisherWithdraw', PublisherWithdrawSchema)
