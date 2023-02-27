const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const RewardBlockSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true
  }
)

RewardBlockSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('RewardBlock', RewardBlockSchema)
