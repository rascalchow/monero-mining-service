const model = require('../models/userProfile')
const fs = require('fs')
const path = require('path')
const utils = require('../middleware/utils')
const { matchedData } = require('express-validator')
const uuid = require('uuid')

const { FILE_UPLOAD_DIR } = require('../consts')

/**
 * Get profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.get = async (req, res) => {
  try {
    const product = await model.findById(req.user.userProfileId)
    utils.handleSuccess(res, 200, product)
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}

/**
 * Update profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.update = async (req, res) => {
  try {
    const data = matchedData(req)
    const { companyLogo, productIcon } = req.files
    const product = await model.findById(req.user.userProfileId)

    const dirPath = path.join(
      global.APP_ROOT,
      FILE_UPLOAD_DIR,
      'product',
      req.user.userProfileId.toString()
    )
    const imgPath = {}

    if (!fs.existsSync(dirPath)) {
      fs.mkdir(dirPath)
    }
    if (companyLogo) {
      if (
        product.companyLogo &&
        fs.existsSync(
          path.join(global.APP_ROOT, FILE_UPLOAD_DIR, product.companyLogo)
        )
      ) {
        try {
          fs.rmSync(
            path.join(global.APP_ROOT, FILE_UPLOAD_DIR, product.companyLogo)
          )
        } catch (error) {
          console.log(error)
        }
      }
      imgPath.companyLogo = path.join(
        'product',
        product._id.toString(),
        uuid() + companyLogo.name
      )
      fs.createReadStream(companyLogo.path).pipe(
        fs.createWriteStream(
          path.join(global.APP_ROOT, FILE_UPLOAD_DIR, imgPath.companyLogo)
        )
      )
    }

    if (productIcon) {
      if (
        product.productIcon &&
        fs.existsSync(
          path.join(global.APP_ROOT, FILE_UPLOAD_DIR, product.productIcon)
        )
      ) {
        try {
          fs.rmSync(
            path.join(global.APP_ROOT, FILE_UPLOAD_DIR, product.productIcon)
          )
        } catch (error) {
          console.log(error)
        }
      }
      imgPath.productIcon = path.join(
        'product',
        product._id.toString(),
        uuid() + productIcon.name
      )
      fs.createReadStream(productIcon.path).pipe(
        fs.createWriteStream(
          path.join(global.APP_ROOT, FILE_UPLOAD_DIR, imgPath.productIcon)
        )
      )
    }

    utils.handleSuccess(
      res,
      201,
      await model.findByIdAndUpdate(
        product._id,
        {
          productName: data.productName,
          currencyName: data.currencyName,
          userPercentage: data.userPercentage,
          numberOfVirtualCoins: data.numberOfVirtualCoins,
          ...imgPath
        },
        { new: true }
      )
    )
  } catch (error) {
    utils.handleErrorV2(res, error)
  }
}
