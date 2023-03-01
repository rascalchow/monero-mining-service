const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const PublisherRewardSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    amount: { // newly added rev balance
      type: Number,
      required: true,
    },
    rewardBlockId: { //  id of reward block how this publisher got paid
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      enum: ['livetime', 'master', 'affiliate'],
      default: 'livetime',
      required: true,
    },
    referralId: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true
  }
)

PublisherRewardSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('PublisherReward', PublisherRewardSchema)
