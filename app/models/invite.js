const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const InviteSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    refereeEmail: {
      type: String,
      required: true
    },
    expired: {
      type: Boolean,
      default:false
    },
    code: {
      type: String
    },
    status: {
      type: String,
      enum: CONSTS.INVITE.STATUSES,
      default: CONSTS.INVITE.STATUS.INVITED
    },
    acceptedAt: {
      type: Date
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
InviteSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Invite', InviteSchema)
