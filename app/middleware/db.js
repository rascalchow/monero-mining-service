const {
  buildSuccObject,
  buildErrObject,
  itemNotFound
} = require('../middleware/utils')

/**
 * Builds sorting
 * @param {string} sort - field to sort from
 * @param {number} order - order for query (1,-1)
 */
const buildSort = (sort, order) => {
  const sortBy = {}
  sortBy[sort] = order
  return sortBy
}

const buildPopulate = populate => {
  if (!populate) {
    return null
  }

  if (populate.indexOf('{') == -1 && populate.indexOf('[') == -1) {
    return populate
  }

  try {
    const result = JSON.parse(populate)
    if (result) {
      return result
    } else {
      return populate
    }
  } catch (err) {
    console.log(err)
    // Do nothing
    return null
  }
}
/**
 * Hack for mongoose-paginate, removes 'id' from results
 * @param {Object} result - result object
 */
const cleanPaginationID = result => {
  result.docs.map(element => delete element.id)
  return result
}
const listInitOptions = req => {
  return new Promise(resolve => {
    const order = req.query.order || -1
    const sort = req.query.sort || 'createdAt'
    const sortBy = buildSort(sort, order)
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 5
    const populate = buildPopulate(req.query.populate)
    const search = JSON.parse(req.query.filter)['search']
    const options = {
      select: req.query.fields,
      sort: sortBy,
      lean: true,
      page,
      limit,
      search
    }

    if (populate) {
      options.populate = populate
    }
    resolve(options)
  })
}
/**
 * Builds initial options for query
 * @param {Object} query - query object
 */

module.exports = {
  /**
   * Checks the query string for filtering records
   * query.filter should be the text to search (string)
   * query.fields should be the fields to search into (array)
   * @param {Object} query - query object
   */
  async checkQueryString(query) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof query.filter !== 'undefined') {
          if (query.filter === '') {
            return resolve({})
          }

          const filter = JSON.parse(query.filter)
          resolve(filter)
        } else {
          resolve({})
        }
      } catch (err) {
        console.log(err.message)
        reject(buildErrObject(422, 'ERROR_WITH_FILTER'))
      }
    })
  },

  /**
   * Gets items from database
   * @param {Object} req - request object
   * @param {Object} query - query object
   */
  async getItems(req, model, query, processQuery) {
    const options = await listInitOptions(req)
    const processedOpt = processQuery ? processQuery(options) : options
    return new Promise((resolve, reject) => {
      model.paginate(query, processedOpt, (err, items) => {
        if (err) {
          reject(buildErrObject(422, err.message))
        }
        resolve(cleanPaginationID(items))
      })
    })
  },

  /**
   * Gets item from database by id
   * @param {string} id - item id
   */
  async getItem(id, model, populate) {
    let item = null
    try {
      let q = model.findById(id)
      if (populate) {
        q.populate(populate)
      }
      item = await q.exec()
    } catch (error) {
      throw buildErrObject(422, err.message)
    }
    if (item) {
      return item
    }
    throw buildErrObject(404, 'NOT_FOUND')
  },

  /**
   * Creates a new item in database
   * @param {Object} req - request object
   */
  async createItem(req, model) {
    return new Promise((resolve, reject) => {
      model.create(req, (err, item) => {
        if (err) {
          reject(buildErrObject(422, err.message))
        }
        resolve(item)
      })
    })
  },

  /**
   * Updates an item in database by id
   * @param {string} id - item id
   * @param {Object} req - request object
   */
  async updateItem(id, model, req) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        id,
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },

  /**
   * Deletes an item from database by id
   * @param {string} id - id of item
   */
  async deleteItem(id, model) {
    return new Promise((resolve, reject) => {
      model.findByIdAndRemove(id, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(buildSuccObject('DELETED'))
      })
    })
  }
}
