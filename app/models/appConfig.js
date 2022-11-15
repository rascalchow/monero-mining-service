const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const AppConfigSchema = new mongoose.Schema(
  {
    eula: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

AppConfigSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AppConfig', AppConfigSchema)
