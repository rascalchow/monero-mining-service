const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONSTS = require('../consts')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: 'EMAIL_IS_NOT_VALID'
      },
      lowercase: true,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: CONSTS.USER.ROLES,
      default: CONSTS.USER.ROLE.PUBLISHER
    },
    status: {
      type: String,
      enum: CONSTS.USER.STATUES,
      default: CONSTS.USER.STATUS.PENDING
    },
    verification: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    blockExpires: {
      type: Date,
      default: Date.now,
      select: false
    },
    publisherKey: {
      type: String,
      required: true,
      unique: true
    },

    // User Profile
    companyName: {
      type: String,
      required: true
    },
    companyLogo: {
      type: String
    },
    application: {
      type: String,
      required: true
    },
    currencyName: {
      type: String
    },
    productIcon: {
      type: String
    },
    installer: {
      type: String
    },
    userPercentage: {
      type: Number,
      default: 0.0
    },
    numberOfVirtualCoins: {
      type: Number,
      default: 0
    },
    contact: {
      type: String,
      required: true
    },
    country: {
      type: String
    },
    instantMessenger: {
      type: String
    },
    website: {
      type: String,
      required: true
    },
    moreInformation: {
      type: String
    },

    //Profile Info
    installs: {
      type: Number,
      default: 0,
      min: 0
    },
    uninstalls: {
      type: Number,
      default: 0,
      min: 0
    },
    live: {
      type: Number,
      default: 0,
      min: 0
    },
    liveTime: {
      type: Number,
      default: 0,
      min: 0
    },
    earnings: {
      type: Number,
      default: 0,
      min: 0
    },
    referrals: {
      type: Number,
      default: 0,
      min: 0
    },
    payments: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

const hashPassword = (user, salt, next) => {
  bcrypt.hash(user.password, salt, null, (error, newHash) => {
    if (error) {
      return next(error)
    }
    user.password = newHash
    console.log(`${JSON.stringify(user, 2)} password changed`)
    return next()
  })
}

const genSaltPassword = (user, SALT_FACTOR, next) => {
  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) {
      return next(err)
    }
    return hashPassword(user, salt, next)
  })
}

UserSchema.pre('save', function(next) {
  const that = this
  const SALT_FACTOR = 5
  if (!that.isModified('password')) {
    return next()
  } else {
    return genSaltPassword(that, SALT_FACTOR, next)
  }
})

UserSchema.methods.comparePassword = function(passwordAttempt, cb) {
  bcrypt.compare(passwordAttempt, this.password, (err, isMatch) =>
    err ? cb(err) : cb(null, isMatch)
  )
}

UserSchema.statics.checkPassword = async function(email, password) {
  const user = await this.findOne({ email }, 'password')
  if (!user) {
    throw new Error({ message: 'no user' })
  }
  return bcrypt.compareSync(password, user.password)
}

UserSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('User', UserSchema)
