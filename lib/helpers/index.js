const { ObjectId: MongoObjectId } = require('mongodb')

const convertToObjectId = (id) => MongoObjectId.createFromHexString(id)

const processQueryId = (query) => {
  if (query._id) {
    if (query._id.$in && Array.isArray(query._id.$in)) {
      query._id.$in = query._id.$in.map(convertToObjectId)
    } else if (typeof query._id === 'string') {
      query._id = convertToObjectId(query._id)
    }
  }

  return query
}

exports.buildQueryRequest = ({ skip, limit, sort, projection, find }) => {
  const result = {
    query: {},
    options: {}
  }

  try {
    result.options.skip = skip || 0
    result.options.limit = limit || 100
    if (find) result.query = JSON.parse(find)
    result.query = processQueryId(result.query)

    if (sort) result.options.sort = JSON.parse(sort)
    if (projection) result.options.projection = JSON.parse(projection)
  } catch (error) {
    return { error: `Invalid JSON format: ${error.message}` }
  }

  return result
}

exports.getQueryParamValue = (queryParam, request, ObjectId) => {
  const params = request.params[queryParam]
  return ObjectId.isValid(params) ? new ObjectId(params) : params
}
