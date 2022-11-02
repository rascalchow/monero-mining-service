const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

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
