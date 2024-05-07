exports.buildQueryRequest = ({ skip, limit, sort, projection, find }) => {
  const result = {
    query: {},
    options: {}
  }

  try {
    result.options.skip = skip || 0
    result.options.limit = limit || 100
    if (find) result.query = JSON.parse(find)
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
