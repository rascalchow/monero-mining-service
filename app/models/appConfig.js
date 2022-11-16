const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const AppConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String
    },
    data: {
      type: Object,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

AppConfigSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AppConfig', AppConfigSchema)
