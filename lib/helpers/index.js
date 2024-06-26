const { ObjectId: MongoObjectId } = require('mongodb')

exports.buildQueryRequest = ({ skip, limit, sort, projection, find }) => {
  const result = {
    query: {},
    options: {}
  }

  try {
    result.options.skip = skip || 0
    result.options.limit = limit || 100
    if (find) result.query = JSON.parse(find)
    // URL encoded _id is converted to ObjectId as it will be sent as string
    if (result?.query?._id && result.query._id.$in) {
      result.query._id.$in = result.query._id.$in.map((id) => MongoObjectId.createFromHexString(id))
    } else if (typeof result?.query?._id === 'string') {
      result.query._id = MongoObjectId.createFromHexString(result.query._id)
    }

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
