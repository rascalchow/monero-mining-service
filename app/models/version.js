const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const VersionSchema = new mongoose.Schema(
  {
    version: {
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

VersionSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Version', VersionSchema)
