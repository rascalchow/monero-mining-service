const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const PublisherWithdrawSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: CONSTS.WITHDRAW.STATUSES,
      default: CONSTS.WITHDRAW.STATUS.INITIATED
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

PublisherWithdrawSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('PublisherWithdraw', PublisherWithdrawSchema)
