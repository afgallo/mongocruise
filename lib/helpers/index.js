exports.buildQueryRequest = ({ skip, limit, sort, projection, find }) => {
  const result = {
    query: {},
    options: {}
  }

  try {
    result.options.skip = Number(skip || 0)
    result.options.limit = Number(limit || 0)
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
